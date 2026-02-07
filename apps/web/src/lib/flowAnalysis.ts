import type { PlacedBuilding, Connection } from "@/store/types";
import { getBuildingDef, getRecipe, getConveyorTier, getPipeTier } from "@/data";

// ---------- Types ----------

export type NodeStatus = "ok" | "warning" | "error" | "bottleneck" | "overproducing" | "idle";

export interface PortFlow {
	portId: string;
	demanded: number;
	actual: number;
}

export interface NodeAnalysis {
	status: NodeStatus;
	inputFlows: PortFlow[];
	outputFlows: PortFlow[];
	totalOutputCapacity: number;
	totalDownstreamDemand: number;
}

export interface EdgeAnalysis {
	flow: number;
	capacity: number;
	demanded: number;
	status: "ok" | "bottleneck" | "overproducing" | "overcapacity" | "idle";
}

export interface FlowAnalysisResult {
	nodes: Record<string, NodeAnalysis>;
	edges: Record<string, EdgeAnalysis>;
}

// IDs of buildings that act as splitters (1 in → N out, divide evenly)
const SPLITTER_IDS = new Set([
	"splitter",
	"smart-splitter",
	"programmable-splitter",
]);

// IDs of buildings that act as mergers (N in → 1 out, sum inputs)
const MERGER_IDS = new Set(["merger", "priority-merger"]);

// IDs of pass-through logistics (1 in → 1 out)
const PASSTHROUGH_IDS = new Set([
	"conveyor-belt",
	"conveyor-floor-hole",
	"pipeline",
	"pipeline-floor-hole",
]);

// Pipeline junction: multi-in / multi-out, treat as combined merger+splitter
const JUNCTION_IDS = new Set(["pipeline-junction"]);

// Storage buildings: pass-through if both sides connected, sink if only input
const STORAGE_IDS = new Set([
	"storage-container",
	"industrial-storage-container",
	"fluid-buffer",
	"industrial-fluid-buffer",
	"dimensional-depot",
]);

// Sink buildings: infinite demand on inputs
const SINK_IDS = new Set(["awesome-sink"]);

// ---------- Analysis ----------

export function analyzeFlow(
	buildings: Record<string, PlacedBuilding>,
	connections: Record<string, Connection>,
): FlowAnalysisResult {
	const result: FlowAnalysisResult = { nodes: {}, edges: {} };

	// Build adjacency: which edges go out from / in to each instance
	const outEdges: Record<string, Connection[]> = {};
	const inEdges: Record<string, Connection[]> = {};

	for (const conn of Object.values(connections)) {
		(outEdges[conn.sourceInstanceId] ??= []).push(conn);
		(inEdges[conn.targetInstanceId] ??= []).push(conn);
	}

	// Port actual output rates (computed during forward propagation)
	const portActual: Record<string, number> = {};

	// Port demanded rates (from recipe/config)
	const portDemand: Record<string, number> = {};

	// Port downstream demand (computed during backward propagation)
	const portDownstreamDemand: Record<string, number> = {};

	// Topological sort via Kahn's algorithm
	const allIds = Object.keys(buildings);
	const inDegree: Record<string, number> = {};
	for (const id of allIds) inDegree[id] = 0;
	for (const conn of Object.values(connections)) {
		inDegree[conn.targetInstanceId] =
			(inDegree[conn.targetInstanceId] ?? 0) + 1;
	}

	const queue: string[] = [];
	for (const id of allIds) {
		if ((inDegree[id] ?? 0) === 0) queue.push(id);
	}

	const sorted: string[] = [];
	while (queue.length > 0) {
		const id = queue.shift()!;
		sorted.push(id);
		for (const conn of outEdges[id] ?? []) {
			inDegree[conn.targetInstanceId]--;
			if (inDegree[conn.targetInstanceId] === 0) {
				queue.push(conn.targetInstanceId);
			}
		}
	}

	// Add any buildings not reached (cycles) at the end
	for (const id of allIds) {
		if (!sorted.includes(id)) sorted.push(id);
	}

	// ==========================================
	// FORWARD PASS: propagate actual flow rates
	// ==========================================

	// Temporary storage for per-node flows (used for status later)
	const nodeInputFlows: Record<string, PortFlow[]> = {};
	const nodeOutputFlows: Record<string, PortFlow[]> = {};

	for (const instanceId of sorted) {
		const building = buildings[instanceId];
		if (!building) continue;

		const def = getBuildingDef(building.buildingId);
		if (!def) continue;

		const isSource = def.category === "source";
		const isLogistics = def.category === "logistics";
		const isStorage = STORAGE_IDS.has(building.buildingId);
		const isSink = SINK_IDS.has(building.buildingId);
		const isSplitter =
			SPLITTER_IDS.has(building.buildingId) ||
			JUNCTION_IDS.has(building.buildingId);
		const isMerger = MERGER_IDS.has(building.buildingId);
		const isPassthrough = PASSTHROUGH_IDS.has(building.buildingId);

		const inputPorts = def.ports.filter((p) => p.direction === "input");
		const outputPorts = def.ports.filter((p) => p.direction === "output");

		const mult = building.overclockPercent / 100;
		const incoming = inEdges[instanceId] ?? [];
		const outgoing = outEdges[instanceId] ?? [];

		const inputFlows: PortFlow[] = [];
		const outputFlows: PortFlow[] = [];

		if (isSource) {
			const rate = (building.sourceRate ?? 0) * mult;
			for (const port of outputPorts) {
				const key = `${instanceId}:${port.id}`;
				const isConnected = (outEdges[instanceId] ?? []).some(
					(e) => e.sourcePortId === port.id,
				);
				if (isConnected) {
					portActual[key] = rate;
					portDemand[key] = rate;
					outputFlows.push({ portId: port.id, demanded: rate, actual: rate });
				} else {
					portActual[key] = 0;
					outputFlows.push({ portId: port.id, demanded: 0, actual: 0 });
				}
			}
		} else if (isSink) {
			// Sink: absorb all input, no output — demand matches supply (no upstream pressure)
			for (const port of inputPorts) {
				const edge = incoming.find((e) => e.targetPortId === port.id);
				const received = edge
					? portActual[`${edge.sourceInstanceId}:${edge.sourcePortId}`] ?? 0
					: 0;
				const tierLimit = edge ? getEdgeTierLimit(edge) : Infinity;
				const actual = Math.min(received, tierLimit);
				const key = `${instanceId}:${port.id}`;
				portDemand[key] = actual;
				inputFlows.push({ portId: port.id, demanded: actual, actual });
			}
		} else if (isStorage) {
			// Storage: pass-through (input → output)
			let totalInput = 0;
			for (const port of inputPorts) {
				const edge = incoming.find((e) => e.targetPortId === port.id);
				const received = edge
					? portActual[`${edge.sourceInstanceId}:${edge.sourcePortId}`] ?? 0
					: 0;
				const tierLimit = edge ? getEdgeTierLimit(edge) : Infinity;
				const actual = Math.min(received, tierLimit);
				totalInput += actual;
				inputFlows.push({ portId: port.id, demanded: 0, actual });
			}
			for (const port of outputPorts) {
				const key = `${instanceId}:${port.id}`;
				portActual[key] = totalInput / Math.max(1, outputPorts.length);
				outputFlows.push({ portId: port.id, demanded: 0, actual: portActual[key] });
			}
		} else if (isLogistics) {
			let totalInput = 0;
			for (const port of inputPorts) {
				const edge = incoming.find((e) => e.targetPortId === port.id);
				const received = edge
					? portActual[`${edge.sourceInstanceId}:${edge.sourcePortId}`] ?? 0
					: 0;
				const tierLimit = edge ? getEdgeTierLimit(edge) : Infinity;
				const actual = Math.min(received, tierLimit);
				totalInput += actual;

				if (edge) {
					portActual[`${instanceId}:${port.id}`] = actual;
				}
				inputFlows.push({ portId: port.id, demanded: 0, actual });
			}

			if (isSplitter || JUNCTION_IDS.has(building.buildingId)) {
				const connectedOutputs = outputPorts.filter((p) =>
					outgoing.some((e) => e.sourcePortId === p.id),
				);

				// Compute downstream demands from target recipes for proportional split
				let totalDemand = 0;
				const portDemands = new Map<string, number>();
				for (const port of connectedOutputs) {
					const edge = outgoing.find((e) => e.sourcePortId === port.id);
					if (edge) {
						const targetBldg = buildings[edge.targetInstanceId];
						if (targetBldg) {
							const targetDef = getBuildingDef(targetBldg.buildingId);
							const targetRecipe = targetBldg.recipeId
								? getRecipe(targetBldg.recipeId)
								: null;
							if (targetRecipe && targetDef) {
								const targetInPorts = targetDef.ports.filter(
									(p) => p.direction === "input",
								);
								const pIdx = targetInPorts.findIndex(
									(p) => p.id === edge.targetPortId,
								);
								const recipeIn = targetRecipe.inputs[pIdx];
								if (recipeIn) {
									const d =
										recipeIn.perMinute *
										(targetBldg.overclockPercent / 100);
									portDemands.set(port.id, d);
									totalDemand += d;
								}
							}
						}
					}
				}

				for (const port of outputPorts) {
					const key = `${instanceId}:${port.id}`;
					const isConnected = outgoing.some(
						(e) => e.sourcePortId === port.id,
					);
					let rate: number;
					if (!isConnected) {
						rate = 0;
					} else if (totalDemand > 0 && portDemands.has(port.id)) {
						// Demand-proportional distribution
						rate = totalInput * (portDemands.get(port.id)! / totalDemand);
					} else {
						// Fallback to even split
						rate =
							connectedOutputs.length > 0
								? totalInput / connectedOutputs.length
								: 0;
					}
					portActual[key] = rate;
					outputFlows.push({ portId: port.id, demanded: 0, actual: rate });
				}
			} else if (isMerger) {
				for (const port of outputPorts) {
					const key = `${instanceId}:${port.id}`;
					portActual[key] = totalInput;
					outputFlows.push({
						portId: port.id,
						demanded: 0,
						actual: totalInput,
					});
				}
			} else if (isPassthrough) {
				for (const port of outputPorts) {
					const key = `${instanceId}:${port.id}`;
					portActual[key] = totalInput;
					outputFlows.push({
						portId: port.id,
						demanded: 0,
						actual: totalInput,
					});
				}
			}
		} else {
			// Production building
			const recipe = building.recipeId
				? getRecipe(building.recipeId)
				: null;

			if (!recipe) {
				for (const port of inputPorts) {
					inputFlows.push({ portId: port.id, demanded: 0, actual: 0 });
				}
				for (const port of outputPorts) {
					const key = `${instanceId}:${port.id}`;
					portActual[key] = 0;
					outputFlows.push({ portId: port.id, demanded: 0, actual: 0 });
				}
			} else {
				let minSatisfaction = 1;

				for (let i = 0; i < inputPorts.length; i++) {
					const port = inputPorts[i];
					const recipeInput = recipe.inputs[i];
					const demand = recipeInput
						? recipeInput.perMinute * mult
						: 0;
					const key = `${instanceId}:${port.id}`;
					portDemand[key] = demand;

					const edge = incoming.find(
						(e) => e.targetPortId === port.id,
					);
					const sourceRate = edge
						? portActual[
								`${edge.sourceInstanceId}:${edge.sourcePortId}`
							] ?? 0
						: 0;
					const tierLimit = edge
						? getEdgeTierLimit(edge)
						: Infinity;
					const actual = edge ? Math.min(sourceRate, tierLimit) : 0;

					inputFlows.push({ portId: port.id, demanded: demand, actual });

					if (demand > 0) {
						minSatisfaction = Math.min(
							minSatisfaction,
							actual / demand,
						);
					}
				}

				minSatisfaction = Math.min(1, minSatisfaction);

				for (let i = 0; i < outputPorts.length; i++) {
					const port = outputPorts[i];
					const recipeOutput = recipe.outputs[i];
					const maxRate = recipeOutput
						? recipeOutput.perMinute * mult
						: 0;
					const actualRate = maxRate * minSatisfaction;
					const key = `${instanceId}:${port.id}`;
					portActual[key] = actualRate;
					portDemand[key] = maxRate;
					outputFlows.push({
						portId: port.id,
						demanded: maxRate,
						actual: actualRate,
					});
				}
			}
		}

		nodeInputFlows[instanceId] = inputFlows;
		nodeOutputFlows[instanceId] = outputFlows;
	}

	// ==========================================
	// BACKWARD PASS: propagate downstream demand
	// ==========================================

	const reversed = [...sorted].reverse();

	for (const instanceId of reversed) {
		const building = buildings[instanceId];
		if (!building) continue;

		const def = getBuildingDef(building.buildingId);
		if (!def) continue;

		const isSource = def.category === "source";
		const isLogistics = def.category === "logistics";
		const isStorage = STORAGE_IDS.has(building.buildingId);
		const isSink = SINK_IDS.has(building.buildingId);
		const isSplitter =
			SPLITTER_IDS.has(building.buildingId) ||
			JUNCTION_IDS.has(building.buildingId);
		const isMerger = MERGER_IDS.has(building.buildingId);
		const isPassthrough = PASSTHROUGH_IDS.has(building.buildingId);

		const inputPorts = def.ports.filter((p) => p.direction === "input");
		const outputPorts = def.ports.filter((p) => p.direction === "output");

		const outgoing = outEdges[instanceId] ?? [];
		const incoming = inEdges[instanceId] ?? [];

		// Step 1: Compute downstream demand for each output port
		// by looking at what target ports demand across all outgoing edges
		for (const port of outputPorts) {
			const key = `${instanceId}:${port.id}`;
			const edgesFromPort = outgoing.filter((e) => e.sourcePortId === port.id);

			if (edgesFromPort.length === 0) {
				// No connection — downstream demand is 0
				portDownstreamDemand[key] = 0;
			} else {
				let totalDemand = 0;
				for (const edge of edgesFromPort) {
					const targetKey = `${edge.targetInstanceId}:${edge.targetPortId}`;
					// Use the target port's demand (from recipe or propagated backward)
					const targetDemand = portDemand[targetKey] ?? portDownstreamDemand[targetKey] ?? 0;
					totalDemand += targetDemand;
				}
				portDownstreamDemand[key] = totalDemand;
			}
		}

		// Step 2: Propagate demand backward to input ports
		if (isSink) {
			// Sink: demand matches actual flow (no upstream pressure)
			for (const port of inputPorts) {
				const key = `${instanceId}:${port.id}`;
				const edge = incoming.find((e) => e.targetPortId === port.id);
				const actual = edge
					? portActual[`${edge.sourceInstanceId}:${edge.sourcePortId}`] ?? 0
					: 0;
				portDownstreamDemand[key] = actual;
			}
		} else if (isStorage) {
			const hasOutputConnections = outgoing.length > 0;
			if (hasOutputConnections) {
				// Pass-through: propagate output demand to inputs
				let totalOutputDemand = 0;
				for (const port of outputPorts) {
					totalOutputDemand += portDownstreamDemand[`${instanceId}:${port.id}`] ?? 0;
				}
				const perInput = inputPorts.length > 0
					? totalOutputDemand / inputPorts.length
					: 0;
				for (const port of inputPorts) {
					const key = `${instanceId}:${port.id}`;
					portDownstreamDemand[key] = perInput;
				}
			} else {
				// Storage as sink: demand matches actual flow (endpoint, no upstream pressure)
				for (const port of inputPorts) {
					const key = `${instanceId}:${port.id}`;
					const edge = incoming.find((e) => e.targetPortId === port.id);
					const actual = edge
						? portActual[`${edge.sourceInstanceId}:${edge.sourcePortId}`] ?? 0
						: 0;
					portDownstreamDemand[key] = actual;
				}
			}
		} else if (isLogistics) {
			if (isSplitter || JUNCTION_IDS.has(building.buildingId)) {
				// Splitter: input demand = sum of all output downstream demands
				let totalOutputDemand = 0;
				for (const port of outputPorts) {
					totalOutputDemand += portDownstreamDemand[`${instanceId}:${port.id}`] ?? 0;
				}
				for (const port of inputPorts) {
					const key = `${instanceId}:${port.id}`;
					portDownstreamDemand[key] = totalOutputDemand;
				}
			} else if (isMerger) {
				// Merger: distribute demand proportionally to actual flow
				let totalOutputDemand = 0;
				for (const port of outputPorts) {
					totalOutputDemand += portDownstreamDemand[`${instanceId}:${port.id}`] ?? 0;
				}
				// Sum actual input flows to compute proportions
				let totalActualInput = 0;
				for (const port of inputPorts) {
					const edge = incoming.find((e) => e.targetPortId === port.id);
					if (edge) {
						totalActualInput += portActual[`${edge.sourceInstanceId}:${edge.sourcePortId}`] ?? 0;
					}
				}
				for (const port of inputPorts) {
					const key = `${instanceId}:${port.id}`;
					const edge = incoming.find((e) => e.targetPortId === port.id);
					if (edge && totalActualInput > 0) {
						const actualFlow = portActual[`${edge.sourceInstanceId}:${edge.sourcePortId}`] ?? 0;
						portDownstreamDemand[key] = totalOutputDemand * (actualFlow / totalActualInput);
					} else {
						portDownstreamDemand[key] = 0;
					}
				}
			} else if (isPassthrough) {
				// Pass-through: demand flows through
				let totalOutputDemand = 0;
				for (const port of outputPorts) {
					totalOutputDemand += portDownstreamDemand[`${instanceId}:${port.id}`] ?? 0;
				}
				for (const port of inputPorts) {
					const key = `${instanceId}:${port.id}`;
					portDownstreamDemand[key] = totalOutputDemand;
				}
			}
		} else if (!isSource) {
			// Production building: input demand already set by recipe (portDemand)
			// But we also need to set portDownstreamDemand for input ports
			// so upstream nodes can see what this node wants
			for (const port of inputPorts) {
				const key = `${instanceId}:${port.id}`;
				portDownstreamDemand[key] = portDemand[key] ?? 0;
			}
		}
	}

	// ==========================================
	// DETERMINE NODE STATUS (using both passes)
	// ==========================================

	for (const instanceId of sorted) {
		const building = buildings[instanceId];
		if (!building) continue;

		const def = getBuildingDef(building.buildingId);
		if (!def) continue;

		const isSource = def.category === "source";
		const isLogistics = def.category === "logistics";
		const isStorage = STORAGE_IDS.has(building.buildingId);
		const isSink = SINK_IDS.has(building.buildingId);

		const outputPorts = def.ports.filter((p) => p.direction === "output");
		const incoming = inEdges[instanceId] ?? [];
		const outgoing = outEdges[instanceId] ?? [];
		const hasConnections = incoming.length > 0 || outgoing.length > 0;

		const inputFlows = nodeInputFlows[instanceId] ?? [];
		const outputFlows = nodeOutputFlows[instanceId] ?? [];

		// Compute total output capacity and downstream demand
		let totalOutputCapacity = 0;
		let totalDownstreamDemand = 0;

		for (const port of outputPorts) {
			const key = `${instanceId}:${port.id}`;
			totalOutputCapacity += portActual[key] ?? 0;
			totalDownstreamDemand += portDownstreamDemand[key] ?? 0;
		}

		let status: NodeStatus = "idle";

		if (isSink) {
			status = hasConnections ? "ok" : "idle";
		} else if (isStorage) {
			status = hasConnections ? "ok" : "idle";
		} else if (isSource) {
			if (!hasConnections || (building.sourceRate ?? 0) <= 0) {
				status = "idle";
			} else {
				// Check if downstream consumes what we produce
				if (totalDownstreamDemand > 0 && totalOutputCapacity > totalDownstreamDemand * 1.01) {
					status = "overproducing";
				} else if (totalDownstreamDemand > totalOutputCapacity * 1.01) {
					status = "bottleneck";
				} else {
					status = "ok";
				}
			}
		} else if (isLogistics) {
			status = hasConnections ? "ok" : "idle";
		} else {
			// Production building
			const recipe = building.recipeId
				? getRecipe(building.recipeId)
				: null;

			if (!recipe || !hasConnections) {
				status = "idle";
			} else {
				// Check input satisfaction (forward pass)
				const inputsWithDemand = inputFlows.filter(
					(f) => f.demanded > 0,
				);

				let inputStatus: NodeStatus = "ok";
				if (inputsWithDemand.length > 0) {
					const minRatio = Math.min(
						...inputsWithDemand.map((f) =>
							f.demanded > 0 ? f.actual / f.demanded : 1,
						),
					);
					if (minRatio < 0.5) inputStatus = "error";
					else if (minRatio < 0.99) inputStatus = "warning";
				}

				// Check output consumption (backward pass)
				let outputStatus: NodeStatus = "ok";
				const hasOutputConnections = outgoing.length > 0;

				if (!hasOutputConnections && totalOutputCapacity > 0) {
					// No output connections but producing → overproducing
					outputStatus = "overproducing";
				} else if (totalDownstreamDemand > totalOutputCapacity * 1.01) {
					// Downstream wants more than we can produce → bottleneck
					outputStatus = "bottleneck";
				} else if (totalDownstreamDemand > 0 && totalOutputCapacity > totalDownstreamDemand * 1.01) {
					// We produce more than downstream needs → overproducing
					outputStatus = "overproducing";
				}

				// Priority: error > warning > bottleneck > overproducing > ok
				if (inputStatus === "error") {
					status = "error";
				} else if (inputStatus === "warning") {
					status = "warning";
				} else if (outputStatus === "bottleneck") {
					status = "bottleneck";
				} else if (outputStatus === "overproducing") {
					status = "overproducing";
				} else {
					status = "ok";
				}
			}
		}

		result.nodes[instanceId] = {
			status,
			inputFlows,
			outputFlows,
			totalOutputCapacity: Math.round(totalOutputCapacity * 10) / 10,
			totalDownstreamDemand: Math.round(totalDownstreamDemand * 10) / 10,
		};
	}

	// ==========================================
	// EDGE ANALYSIS
	// ==========================================

	for (const conn of Object.values(connections)) {
		const sourceRate =
			portActual[`${conn.sourceInstanceId}:${conn.sourcePortId}`] ?? 0;
		const tierLimit = getEdgeTierLimit(conn);
		const flow = Math.min(sourceRate, tierLimit);

		// What does the target port demand?
		const demanded =
			portDemand[`${conn.targetInstanceId}:${conn.targetPortId}`] ??
			portDownstreamDemand[`${conn.targetInstanceId}:${conn.targetPortId}`] ?? 0;

		let edgeStatus: "ok" | "bottleneck" | "overproducing" | "overcapacity" | "idle" = "idle";
		if (demanded > 0 || flow > 0 || sourceRate > 0) {
			if (sourceRate > tierLimit * 1.01) {
				// Belt/pipe can't handle the flow — needs upgrade
				edgeStatus = "overcapacity";
			} else if (demanded > 0 && flow < demanded * 0.99) {
				edgeStatus = "bottleneck";
			} else if (flow > 0 && demanded === 0) {
				edgeStatus = "overproducing";
			} else {
				edgeStatus = "ok";
			}
		}

		result.edges[conn.id] = {
			flow: Math.round(flow * 10) / 10,
			capacity: tierLimit,
			demanded: Math.round(demanded * 10) / 10,
			status: edgeStatus,
		};
	}

	return result;
}

function getEdgeTierLimit(conn: Connection): number {
	if (conn.type === "conveyor") {
		return getConveyorTier(conn.tier)?.throughput ?? 60;
	}
	return getPipeTier(conn.tier)?.throughput ?? 300;
}

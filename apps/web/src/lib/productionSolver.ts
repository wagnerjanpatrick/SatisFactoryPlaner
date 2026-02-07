import {
	getDefaultRecipeForItem,
	getRecipe,
	getItem,
	getBuildingDef,
	getConveyorTier,
	getPipeTier,
	isRawResource,
} from "@/data";
import type {
	ProductionTree,
	ProductionTreeConfig,
	ProductionNode,
	ProductionEdge,
} from "./productionTypes";

/**
 * Compute overclock percentages per machine.
 * Strategy: N-1 machines at 100%, last machine at the remainder %.
 * E.g., need 1.5x → machine 1 at 100%, machine 2 at 50%.
 */
function computeOverclocks(
	requiredRate: number,
	perMachineRate: number,
): { machineCount: number; overclocks: number[]; actualRate: number } {
	const exactMachines = requiredRate / perMachineRate;
	const machineCount = Math.ceil(exactMachines);

	if (machineCount <= 0) {
		return { machineCount: 1, overclocks: [100], actualRate: perMachineRate };
	}

	if (machineCount === 1) {
		// Single machine, may need to run at less than 100%
		const pct = Math.round((requiredRate / perMachineRate) * 100);
		const clamped = Math.max(1, Math.min(250, pct));
		return {
			machineCount: 1,
			overclocks: [clamped],
			actualRate: perMachineRate * (clamped / 100),
		};
	}

	// N-1 at 100%, last at remainder
	const fullMachines = machineCount - 1;
	const remainderRate = requiredRate - fullMachines * perMachineRate;
	const lastPct = Math.round((remainderRate / perMachineRate) * 100);
	const clampedLast = Math.max(1, Math.min(250, lastPct));

	const overclocks: number[] = [];
	for (let i = 0; i < fullMachines; i++) overclocks.push(100);
	overclocks.push(clampedLast);

	const actualRate =
		fullMachines * perMachineRate + perMachineRate * (clampedLast / 100);

	return { machineCount, overclocks, actualRate };
}

/**
 * Recursively solves a production tree from a target item + rate.
 * Returns a tree of ProductionNodes with machine counts, overclock values, and connections.
 */
export function solveProductionTree(config: ProductionTreeConfig): ProductionTree {
	const nodes = new Map<string, ProductionNode>();
	const warnings: string[] = [];
	const rawResources = new Map<string, number>();
	let nodeCounter = 0;

	const sharedNodes = new Map<string, string>();
	const resolving = new Set<string>();

	const conveyorTier = getConveyorTier(config.conveyorTierId);
	const pipeTier = getPipeTier(config.pipeTierId);
	const conveyorMax = conveyorTier?.throughput ?? 780;
	const pipeMax = pipeTier?.throughput ?? 600;

	function resolve(itemId: string, requiredRate: number, depth: number): string {
		// Raw resource
		if (isRawResource(itemId)) {
			if (config.mergeIntermediates && sharedNodes.has(itemId)) {
				const existingId = sharedNodes.get(itemId)!;
				const existing = nodes.get(existingId)!;
				existing.requiredRate += requiredRate;
				existing.actualRate = existing.requiredRate;
				rawResources.set(itemId, existing.requiredRate);
				return existingId;
			}

			const nodeId = `node-${nodeCounter++}`;
			nodes.set(nodeId, {
				nodeId,
				type: "source",
				itemId,
				requiredRate,
				machineCount: 1,
				overclockPerMachine: [100],
				actualRate: requiredRate,
				depth,
				inputs: [],
			});
			if (config.mergeIntermediates) sharedNodes.set(itemId, nodeId);
			rawResources.set(itemId, (rawResources.get(itemId) ?? 0) + requiredRate);
			return nodeId;
		}

		// Cycle detection
		if (resolving.has(itemId)) {
			warnings.push(`Circular dependency detected for "${getItem(itemId)?.name ?? itemId}". Breaking cycle.`);
			const nodeId = `node-${nodeCounter++}`;
			nodes.set(nodeId, {
				nodeId, type: "source", itemId, requiredRate,
				machineCount: 1, overclockPerMachine: [100],
				actualRate: requiredRate, depth, inputs: [],
			});
			return nodeId;
		}

		// Merge existing
		if (config.mergeIntermediates && sharedNodes.has(itemId)) {
			const existingId = sharedNodes.get(itemId)!;
			const existing = nodes.get(existingId)!;
			existing.requiredRate += requiredRate;
			recalcNode(existing);
			return existingId;
		}

		// Find recipe
		const overrideRecipeId = config.recipeOverrides.get(itemId);
		const recipe = overrideRecipeId
			? getRecipe(overrideRecipeId)
			: getDefaultRecipeForItem(itemId);

		if (!recipe) {
			warnings.push(`No recipe found for "${getItem(itemId)?.name ?? itemId}". Treating as raw resource.`);
			const nodeId = `node-${nodeCounter++}`;
			nodes.set(nodeId, {
				nodeId, type: "source", itemId, requiredRate,
				machineCount: 1, overclockPerMachine: [100],
				actualRate: requiredRate, depth, inputs: [],
			});
			rawResources.set(itemId, (rawResources.get(itemId) ?? 0) + requiredRate);
			return nodeId;
		}

		const outputIO = recipe.outputs.find((o) => o.itemId === itemId);
		if (!outputIO) {
			warnings.push(`Recipe "${recipe.name}" doesn't produce "${itemId}".`);
			return `node-${nodeCounter++}`;
		}

		// Compute machine count + overclock
		const { machineCount, overclocks, actualRate } = computeOverclocks(
			requiredRate,
			outputIO.perMinute,
		);

		const nodeId = `node-${nodeCounter++}`;
		const node: ProductionNode = {
			nodeId,
			type: "production",
			itemId,
			requiredRate,
			recipeId: recipe.id,
			buildingId: recipe.buildingId,
			machineCount,
			overclockPerMachine: overclocks,
			actualRate,
			depth,
			inputs: [],
		};
		nodes.set(nodeId, node);
		if (config.mergeIntermediates) sharedNodes.set(itemId, nodeId);

		// Resolve inputs — use requiredRate (not actualRate) to avoid over-requesting
		resolving.add(itemId);
		for (const inputIO of recipe.inputs) {
			// Input rate proportional to what we actually need
			const inputRate = (inputIO.perMinute / outputIO.perMinute) * requiredRate;
			const sourceNodeId = resolve(inputIO.itemId, inputRate, depth + 1);

			const item = getItem(inputIO.itemId);
			const connectionType: "conveyor" | "pipe" =
				item?.category === "fluid" ? "pipe" : "conveyor";
			const maxThroughput = connectionType === "conveyor" ? conveyorMax : pipeMax;
			const parallelLines = Math.ceil(inputRate / maxThroughput);

			node.inputs.push({
				itemId: inputIO.itemId,
				rate: inputRate,
				sourceNodeId,
				connectionType,
				parallelLines,
				tier: connectionType === "conveyor" ? config.conveyorTierId : config.pipeTierId,
			});
		}
		resolving.delete(itemId);

		return nodeId;
	}

	function recalcNode(node: ProductionNode) {
		if (node.type === "source") {
			node.actualRate = node.requiredRate;
			return;
		}
		if (!node.recipeId) return;
		const recipe = getRecipe(node.recipeId);
		if (!recipe) return;
		const outputIO = recipe.outputs.find((o) => o.itemId === node.itemId);
		if (!outputIO) return;

		const { machineCount, overclocks, actualRate } = computeOverclocks(
			node.requiredRate,
			outputIO.perMinute,
		);
		const oldMachineCount = node.machineCount;
		node.machineCount = machineCount;
		node.overclockPerMachine = overclocks;
		node.actualRate = actualRate;

		if (oldMachineCount !== machineCount) {
			for (const edge of node.inputs) {
				const inputIO = recipe.inputs.find((io) => io.itemId === edge.itemId);
				if (!inputIO) continue;
				const newInputRate = (inputIO.perMinute / outputIO.perMinute) * node.requiredRate;
				const rateDiff = newInputRate - edge.rate;
				edge.rate = newInputRate;

				const maxT =
					edge.connectionType === "conveyor" ? conveyorMax : pipeMax;
				edge.parallelLines = Math.ceil(edge.rate / maxT);

				if (rateDiff > 0) {
					const sourceNode = nodes.get(edge.sourceNodeId);
					if (sourceNode) {
						sourceNode.requiredRate += rateDiff;
						recalcNode(sourceNode);
					}
				}
			}
		}
	}

	const rootNodeId = resolve(config.targetItemId, config.targetRate, 0);

	let totalPower = 0;
	let totalMachines = 0;
	for (const node of nodes.values()) {
		if (node.type === "production" && node.buildingId) {
			const def = getBuildingDef(node.buildingId);
			if (def) {
				// Power scales with overclock approximately
				for (const oc of node.overclockPerMachine) {
					totalPower += def.powerConsumption * (oc / 100);
				}
			}
			totalMachines += node.machineCount;
		}
	}

	return { nodes, rootNodeId, totalPower, totalMachines, rawResources, warnings };
}

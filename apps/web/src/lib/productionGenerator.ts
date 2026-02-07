import { getBuildingDef, getItem, getRecipe } from "@/data";
import { useBuildingStore } from "@/store/buildingStore";
import { useConnectionStore } from "@/store/connectionStore";
import { useHistoryStore } from "@/store/historyStore";
import { GRID_SIZE } from "./constants";
import { snapToGrid } from "./geometry";
import type { ProductionTree } from "./productionTypes";
import type { LayoutResult } from "./productionLayout";

interface PortRef {
	instanceId: string;
	portId: string;
}

/** X step between logistics buildings in a chain (meters, grid-aligned) */
const CHAIN_STEP = GRID_SIZE; // 8m

/**
 * Commits a solved + laid-out production tree to the stores.
 * Creates all buildings, sets recipes/sources/overclock, and connects them.
 * Uses mergers for conveyor fan-in (N:1).
 * Uses direct connections for fan-out (1:M) — models manifold behavior.
 * Single pushSnapshot() so the entire operation is one undo step.
 */
export function commitProductionTree(
	tree: ProductionTree,
	layout: LayoutResult,
	originX: number,
	originY: number,
	useLogistics = true,
) {
	const { pushSnapshot } = useHistoryStore.getState();
	const bStore = useBuildingStore.getState();
	const cStore = useConnectionStore.getState();

	pushSnapshot();

	// Track positions for logistics placement
	const iPos = new Map<string, { x: number; y: number }>();
	const nodeInstances = new Map<string, string[]>();

	function place(bid: string, x: number, y: number): string {
		const sx = snapToGrid(x, GRID_SIZE);
		const sy = snapToGrid(y, GRID_SIZE);
		const id = bStore.addBuilding(bid, sx, sy, 0);
		iPos.set(id, { x: sx, y: sy });
		return id;
	}

	function conn(
		src: PortRef,
		tgt: PortRef,
		type: "conveyor" | "pipe",
		tier: string,
	) {
		cStore.addConnection(
			src.instanceId,
			src.portId,
			tgt.instanceId,
			tgt.portId,
			type,
			tier,
		);
	}

	function posY(id: string): number {
		return iPos.get(id)?.y ?? 0;
	}

	// ── 1. Create all production buildings ──────────────────────────

	for (const [nodeId, node] of tree.nodes) {
		const positions = layout.positions.get(nodeId);
		if (!positions) continue;

		if (node.type === "source") {
			const p = positions[0];
			if (!p) continue;
			const id = place("infinite-source", p.x + originX, p.y + originY);
			bStore.setSourceItem(id, node.itemId);
			bStore.setSourceRate(id, node.requiredRate);
			nodeInstances.set(nodeId, [id]);
		} else {
			const ids: string[] = [];
			for (let i = 0; i < positions.length; i++) {
				const p = positions[i];
				const id = place(node.buildingId!, p.x + originX, p.y + originY);
				if (node.recipeId) bStore.setRecipe(id, node.recipeId);
				const oc = node.overclockPerMachine[i];
				if (oc !== undefined && oc !== 100) {
					bStore.setOverclock(id, oc);
				}
				ids.push(id);
			}
			nodeInstances.set(nodeId, ids);
		}
	}

	// ── Merger chain: N sources → 1 output ─────────────────────────
	// Merger ports: conv-in-0 (top), conv-in-1 (left), conv-in-2 (bottom), conv-out-0 (right)
	// Chain strategy: first merger uses all 3 inputs for sources.
	// Subsequent mergers use left for chain, top+bottom for new sources.

	function mergerChain(
		sources: PortRef[],
		startX: number,
		tier: string,
	): PortRef {
		if (sources.length <= 1) return sources[0];

		let chain: PortRef | null = null;
		let x = startX;
		const remaining = [...sources];

		while (remaining.length > 0) {
			if (remaining.length === 1 && chain === null) return remaining[0];

			const isFirst = chain === null;
			const maxNew = isFirst ? 3 : 2;
			const batch = remaining.splice(0, Math.min(maxNew, remaining.length));

			// Y = average of new source positions
			let sumY = 0;
			for (const ref of batch) sumY += posY(ref.instanceId);
			const my = batch.length > 0 ? sumY / batch.length : 0;

			const mid = place("merger", x, my);

			if (isFirst) {
				// First merger: top, bottom, left
				const ports = ["conv-in-0", "conv-in-2", "conv-in-1"];
				for (let i = 0; i < batch.length; i++) {
					conn(batch[i], { instanceId: mid, portId: ports[i] }, "conveyor", tier);
				}
			} else {
				// Chain → left, new sources → top, bottom
				conn(chain!, { instanceId: mid, portId: "conv-in-1" }, "conveyor", tier);
				if (batch[0])
					conn(batch[0], { instanceId: mid, portId: "conv-in-0" }, "conveyor", tier);
				if (batch[1])
					conn(batch[1], { instanceId: mid, portId: "conv-in-2" }, "conveyor", tier);
			}

			chain = { instanceId: mid, portId: "conv-out-0" };
			x += CHAIN_STEP;
		}

		return chain!;
	}

	// ── Splitter chain: 1 input → M outputs ────────────────────────
	// Splitter ports: conv-in-0 (left), conv-out-0 (top), conv-out-1 (right), conv-out-2 (bottom)
	// Chain strategy: top+bottom branch to targets, right continues chain.
	// Last splitter uses all outputs for remaining targets.

	function splitterChain(
		count: number,
		targetIds: string[],
		startX: number,
		tier: string,
	): { input: PortRef; outputs: PortRef[] } {
		const outputs: PortRef[] = [];
		let x = startX;
		let firstInput: PortRef | null = null;
		let prevChain: PortRef | null = null;
		let tIdx = 0;
		let rem = count;

		while (rem > 0) {
			if (rem === 1 && prevChain) {
				outputs.push(prevChain);
				rem = 0;
				break;
			}

			let sumY = 0;
			const remCount = targetIds.length - tIdx;
			for (let i = tIdx; i < targetIds.length; i++) sumY += posY(targetIds[i]);
			const sy = remCount > 0 ? sumY / remCount : 0;

			const sid = place("splitter", x, sy);

			if (!firstInput) {
				firstInput = { instanceId: sid, portId: "conv-in-0" };
			}
			if (prevChain) {
				conn(prevChain, { instanceId: sid, portId: "conv-in-0" }, "conveyor", tier);
			}

			if (rem <= 3) {
				const ports = ["conv-out-0", "conv-out-1", "conv-out-2"];
				for (let i = 0; i < rem; i++) {
					outputs.push({ instanceId: sid, portId: ports[i] });
				}
				rem = 0;
			} else {
				outputs.push({ instanceId: sid, portId: "conv-out-0" });
				tIdx++;
				outputs.push({ instanceId: sid, portId: "conv-out-2" });
				tIdx++;
				prevChain = { instanceId: sid, portId: "conv-out-1" };
				rem -= 2;
			}

			x += CHAIN_STEP;
		}

		return { input: firstInput!, outputs };
	}

	// ── 2. Create connections ──────────────────────────────────────

	for (const [nodeId, node] of tree.nodes) {
		if (node.type === "source") continue;

		const tgtIds = nodeInstances.get(nodeId);
		if (!tgtIds?.length) continue;

		const tgtDef = node.buildingId
			? getBuildingDef(node.buildingId)
			: undefined;
		if (!tgtDef) continue;

		const recipe = node.recipeId ? getRecipe(node.recipeId) : undefined;
		if (!recipe) continue;

		const convInPorts = tgtDef.ports.filter(
			(p) => p.direction === "input" && p.type === "conveyor",
		);
		const pipeInPorts = tgtDef.ports.filter(
			(p) => p.direction === "input" && p.type === "pipe",
		);
		let cIdx = 0;
		let pIdx = 0;

		for (const edge of node.inputs) {
			const srcIds = nodeInstances.get(edge.sourceNodeId);
			if (!srcIds?.length) continue;

			const tgtPort =
				edge.connectionType === "conveyor"
					? convInPorts[cIdx++]
					: pipeInPorts[pIdx++];
			if (!tgtPort) continue;

			// Resolve source output port
			const srcNode = tree.nodes.get(edge.sourceNodeId);
			if (!srcNode) continue;

			let srcPortId: string;
			if (srcNode.type === "source") {
				srcPortId =
					edge.connectionType === "conveyor" ? "conv-out-0" : "pipe-out-0";
			} else {
				const srcDef = srcNode.buildingId
					? getBuildingDef(srcNode.buildingId)
					: undefined;
				if (!srcDef) continue;
				const outPorts = srcDef.ports.filter(
					(p) =>
						p.direction === "output" && p.type === edge.connectionType,
				);
				const srcRecipe = srcNode.recipeId
					? getRecipe(srcNode.recipeId)
					: undefined;
				let oIdx = 0;
				if (srcRecipe) {
					const matching = srcRecipe.outputs.filter((o) => {
						const item = getItem(o.itemId);
						return (
							(item?.category === "fluid" ? "pipe" : "conveyor") ===
							edge.connectionType
						);
					});
					oIdx = matching.findIndex((o) => o.itemId === edge.itemId);
					if (oIdx < 0) oIdx = 0;
				}
				srcPortId = outPorts[oIdx]?.id ?? outPorts[0]?.id;
				if (!srcPortId) continue;
			}

			// ── Pipe: round-robin (no logistics buildings for pipes) ──
			if (edge.connectionType === "pipe") {
				const max = Math.max(srcIds.length, tgtIds.length);
				for (let i = 0; i < max; i++) {
					conn(
						{ instanceId: srcIds[i % srcIds.length], portId: srcPortId },
						{
							instanceId: tgtIds[i % tgtIds.length],
							portId: tgtPort.id,
						},
						"pipe",
						edge.tier,
					);
				}
				continue;
			}

			// ── Conveyor connections ──
			const N = srcIds.length;
			const M = tgtIds.length;

			const srcRefs: PortRef[] = srcIds.map((id) => ({
				instanceId: id,
				portId: srcPortId,
			}));

			if (N === 1 && M === 1) {
				// 1:1 direct
				conn(
					srcRefs[0],
					{ instanceId: tgtIds[0], portId: tgtPort.id },
					"conveyor",
					edge.tier,
				);
			} else if (N === M) {
				// N:N direct 1:1
				for (let i = 0; i < N; i++) {
					conn(
						srcRefs[i],
						{ instanceId: tgtIds[i], portId: tgtPort.id },
						"conveyor",
						edge.tier,
					);
				}
			} else if (N > 1 && M === 1) {
				// N:1 — merger chain
				const srcMaxX = Math.max(...srcIds.map((id) => iPos.get(id)?.x ?? 0));
				const srcWidth =
					srcNode.type === "source"
						? 8
						: (getBuildingDef(srcNode.buildingId!)?.width ?? 8);
				const gapStart = snapToGrid(
					srcMaxX + srcWidth + CHAIN_STEP,
					GRID_SIZE,
				);
				const merged = mergerChain(srcRefs, gapStart, edge.tier);
				conn(
					merged,
					{ instanceId: tgtIds[0], portId: tgtPort.id },
					"conveyor",
					edge.tier,
				);
			} else if (N === 1 && M > 1) {
				// 1:M fan-out
				if (useLogistics) {
					// Splitter chain
					const srcMaxX = Math.max(...srcIds.map((id) => iPos.get(id)?.x ?? 0));
					const srcWidth =
						srcNode.type === "source"
							? 8
							: (getBuildingDef(srcNode.buildingId!)?.width ?? 8);
					const midX = Math.min(...tgtIds.map((id) => iPos.get(id)?.x ?? 0));
					const splitX = snapToGrid(
						(srcMaxX + srcWidth + midX) / 2,
						GRID_SIZE,
					);
					const split = splitterChain(M, tgtIds, splitX, edge.tier);
					conn(srcRefs[0], split.input, "conveyor", edge.tier);
					for (let i = 0; i < M; i++) {
						conn(
							split.outputs[i],
							{ instanceId: tgtIds[i], portId: tgtPort.id },
							"conveyor",
							edge.tier,
						);
					}
				} else {
					// Direct connections (manifold style)
					for (let i = 0; i < M; i++) {
						conn(
							srcRefs[0],
							{ instanceId: tgtIds[i], portId: tgtPort.id },
							"conveyor",
							edge.tier,
						);
					}
				}
			} else {
				// N:M general
				const srcMaxX = Math.max(...srcIds.map((id) => iPos.get(id)?.x ?? 0));
				const srcWidth =
					srcNode.type === "source"
						? 8
						: (getBuildingDef(srcNode.buildingId!)?.width ?? 8);
				const gapStart = snapToGrid(
					srcMaxX + srcWidth + CHAIN_STEP,
					GRID_SIZE,
				);
				const merged = mergerChain(srcRefs, gapStart, edge.tier);
				if (useLogistics) {
					const mergerEndX = iPos.get(merged.instanceId)?.x ?? gapStart;
					const tgtMinX = Math.min(...tgtIds.map((id) => iPos.get(id)?.x ?? 0));
					const splitX = snapToGrid(
						(mergerEndX + CHAIN_STEP + tgtMinX) / 2,
						GRID_SIZE,
					);
					const split = splitterChain(M, tgtIds, splitX, edge.tier);
					conn(merged, split.input, "conveyor", edge.tier);
					for (let i = 0; i < M; i++) {
						conn(
							split.outputs[i],
							{ instanceId: tgtIds[i], portId: tgtPort.id },
							"conveyor",
							edge.tier,
						);
					}
				} else {
					for (let i = 0; i < M; i++) {
						conn(
							merged,
							{ instanceId: tgtIds[i], portId: tgtPort.id },
							"conveyor",
							edge.tier,
						);
					}
				}
			}
		}
	}
}

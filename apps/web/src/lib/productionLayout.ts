import { getBuildingDef } from "@/data";
import { GRID_SIZE } from "./constants";
import { snapToGrid } from "./geometry";
import type { ProductionTree, ProductionNode } from "./productionTypes";

/** Horizontal gap between depth levels (meters) */
const LEVEL_GAP = 40;
/** Vertical gap between nodes at the same level (meters) */
const VERTICAL_GAP = 16;
/** Vertical gap between stacked machines of the same node (meters) */
const MACHINE_GAP = GRID_SIZE;

export interface LayoutResult {
	/** nodeId -> world position (meters, top-left corner) for each machine */
	positions: Map<string, { x: number; y: number }[]>;
	bounds: { width: number; height: number };
}

/**
 * Lays out the production tree left-to-right.
 * Sources (deepest) on the left, target (depth 0) on the right.
 */
export function layoutProductionTree(tree: ProductionTree): LayoutResult {
	const positions = new Map<string, { x: number; y: number }[]>();

	// Group nodes by depth
	const levels = new Map<number, ProductionNode[]>();
	let maxDepth = 0;
	for (const node of tree.nodes.values()) {
		const list = levels.get(node.depth) ?? [];
		list.push(node);
		levels.set(node.depth, list);
		if (node.depth > maxDepth) maxDepth = node.depth;
	}

	let maxX = 0;
	let maxY = 0;

	for (let depth = 0; depth <= maxDepth; depth++) {
		const nodesAtLevel = levels.get(depth) ?? [];
		// X: deeper nodes on the left
		const x = snapToGrid((maxDepth - depth) * LEVEL_GAP, GRID_SIZE);

		// Calculate total height needed for this level
		let totalHeight = 0;
		for (const node of nodesAtLevel) {
			const buildingHeight = getBuildingLength(node);
			const nodeHeight =
				node.machineCount > 1
					? buildingHeight * node.machineCount +
						MACHINE_GAP * (node.machineCount - 1)
					: buildingHeight;
			totalHeight += nodeHeight;
		}
		totalHeight += VERTICAL_GAP * Math.max(0, nodesAtLevel.length - 1);

		// Stack vertically, starting from y=0
		let currentY = 0;
		for (const node of nodesAtLevel) {
			const buildingHeight = getBuildingLength(node);
			const buildingWidth = getBuildingWidth(node);
			const machinePositions: { x: number; y: number }[] = [];

			for (let i = 0; i < node.machineCount; i++) {
				const my = snapToGrid(
					currentY + i * (buildingHeight + MACHINE_GAP),
					GRID_SIZE,
				);
				machinePositions.push({ x, y: my });
				if (x + buildingWidth > maxX) maxX = x + buildingWidth;
				if (my + buildingHeight > maxY) maxY = my + buildingHeight;
			}

			positions.set(node.nodeId, machinePositions);
			currentY +=
				(node.machineCount > 1
					? buildingHeight * node.machineCount +
						MACHINE_GAP * (node.machineCount - 1)
					: buildingHeight) + VERTICAL_GAP;
		}
	}

	return { positions, bounds: { width: maxX, height: maxY } };
}

function getBuildingLength(node: ProductionNode): number {
	if (node.type === "source") return 8; // source node default
	const def = node.buildingId ? getBuildingDef(node.buildingId) : undefined;
	return def?.length ?? 8;
}

function getBuildingWidth(node: ProductionNode): number {
	if (node.type === "source") return 8;
	const def = node.buildingId ? getBuildingDef(node.buildingId) : undefined;
	return def?.width ?? 8;
}

declare module "pathfinding" {
	export class Grid {
		constructor(width: number, height: number);
		setWalkableAt(x: number, y: number, walkable: boolean): void;
		clone(): Grid;
	}

	export interface FinderOptions {
		allowDiagonal?: boolean;
		dontCrossCorners?: boolean;
		heuristic?: (dx: number, dy: number) => number;
		weight?: number;
	}

	export class AStarFinder {
		constructor(options?: FinderOptions);
		findPath(
			startX: number,
			startY: number,
			endX: number,
			endY: number,
			grid: Grid,
		): number[][];
	}
}

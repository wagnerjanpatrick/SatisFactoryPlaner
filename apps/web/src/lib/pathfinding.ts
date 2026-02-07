import { Grid, AStarFinder } from "pathfinding";
import type { OccupancyGrid } from "./grid";

const finder = new AStarFinder({
	allowDiagonal: false,
	dontCrossCorners: true,
});

export interface PathResult {
	waypoints: { x: number; y: number }[];
	found: boolean;
}

/**
 * Finds a path between two world-space points using A* on the occupancy grid.
 * Returns simplified waypoints (corners only) in world coordinates.
 */
export function findPath(
	grid: OccupancyGrid,
	startX: number,
	startY: number,
	endX: number,
	endY: number,
): PathResult {
	const offsetX = grid.getOffsetX();
	const offsetY = grid.getOffsetY();
	const width = grid.getWidth();
	const height = grid.getHeight();

	// Convert world coords to grid coords
	const gStartX = Math.floor(startX) - offsetX;
	const gStartY = Math.floor(startY) - offsetY;
	const gEndX = Math.floor(endX) - offsetX;
	const gEndY = Math.floor(endY) - offsetY;

	// Clamp to grid bounds
	const clamp = (v: number, max: number) => Math.max(0, Math.min(max - 1, v));
	const sx = clamp(gStartX, width);
	const sy = clamp(gStartY, height);
	const ex = clamp(gEndX, width);
	const ey = clamp(gEndY, height);

	// Build pathfinding grid (0 = walkable, 1 = blocked)
	const pfGrid = new Grid(width, height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (grid.isBlocked(x, y)) {
				pfGrid.setWalkableAt(x, y, false);
			}
		}
	}

	// Ensure start and end are walkable
	pfGrid.setWalkableAt(sx, sy, true);
	pfGrid.setWalkableAt(ex, ey, true);

	const rawPath = finder.findPath(sx, sy, ex, ey, pfGrid);

	if (rawPath.length === 0) {
		return { waypoints: [], found: false };
	}

	// Simplify path: remove collinear points, keeping only corners
	const simplified = simplifyPath(rawPath);

	// Convert grid coords back to world coords (skip first and last since those
	// are the port positions which the caller already knows)
	const waypoints = simplified.slice(1, -1).map(([gx, gy]) => ({
		x: (gx ?? 0) + offsetX + 0.5,
		y: (gy ?? 0) + offsetY + 0.5,
	}));

	return { waypoints, found: true };
}

/**
 * Removes collinear intermediate points, keeping only start, end, and corners.
 */
function simplifyPath(path: number[][]): number[][] {
	if (path.length <= 2) return path;

	const result: number[][] = [path[0]!];

	for (let i = 1; i < path.length - 1; i++) {
		const prev = path[i - 1]!;
		const curr = path[i]!;
		const next = path[i + 1]!;

		const dx1 = curr[0]! - prev[0]!;
		const dy1 = curr[1]! - prev[1]!;
		const dx2 = next[0]! - curr[0]!;
		const dy2 = next[1]! - curr[1]!;

		// If direction changes, this is a corner - keep it
		if (dx1 !== dx2 || dy1 !== dy2) {
			result.push(curr);
		}
	}

	result.push(path[path.length - 1]!);
	return result;
}

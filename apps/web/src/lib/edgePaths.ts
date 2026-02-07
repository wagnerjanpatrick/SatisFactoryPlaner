import { getSmoothStepPath, Position } from "@xyflow/react";

export interface Point {
	x: number;
	y: number;
}

/**
 * Squared distance from point p to line segment a-b.
 */
export function pointToSegmentDistanceSq(p: Point, a: Point, b: Point): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const lenSq = dx * dx + dy * dy;

	if (lenSq === 0) {
		const ex = p.x - a.x;
		const ey = p.y - a.y;
		return ex * ex + ey * ey;
	}

	let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
	t = Math.max(0, Math.min(1, t));

	const projX = a.x + t * dx;
	const projY = a.y + t * dy;
	const ex = p.x - projX;
	const ey = p.y - projY;
	return ex * ex + ey * ey;
}

/**
 * Given a click point and the full ordered point list [source, ...waypoints, target],
 * returns the index at which a new waypoint should be spliced into the waypoints array.
 */
export function findInsertIndex(clickPoint: Point, allPoints: Point[]): number {
	if (allPoints.length < 2) return 0;

	let bestSegIdx = 0;
	let bestDistSq = Infinity;

	for (let i = 0; i < allPoints.length - 1; i++) {
		const dSq = pointToSegmentDistanceSq(clickPoint, allPoints[i], allPoints[i + 1]);
		if (dSq < bestDistSq) {
			bestDistSq = dSq;
			bestSegIdx = i;
		}
	}

	return bestSegIdx;
}

/**
 * Infer the best source/target Position for a segment between two points
 * based on their relative positions.
 */
function inferPositions(from: Point, to: Point): { source: Position; target: Position } {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	if (Math.abs(dx) >= Math.abs(dy)) {
		return {
			source: dx > 0 ? Position.Right : Position.Left,
			target: dx > 0 ? Position.Left : Position.Right,
		};
	}
	return {
		source: dy > 0 ? Position.Bottom : Position.Top,
		target: dy > 0 ? Position.Top : Position.Bottom,
	};
}

/**
 * Builds an SVG path through an ordered list of points by chaining
 * getSmoothStepPath segments, preserving the default smooth-step routing style.
 *
 * Returns [pathString, labelX, labelY].
 */
export function buildWaypointPath(
	points: Point[],
	sourcePosition: Position,
	targetPosition: Position,
	borderRadius: number = 6,
): [string, number, number] {
	if (points.length < 2) return ["", 0, 0];

	const segmentCount = points.length - 1;
	const segments: string[] = [];
	const labelSegIdx = Math.floor(segmentCount / 2);
	let labelX = 0;
	let labelY = 0;

	for (let i = 0; i < segmentCount; i++) {
		const from = points[i];
		const to = points[i + 1];

		// First segment uses the original sourcePosition, last uses original targetPosition.
		// Middle segments infer positions from point direction.
		const srcPos = i === 0 ? sourcePosition : inferPositions(from, to).source;
		const tgtPos = i === segmentCount - 1 ? targetPosition : inferPositions(from, to).target;

		const [path, lx, ly] = getSmoothStepPath({
			sourceX: from.x,
			sourceY: from.y,
			sourcePosition: srcPos,
			targetX: to.x,
			targetY: to.y,
			targetPosition: tgtPos,
			borderRadius,
		});

		if (i === labelSegIdx) {
			labelX = lx;
			labelY = ly;
		}

		if (i === 0) {
			segments.push(path);
		} else {
			// Strip the leading M command — pen is already at this position
			segments.push(path.replace(/^M\s*[-\d.e]+[\s,]+[-\d.e]+\s*/, " "));
		}
	}

	return [segments.join(""), labelX, labelY];
}

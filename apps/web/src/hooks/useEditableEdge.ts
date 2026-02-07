import { useState, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Point } from "@/lib/edgePaths";
import { useConnectionStore } from "@/store/connectionStore";
import { useHistoryStore } from "@/store/historyStore";
import { useUIStore } from "@/store/uiStore";
import { PIXELS_PER_METER } from "@/lib/constants";

interface UseEditableEdgeOptions {
	edgeId: string;
	waypoints: Point[];
}

interface DragState {
	index: number;
	position: Point;
	startPointer: Point;
	startWaypoint: Point;
}

export function useEditableEdge({ edgeId, waypoints }: UseEditableEdgeOptions) {
	const [dragState, setDragState] = useState<DragState | null>(null);
	const { getViewport } = useReactFlow();
	const updateWaypoints = useConnectionStore((s) => s.updateWaypoints);
	const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);

	const effectiveWaypoints =
		dragState
			? waypoints.map((wp, i) => (i === dragState.index ? dragState.position : wp))
			: waypoints;

	const onWaypointPointerDown = useCallback(
		(index: number, e: React.PointerEvent) => {
			e.stopPropagation();
			e.preventDefault();
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

			const wp = waypoints[index];
			setDragState({
				index,
				position: { ...wp },
				startPointer: { x: e.clientX, y: e.clientY },
				startWaypoint: { ...wp },
			});
		},
		[waypoints],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragState) return;
			const { zoom } = getViewport();
			const dx = (e.clientX - dragState.startPointer.x) / zoom;
			const dy = (e.clientY - dragState.startPointer.y) / zoom;

			let newX = dragState.startWaypoint.x + dx;
			let newY = dragState.startWaypoint.y + dy;

			// Snap to grid
			const gridSnapSize = useUIStore.getState().gridSnapSize;
			const snapPx = gridSnapSize * PIXELS_PER_METER;
			newX = Math.round(newX / snapPx) * snapPx;
			newY = Math.round(newY / snapPx) * snapPx;

			setDragState((prev) =>
				prev
					? { ...prev, position: { x: newX, y: newY } }
					: null,
			);
		},
		[dragState, getViewport],
	);

	const onPointerUp = useCallback(
		(e: React.PointerEvent) => {
			if (!dragState) return;
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

			const newWaypoints = waypoints.map((wp, i) =>
				i === dragState.index ? dragState.position : wp,
			);
			pushSnapshot();
			updateWaypoints(edgeId, newWaypoints);
			setDragState(null);
		},
		[dragState, waypoints, edgeId, pushSnapshot, updateWaypoints],
	);

	const removeWaypoint = useCallback(
		(index: number) => {
			const newWaypoints = waypoints.filter((_, i) => i !== index);
			pushSnapshot();
			updateWaypoints(edgeId, newWaypoints);
		},
		[waypoints, edgeId, pushSnapshot, updateWaypoints],
	);

	return {
		effectiveWaypoints,
		onWaypointPointerDown,
		onPointerMove,
		onPointerUp,
		removeWaypoint,
		isDragging: !!dragState,
	};
}

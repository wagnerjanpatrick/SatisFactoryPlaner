"use client";

import { EdgeLabelRenderer } from "@xyflow/react";
import type { Point } from "@/lib/edgePaths";

interface WaypointHandlesProps {
	waypoints: Point[];
	visible: boolean;
	onPointerDown: (index: number, e: React.PointerEvent) => void;
	onPointerMove: (e: React.PointerEvent) => void;
	onPointerUp: (e: React.PointerEvent) => void;
	onRemove: (index: number) => void;
}

export function WaypointHandles({
	waypoints,
	visible,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onRemove,
}: WaypointHandlesProps) {
	if (!visible || waypoints.length === 0) return null;

	return (
		<EdgeLabelRenderer>
			{waypoints.map((wp, i) => (
				<div
					key={i}
					className="nodrag nopan"
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${wp.x}px, ${wp.y}px)`,
						width: 8,
						height: 8,
						borderRadius: "50%",
						backgroundColor: "#fff",
						border: "2px solid #3b82f6",
						cursor: "grab",
						pointerEvents: "all",
						zIndex: 10,
					}}
					onPointerDown={(e) => onPointerDown(i, e)}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onDoubleClick={(e) => {
						e.stopPropagation();
						onRemove(i);
					}}
					onContextMenu={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onRemove(i);
					}}
				/>
			))}
		</EdgeLabelRenderer>
	);
}

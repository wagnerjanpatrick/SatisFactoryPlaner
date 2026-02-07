"use client";

import { useState, useRef, useEffect } from "react";
import {
	BaseEdge,
	EdgeLabelRenderer,
	getSmoothStepPath,
	type EdgeProps,
} from "@xyflow/react";
import type { ConnectionEdge } from "@/store/flowTypes";
import { getPipeTier, PIPE_TIERS } from "@/data";
import { useConnectionStore } from "@/store/connectionStore";
import { useUIStore } from "@/store/uiStore";
import { useEdgeAnalysis } from "@/hooks/useFlowAnalysis";
import { COLORS } from "@/lib/constants";

const EDGE_STATUS_COLORS: Record<string, string> = {
	ok: "#22c55e",
	bottleneck: "#ef4444",
	overproducing: "#3b82f6",
	overcapacity: "#ef4444",
};

export default function PipeEdge(props: EdgeProps<ConnectionEdge>) {
	const {
		id,
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		selected,
		data,
	} = props;

	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const setTier = useConnectionStore((s) => s.setTier);
	const highlightedEdgeIds = useUIStore((s) => s.highlightedEdgeIds);
	const showEdgeLabels = useUIStore((s) => s.showEdgeLabels);
	const highlighted = highlightedEdgeIds.includes(id);
	const edgeAnalysis = useEdgeAnalysis(id);

	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		borderRadius: 6,
	});

	const currentTierId = data?.tier ?? "mk1";
	const tier = getPipeTier(currentTierId);
	const label = tier ? `${tier.throughput} m³/min` : "";

	// Close dropdown on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	const isActive = selected || highlighted;
	const strokeColor = edgeAnalysis
		? EDGE_STATUS_COLORS[edgeAnalysis.status] ?? "#888"
		: "#888";

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				style={{
					stroke: strokeColor,
					strokeWidth: isActive ? 2.5 : 1.5,
					strokeDasharray: isActive ? "6 4" : undefined,
					strokeLinecap: "round",
				}}
			/>
			{showEdgeLabels && label && (
				<EdgeLabelRenderer>
					<div
						ref={dropdownRef}
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							pointerEvents: "all",
						}}
						className="nodrag nopan"
					>
						<button
							type="button"
							onClick={() => setOpen((v) => !v)}
							style={{
								fontSize: 10,
								fontWeight: 600,
								color: COLORS.belt.pipe,
								background: "#1a1a1acc",
								padding: "1px 6px",
								borderRadius: 3,
								border: `1px solid ${COLORS.belt.pipe}44`,
								cursor: "pointer",
								whiteSpace: "nowrap",
							}}
						>
							{label}
						</button>
						{open && (
							<div
								style={{
									position: "absolute",
									top: "100%",
									left: "50%",
									transform: "translateX(-50%)",
									marginTop: 4,
									background: "#1a1a1af0",
									border: `1px solid ${COLORS.belt.pipe}66`,
									borderRadius: 4,
									overflow: "hidden",
									zIndex: 50,
									minWidth: 100,
								}}
							>
								{PIPE_TIERS.map((t) => (
									<button
										key={t.id}
										type="button"
										onClick={() => {
											setTier(id, t.id);
											setOpen(false);
										}}
										style={{
											display: "block",
											width: "100%",
											padding: "4px 8px",
											fontSize: 10,
											fontWeight: t.id === currentTierId ? 700 : 400,
											color: t.id === currentTierId ? COLORS.belt.pipe : "#ccc",
											background: t.id === currentTierId ? `${COLORS.belt.pipe}22` : "transparent",
											border: "none",
											cursor: "pointer",
											textAlign: "left",
											whiteSpace: "nowrap",
										}}
										onMouseEnter={(e) => {
											(e.target as HTMLButtonElement).style.background = `${COLORS.belt.pipe}33`;
										}}
										onMouseLeave={(e) => {
											(e.target as HTMLButtonElement).style.background =
												t.id === currentTierId ? `${COLORS.belt.pipe}22` : "transparent";
										}}
									>
										Mk.{t.id.replace("mk", "")} — {t.throughput} m³/min
									</button>
								))}
							</div>
						)}
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}

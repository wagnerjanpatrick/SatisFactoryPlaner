"use client";

import { createContext, useContext, useMemo } from "react";
import { useBuildingStore } from "@/store/buildingStore";
import { useConnectionStore } from "@/store/connectionStore";
import {
	analyzeFlow,
	type FlowAnalysisResult,
	type NodeAnalysis,
	type EdgeAnalysis,
} from "@/lib/flowAnalysis";

const EMPTY: FlowAnalysisResult = { nodes: {}, edges: {} };

export const FlowAnalysisContext = createContext<FlowAnalysisResult>(EMPTY);

export function useFlowAnalysis(): FlowAnalysisResult {
	const buildings = useBuildingStore((s) => s.buildings);
	const connections = useConnectionStore((s) => s.connections);

	return useMemo(
		() => analyzeFlow(buildings, connections),
		[buildings, connections],
	);
}

export function useNodeAnalysis(nodeId: string): NodeAnalysis | undefined {
	const ctx = useContext(FlowAnalysisContext);
	return ctx.nodes[nodeId];
}

export function useEdgeAnalysis(edgeId: string): EdgeAnalysis | undefined {
	const ctx = useContext(FlowAnalysisContext);
	return ctx.edges[edgeId];
}

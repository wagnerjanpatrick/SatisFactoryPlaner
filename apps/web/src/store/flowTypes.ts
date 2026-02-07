import type { Node, Edge } from "@xyflow/react";

export interface BuildingNodeData {
	buildingId: string;
	rotation: 0 | 90 | 180 | 270;
	recipeId?: string;
	overclockPercent: number;
	somersloops: number;
	label?: string;
	sourceItemId?: string;
	sourceRate?: number;
	[key: string]: unknown;
}

export interface ConnectionEdgeData {
	tier: string;
	waypoints: { x: number; y: number }[];
	connectionType: "conveyor" | "pipe";
	[key: string]: unknown;
}

export type BuildingNode = Node<BuildingNodeData, "building">;
export type ConnectionEdge = Edge<ConnectionEdgeData>;

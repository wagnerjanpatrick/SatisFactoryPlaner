export interface PlacedBuilding {
  instanceId: string;
  buildingId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  recipeId?: string;
  overclockPercent: number;
  somersloops: number;
  label?: string;
  sourceItemId?: string;
  sourceRate?: number;
}

export interface Connection {
  id: string;
  sourceInstanceId: string;
  sourcePortId: string;
  targetInstanceId: string;
  targetPortId: string;
  type: "conveyor" | "pipe";
  tier: string;
  waypoints: { x: number; y: number }[];
}

export type ToolMode = "select" | "build" | "connect" | "delete" | "pan";

export interface UIState {
  toolMode: ToolMode;
  selectedBuildingDefId: string | null;
  selectedInstanceIds: string[];
  focusedInstanceId: string | null;
  hoveredInstanceId: string | null;
  highlightedEdgeIds: string[];
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  gridSnapSize: 1 | 8;
  sidebarTab: "build" | "properties" | "analysis";
  sidebarOpen: boolean;
  show3DPreview: boolean;
  showEdgeLabels: boolean;
  searchQuery: string;
}

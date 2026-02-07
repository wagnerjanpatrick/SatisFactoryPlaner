import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ToolMode, UIState } from "./types";

interface UIStoreState extends UIState {
	setToolMode: (mode: ToolMode) => void;
	setSelectedBuildingDef: (id: string | null) => void;
	setSelectedInstances: (ids: string[]) => void;
	setFocusedInstance: (id: string | null) => void;
	setHoveredInstance: (id: string | null) => void;
	setHighlightedEdgeIds: (ids: string[]) => void;
	addToSelection: (id: string) => void;
	toggleSelection: (id: string) => void;
	clearSelection: () => void;
	setZoom: (zoom: number) => void;
	setPan: (x: number, y: number) => void;
	setGridSnap: (size: 1 | 8) => void;
	toggleGrid: () => void;
	toggle3DPreview: () => void;
	toggleEdgeLabels: () => void;
	toggleSidebar: () => void;
	setSidebarTab: (tab: "build" | "properties" | "analysis") => void;
	setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIStoreState>()(
	immer((set) => ({
		toolMode: "select",
		selectedBuildingDefId: null,
		selectedInstanceIds: [],
		focusedInstanceId: null,
		hoveredInstanceId: null,
		highlightedEdgeIds: [],
		zoom: 1,
		panX: 0,
		panY: 0,
		showGrid: true,
		gridSnapSize: 8,
		sidebarTab: "build",
		sidebarOpen: true,
		show3DPreview: false,
		showEdgeLabels: true,
		searchQuery: "",

		setToolMode: (mode) => {
			set((state) => {
				state.toolMode = mode;
				if (mode !== "build") {
					state.selectedBuildingDefId = null;
				}
			});
		},

		setSelectedBuildingDef: (id) => {
			set((state) => {
				state.selectedBuildingDefId = id;
				if (id) {
					state.toolMode = "build";
				}
			});
		},

		setSelectedInstances: (ids) => {
			set((state) => {
				state.selectedInstanceIds = ids;
				// Clear focused if it's no longer selected
				if (state.focusedInstanceId && !ids.includes(state.focusedInstanceId)) {
					state.focusedInstanceId = null;
				}
			});
		},

		setFocusedInstance: (id) => {
			set((state) => {
				state.focusedInstanceId = id;
			});
		},

		setHoveredInstance: (id) => {
			set((state) => {
				state.hoveredInstanceId = id;
			});
		},

		setHighlightedEdgeIds: (ids) => {
			set((state) => {
				state.highlightedEdgeIds = ids;
			});
		},

		addToSelection: (id) => {
			set((state) => {
				if (!state.selectedInstanceIds.includes(id)) {
					state.selectedInstanceIds.push(id);
				}
			});
		},

		toggleSelection: (id) => {
			set((state) => {
				const idx = state.selectedInstanceIds.indexOf(id);
				if (idx >= 0) {
					state.selectedInstanceIds.splice(idx, 1);
				} else {
					state.selectedInstanceIds.push(id);
				}
			});
		},

		clearSelection: () => {
			set((state) => {
				state.selectedInstanceIds = [];
			});
		},

		setZoom: (zoom) => {
			set((state) => {
				state.zoom = Math.max(0.1, Math.min(5, zoom));
			});
		},

		setPan: (x, y) => {
			set((state) => {
				state.panX = x;
				state.panY = y;
			});
		},

		setGridSnap: (size) => {
			set((state) => {
				state.gridSnapSize = size;
			});
		},

		toggleGrid: () => {
			set((state) => {
				state.showGrid = !state.showGrid;
			});
		},

		toggle3DPreview: () => {
			set((state) => {
				state.show3DPreview = !state.show3DPreview;
			});
		},

		toggleEdgeLabels: () => {
			set((state) => {
				state.showEdgeLabels = !state.showEdgeLabels;
			});
		},

		toggleSidebar: () => {
			set((state) => {
				state.sidebarOpen = !state.sidebarOpen;
			});
		},

		setSidebarTab: (tab) => {
			set((state) => {
				state.sidebarTab = tab;
			});
		},

		setSearchQuery: (query) => {
			set((state) => {
				state.searchQuery = query;
			});
		},
	})),
);

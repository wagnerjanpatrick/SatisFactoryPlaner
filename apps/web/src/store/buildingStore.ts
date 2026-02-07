import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { v4 as uuid } from "uuid";
import type { PlacedBuilding } from "./types";

interface BuildingState {
	buildings: Record<string, PlacedBuilding>;
	addBuilding: (
		buildingId: string,
		x: number,
		y: number,
		rotation?: 0 | 90 | 180 | 270,
	) => string;
	removeBuilding: (instanceId: string) => void;
	removeBuildings: (instanceIds: string[]) => void;
	moveBuilding: (instanceId: string, x: number, y: number) => void;
	rotateBuilding: (instanceId: string) => void;
	setRecipe: (instanceId: string, recipeId: string | undefined) => void;
	setOverclock: (instanceId: string, percent: number) => void;
	setSomersloops: (instanceId: string, count: number) => void;
	setLabel: (instanceId: string, label: string) => void;
	setSourceItem: (instanceId: string, itemId: string | undefined) => void;
	setSourceRate: (instanceId: string, rate: number) => void;
	loadState: (buildings: Record<string, PlacedBuilding>) => void;
	clear: () => void;
}

export const useBuildingStore = create<BuildingState>()(
	immer((set) => ({
		buildings: {},

		addBuilding: (buildingId, x, y, rotation = 0) => {
			const instanceId = uuid();
			set((state) => {
				state.buildings[instanceId] = {
					instanceId,
					buildingId,
					x,
					y,
					rotation,
					overclockPercent: 100,
					somersloops: 0,
				};
			});
			return instanceId;
		},

		removeBuilding: (instanceId) => {
			set((state) => {
				delete state.buildings[instanceId];
			});
		},

		removeBuildings: (instanceIds) => {
			set((state) => {
				for (const id of instanceIds) {
					delete state.buildings[id];
				}
			});
		},

		moveBuilding: (instanceId, x, y) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.x = x;
					building.y = y;
				}
			});
		},

		rotateBuilding: (instanceId) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.rotation = ((building.rotation + 90) % 360) as
						| 0
						| 90
						| 180
						| 270;
				}
			});
		},

		setRecipe: (instanceId, recipeId) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.recipeId = recipeId;
				}
			});
		},

		setOverclock: (instanceId, percent) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.overclockPercent = Math.max(1, Math.min(250, percent));
				}
			});
		},

		setSomersloops: (instanceId, count) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.somersloops = Math.max(0, count);
				}
			});
		},

		setLabel: (instanceId, label) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.label = label;
				}
			});
		},

		setSourceItem: (instanceId, itemId) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.sourceItemId = itemId;
				}
			});
		},

		setSourceRate: (instanceId, rate) => {
			set((state) => {
				const building = state.buildings[instanceId];
				if (building) {
					building.sourceRate = Math.max(0, rate);
				}
			});
		},

		loadState: (buildings) => {
			set((state) => {
				state.buildings = buildings;
			});
		},

		clear: () => {
			set((state) => {
				state.buildings = {};
			});
		},
	})),
);

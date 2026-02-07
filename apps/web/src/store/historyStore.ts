import { create } from "zustand";
import { useBuildingStore } from "./buildingStore";
import { useConnectionStore } from "./connectionStore";
import type { Connection, PlacedBuilding } from "./types";

interface HistoryEntry {
	buildings: Record<string, PlacedBuilding>;
	connections: Record<string, Connection>;
}

interface HistoryState {
	past: HistoryEntry[];
	future: HistoryEntry[];
	maxEntries: number;
	pushSnapshot: () => void;
	undo: () => void;
	redo: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
}

function captureSnapshot(): HistoryEntry {
	return {
		buildings: structuredClone(useBuildingStore.getState().buildings),
		connections: structuredClone(useConnectionStore.getState().connections),
	};
}

function restoreSnapshot(entry: HistoryEntry) {
	useBuildingStore.getState().loadState(structuredClone(entry.buildings));
	useConnectionStore.getState().loadState(structuredClone(entry.connections));
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
	past: [],
	future: [],
	maxEntries: 50,

	pushSnapshot: () => {
		const snapshot = captureSnapshot();
		set((state) => ({
			past: [...state.past.slice(-state.maxEntries + 1), snapshot],
			future: [],
		}));
	},

	undo: () => {
		const { past } = get();
		if (past.length === 0) return;

		const current = captureSnapshot();
		const previous = past[past.length - 1]!;

		set((state) => ({
			past: state.past.slice(0, -1),
			future: [current, ...state.future],
		}));

		restoreSnapshot(previous);
	},

	redo: () => {
		const { future } = get();
		if (future.length === 0) return;

		const current = captureSnapshot();
		const next = future[0]!;

		set((state) => ({
			past: [...state.past, current],
			future: state.future.slice(1),
		}));

		restoreSnapshot(next);
	},

	canUndo: () => get().past.length > 0,
	canRedo: () => get().future.length > 0,
}));

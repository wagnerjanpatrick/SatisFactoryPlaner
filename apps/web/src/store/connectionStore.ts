import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { v4 as uuid } from "uuid";
import type { Connection } from "./types";

interface ConnectionState {
	connections: Record<string, Connection>;
	addConnection: (
		sourceInstanceId: string,
		sourcePortId: string,
		targetInstanceId: string,
		targetPortId: string,
		type: "conveyor" | "pipe",
		tier?: string,
	) => string;
	removeConnection: (id: string) => void;
	removeConnectionsForBuilding: (instanceId: string) => void;
	updateWaypoints: (id: string, waypoints: { x: number; y: number }[]) => void;
	setTier: (id: string, tier: string) => void;
	loadState: (connections: Record<string, Connection>) => void;
	clear: () => void;
}

export const useConnectionStore = create<ConnectionState>()(
	immer((set) => ({
		connections: {},

		addConnection: (
			sourceInstanceId,
			sourcePortId,
			targetInstanceId,
			targetPortId,
			type,
			tier,
		) => {
			const id = uuid();
			set((state) => {
				state.connections[id] = {
					id,
					sourceInstanceId,
					sourcePortId,
					targetInstanceId,
					targetPortId,
					type,
					tier: tier ?? (type === "conveyor" ? "mk1" : "mk1"),
					waypoints: [],
				};
			});
			return id;
		},

		removeConnection: (id) => {
			set((state) => {
				delete state.connections[id];
			});
		},

		removeConnectionsForBuilding: (instanceId) => {
			set((state) => {
				for (const [id, conn] of Object.entries(state.connections)) {
					if (
						conn.sourceInstanceId === instanceId ||
						conn.targetInstanceId === instanceId
					) {
						delete state.connections[id];
					}
				}
			});
		},

		updateWaypoints: (id, waypoints) => {
			set((state) => {
				const conn = state.connections[id];
				if (conn) {
					conn.waypoints = waypoints;
				}
			});
		},

		setTier: (id, tier) => {
			set((state) => {
				const conn = state.connections[id];
				if (conn) {
					conn.tier = tier;
				}
			});
		},

		loadState: (connections) => {
			set((state) => {
				state.connections = connections;
			});
		},

		clear: () => {
			set((state) => {
				state.connections = {};
			});
		},
	})),
);

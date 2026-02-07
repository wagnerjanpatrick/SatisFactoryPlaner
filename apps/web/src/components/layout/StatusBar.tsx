"use client";

import { useUIStore } from "@/store/uiStore";
import { useBuildingStore } from "@/store/buildingStore";
import { useConnectionStore } from "@/store/connectionStore";

export function StatusBar() {
	const toolMode = useUIStore((s) => s.toolMode);
	const selectedCount = useUIStore((s) => s.selectedInstanceIds.length);
	const buildingCount = useBuildingStore((s) => Object.keys(s.buildings).length);
	const connectionCount = useConnectionStore((s) => Object.keys(s.connections).length);

	return (
		<div className="flex items-center gap-4 border-t border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-500">
			<span>Mode: {toolMode.toUpperCase()}</span>
			<span>Buildings: {buildingCount}</span>
			<span>Connections: {connectionCount}</span>
			{selectedCount > 0 && <span>Selected: {selectedCount}</span>}
		</div>
	);
}

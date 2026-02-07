"use client";

import { useUIStore } from "@/store/uiStore";
import { useBuildingStore } from "@/store/buildingStore";
import { useConnectionStore } from "@/store/connectionStore";

export function StatusOverlay() {
	const toolMode = useUIStore((s) => s.toolMode);
	const selectedCount = useUIStore((s) => s.selectedInstanceIds.length);
	const buildingCount = useBuildingStore(
		(s) => Object.keys(s.buildings).length,
	);
	const connectionCount = useConnectionStore(
		(s) => Object.keys(s.connections).length,
	);

	return (
		<div
			className="absolute bottom-4 left-4 z-30 flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 shadow-sm backdrop-blur-sm"
			onPointerDown={(e) => e.stopPropagation()}
		>
			<span className="font-medium text-zinc-300">
				{toolMode.toUpperCase()}
			</span>
			<span className="text-zinc-600">&middot;</span>
			<span>{buildingCount} Buildings</span>
			<span className="text-zinc-600">&middot;</span>
			<span>{connectionCount} Connections</span>
			{selectedCount > 0 && (
				<>
					<span className="text-zinc-600">&middot;</span>
					<span>{selectedCount} Selected</span>
				</>
			)}
		</div>
	);
}

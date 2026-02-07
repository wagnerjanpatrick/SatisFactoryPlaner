"use client";

import { Settings, Grid3x3, Tag, Box, Magnet } from "lucide-react";
import { Button } from "@SatisFactoryPlaner/ui/components/button";
import { Switch } from "@SatisFactoryPlaner/ui/components/switch";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@SatisFactoryPlaner/ui/components/popover";
import { useUIStore } from "@/store/uiStore";

export function SettingsOverlay() {
	const showGrid = useUIStore((s) => s.showGrid);
	const toggleGrid = useUIStore((s) => s.toggleGrid);
	const showEdgeLabels = useUIStore((s) => s.showEdgeLabels);
	const toggleEdgeLabels = useUIStore((s) => s.toggleEdgeLabels);
	const gridSnapSize = useUIStore((s) => s.gridSnapSize);
	const setGridSnap = useUIStore((s) => s.setGridSnap);
	const show3DPreview = useUIStore((s) => s.show3DPreview);
	const toggle3DPreview = useUIStore((s) => s.toggle3DPreview);

	return (
		<div
			className="absolute top-4 right-4 z-30"
			onPointerDown={(e) => e.stopPropagation()}
		>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 rounded-full border border-zinc-700/50 bg-zinc-900/80 shadow-lg backdrop-blur-sm hover:bg-zinc-800/80"
					>
						<Settings size={16} />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" side="bottom" className="w-56 p-3">
					<div className="flex flex-col gap-3">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm text-zinc-300">
								<Grid3x3 size={14} className="text-zinc-500" />
								Show Grid
							</div>
							<Switch
								checked={showGrid}
								onCheckedChange={toggleGrid}
							/>
						</div>

						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm text-zinc-300">
								<Tag size={14} className="text-zinc-500" />
								Belt Labels
							</div>
							<Switch
								checked={showEdgeLabels}
								onCheckedChange={toggleEdgeLabels}
							/>
						</div>

						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm text-zinc-300">
								<Magnet size={14} className="text-zinc-500" />
								Snap Size
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setGridSnap(gridSnapSize === 8 ? 1 : 8)}
								className="h-7 px-2 text-xs text-zinc-400"
							>
								{gridSnapSize}m
							</Button>
						</div>

						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-sm text-zinc-300">
								<Box size={14} className="text-zinc-500" />
								3D Preview
							</div>
							<Switch
								checked={show3DPreview}
								onCheckedChange={toggle3DPreview}
							/>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

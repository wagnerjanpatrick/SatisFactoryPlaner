"use client";

import {
	MousePointer2,
	Hammer,
	Cable,
	Trash2,
	Hand,
	Undo2,
	Redo2,
	Grid3x3,
	Box,
	Tag,
} from "lucide-react";
import { Button } from "@SatisFactoryPlaner/ui/components/button";
import { Toggle } from "@SatisFactoryPlaner/ui/components/toggle";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@SatisFactoryPlaner/ui/components/tooltip";
import { Separator } from "@SatisFactoryPlaner/ui/components/separator";
import { useUIStore } from "@/store/uiStore";
import { useHistoryStore } from "@/store/historyStore";
import type { ToolMode } from "@/store/types";

const TOOLS: {
	mode: ToolMode;
	icon: typeof MousePointer2;
	label: string;
	shortcut: string;
}[] = [
	{ mode: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
	{ mode: "build", icon: Hammer, label: "Build", shortcut: "B" },
	{ mode: "connect", icon: Cable, label: "Connect", shortcut: "C" },
	{ mode: "delete", icon: Trash2, label: "Delete", shortcut: "X" },
	{ mode: "pan", icon: Hand, label: "Pan", shortcut: "H" },
];

export function Toolbar() {
	const toolMode = useUIStore((s) => s.toolMode);
	const setToolMode = useUIStore((s) => s.setToolMode);
	const showGrid = useUIStore((s) => s.showGrid);
	const toggleGrid = useUIStore((s) => s.toggleGrid);
	const show3DPreview = useUIStore((s) => s.show3DPreview);
	const toggle3DPreview = useUIStore((s) => s.toggle3DPreview);
	const showEdgeLabels = useUIStore((s) => s.showEdgeLabels);
	const toggleEdgeLabels = useUIStore((s) => s.toggleEdgeLabels);
	const gridSnapSize = useUIStore((s) => s.gridSnapSize);
	const setGridSnap = useUIStore((s) => s.setGridSnap);
	const undo = useHistoryStore((s) => s.undo);
	const redo = useHistoryStore((s) => s.redo);
	const canUndo = useHistoryStore((s) => s.canUndo);
	const canRedo = useHistoryStore((s) => s.canRedo);

	return (
		<div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1">
			<div className="flex items-center gap-0.5">
				{TOOLS.map(({ mode, icon: Icon, label, shortcut }) => (
					<Tooltip key={mode}>
						<TooltipTrigger asChild>
							<Toggle
								size="sm"
								pressed={toolMode === mode}
								onPressedChange={() => setToolMode(mode)}
								aria-label={label}
							>
								<Icon size={14} />
								<span className="hidden sm:inline text-xs">
									{label}
								</span>
							</Toggle>
						</TooltipTrigger>
						<TooltipContent>
							{label} ({shortcut})
						</TooltipContent>
					</Tooltip>
				))}
			</div>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<div className="flex items-center gap-0.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={undo}
							disabled={!canUndo()}
							className="h-8 w-8"
						>
							<Undo2 size={14} />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Undo (Ctrl+Z)</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={redo}
							disabled={!canRedo()}
							className="h-8 w-8"
						>
							<Redo2 size={14} />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Redo (Ctrl+Y)</TooltipContent>
				</Tooltip>
			</div>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<Tooltip>
				<TooltipTrigger asChild>
					<Toggle
						size="sm"
						pressed={showGrid}
						onPressedChange={toggleGrid}
						aria-label="Toggle Grid"
					>
						<Grid3x3 size={14} />
					</Toggle>
				</TooltipTrigger>
				<TooltipContent>Toggle Grid (G)</TooltipContent>
			</Tooltip>

			<Tooltip>
				<TooltipTrigger asChild>
					<Toggle
						size="sm"
						pressed={showEdgeLabels}
						onPressedChange={toggleEdgeLabels}
						aria-label="Toggle Belt Labels"
					>
						<Tag size={14} />
					</Toggle>
				</TooltipTrigger>
				<TooltipContent>Toggle Belt Speed Labels</TooltipContent>
			</Tooltip>

			<Button
				variant="ghost"
				size="sm"
				onClick={() => setGridSnap(gridSnapSize === 8 ? 1 : 8)}
				className="text-xs text-muted-foreground"
			>
				Snap: {gridSnapSize}m
			</Button>

			<div className="flex-1" />

			<Tooltip>
				<TooltipTrigger asChild>
					<Toggle
						size="sm"
						pressed={show3DPreview}
						onPressedChange={toggle3DPreview}
						aria-label="Toggle 3D Preview"
					>
						<Box size={14} />
						<span className="hidden sm:inline text-xs">3D</span>
					</Toggle>
				</TooltipTrigger>
				<TooltipContent>Toggle 3D Preview</TooltipContent>
			</Tooltip>
		</div>
	);
}

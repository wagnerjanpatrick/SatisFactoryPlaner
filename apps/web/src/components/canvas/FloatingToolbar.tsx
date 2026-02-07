"use client";

import {
	MousePointer2,
	Hammer,
	Cable,
	Trash2,
	Hand,
	Undo2,
	Redo2,
	Search,
	TreePine,
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

interface FloatingToolbarProps {
	onQuickAdd: () => void;
	onProductionPlanner: () => void;
}

export function FloatingToolbar({ onQuickAdd, onProductionPlanner }: FloatingToolbarProps) {
	const toolMode = useUIStore((s) => s.toolMode);
	const setToolMode = useUIStore((s) => s.setToolMode);
	const undo = useHistoryStore((s) => s.undo);
	const redo = useHistoryStore((s) => s.redo);
	const canUndo = useHistoryStore((s) => s.canUndo);
	const canRedo = useHistoryStore((s) => s.canRedo);

	return (
		<div
			className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-zinc-700/50 bg-zinc-900/80 px-2 py-1 shadow-lg backdrop-blur-sm"
			onPointerDown={(e) => e.stopPropagation()}
		>
			{TOOLS.map(({ mode, icon: Icon, label, shortcut }) => (
				<Tooltip key={mode}>
					<TooltipTrigger asChild>
						<Toggle
							size="sm"
							pressed={toolMode === mode}
							onPressedChange={() => setToolMode(mode)}
							aria-label={label}
						>
							<Icon size={16} />
						</Toggle>
					</TooltipTrigger>
					<TooltipContent side="top">
						{label} ({shortcut})
					</TooltipContent>
				</Tooltip>
			))}

			<Separator orientation="vertical" className="mx-1 h-5" />

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={onQuickAdd}
						className="h-7 w-7"
					>
						<Search size={16} />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top">Quick Add (Q)</TooltipContent>
			</Tooltip>

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={onProductionPlanner}
						className="h-7 w-7"
					>
						<TreePine size={16} />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top">Production Planner</TooltipContent>
			</Tooltip>

			<Separator orientation="vertical" className="mx-1 h-5" />

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={undo}
						disabled={!canUndo()}
						className="h-7 w-7"
					>
						<Undo2 size={16} />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top">Undo (Ctrl+Z)</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						onClick={redo}
						disabled={!canRedo()}
						className="h-7 w-7"
					>
						<Redo2 size={16} />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top">Redo (Ctrl+Y)</TooltipContent>
			</Tooltip>
		</div>
	);
}

"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@SatisFactoryPlaner/ui/components/tooltip";

export function SidebarToggle() {
	const sidebarOpen = useUIStore((s) => s.sidebarOpen);
	const toggleSidebar = useUIStore((s) => s.toggleSidebar);
	const Icon = sidebarOpen ? PanelLeftClose : PanelLeft;

	return (
		<div
			className="absolute top-3 left-3 z-30"
			onPointerDown={(e) => e.stopPropagation()}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={toggleSidebar}
						className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-900/80 text-zinc-400 shadow-lg backdrop-blur-sm transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
					>
						<Icon size={16} />
					</button>
				</TooltipTrigger>
				<TooltipContent side="right">
					{sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
				</TooltipContent>
			</Tooltip>
		</div>
	);
}

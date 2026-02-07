"use client";

import { Sidebar } from "../sidebar/Sidebar";
import { CanvasWrapper } from "../canvas/CanvasWrapper";
import { useUIStore } from "@/store/uiStore";

export function AppShell() {
	const sidebarOpen = useUIStore((s) => s.sidebarOpen);

	return (
		<div className="flex h-full overflow-hidden bg-zinc-950 text-zinc-100">
			{sidebarOpen && <Sidebar />}
			<CanvasWrapper />
		</div>
	);
}

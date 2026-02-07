"use client";

import { BuildMenu } from "./BuildMenu";

export function Sidebar() {
	return (
		<div className="flex w-72 flex-col border-r border-border bg-card">
			<div className="flex items-center px-3 py-2 border-b border-border">
				<span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
					Buildings
				</span>
			</div>
			<div className="flex-1 overflow-y-auto">
				<BuildMenu />
			</div>
			<div className="flex items-center justify-center gap-1.5 border-t border-border px-3 py-2 text-[11px] text-zinc-500">
				Press
				<kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
					Q
				</kbd>
				to quick-add from anywhere
			</div>
		</div>
	);
}

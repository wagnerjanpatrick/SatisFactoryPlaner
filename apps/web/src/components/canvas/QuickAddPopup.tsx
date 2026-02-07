"use client";

import { useEffect, useRef, useMemo } from "react";
import { BUILDINGS } from "@/data";
import type { BuildingCategory } from "@/data/types";
import {
	Command,
	CommandInput,
	CommandList,
	CommandGroup,
	CommandItem,
	CommandEmpty,
} from "@SatisFactoryPlaner/ui/components/command";

const CATEGORY_LABELS: Record<string, string> = {
	source: "Source",
	production: "Production",
	logistics: "Logistics",
	power: "Power",
	storage: "Storage",
	transport: "Transport",
	special: "Special",
};

const CATEGORY_ORDER: BuildingCategory[] = [
	"production",
	"logistics",
	"source",
	"power",
	"storage",
	"transport",
	"special",
];

interface QuickAddPopupProps {
	onSelect: (buildingId: string) => void;
	onClose: () => void;
}

export function QuickAddPopup({ onSelect, onClose }: QuickAddPopupProps) {
	const ref = useRef<HTMLDivElement>(null);

	// Group all buildings by category
	const grouped = useMemo(() => {
		const groups: Record<string, typeof BUILDINGS> = {};
		for (const b of BUILDINGS) {
			const cat = b.category;
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(b);
		}
		return groups;
	}, []);

	// Close on Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [onClose]);

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40"
				onMouseDown={onClose}
			/>
			<div
				ref={ref}
				className="fixed left-1/2 top-1/3 z-50 w-72 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover shadow-xl"
			>
				<Command className="rounded-lg">
					<CommandInput placeholder="Search buildings..." autoFocus />
					<CommandList>
						<CommandEmpty>No buildings found.</CommandEmpty>
						{CATEGORY_ORDER.map((category) => {
							const buildings = grouped[category];
							if (!buildings || buildings.length === 0) return null;
							return (
								<CommandGroup
									key={category}
									heading={CATEGORY_LABELS[category] ?? category}
								>
									{buildings.map((b) => {
										const conveyorPorts = b.ports.filter(
											(p) => p.type === "conveyor",
										).length;
										const pipePorts = b.ports.filter(
											(p) => p.type === "pipe",
										).length;

										return (
											<CommandItem
												key={b.id}
												value={b.name}
												onSelect={() => onSelect(b.id)}
												className="flex items-center gap-2 cursor-pointer"
											>
												<span
													className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
													style={{ backgroundColor: b.color }}
												/>
												<span className="truncate">{b.name}</span>
												<span className="ml-auto flex items-center gap-1.5 text-[10px]">
													{conveyorPorts > 0 && (
														<span className="text-orange-400">
															{conveyorPorts}
														</span>
													)}
													{pipePorts > 0 && (
														<span className="text-cyan-400">
															{pipePorts}
														</span>
													)}
												</span>
											</CommandItem>
										);
									})}
								</CommandGroup>
							);
						})}
					</CommandList>
				</Command>
			</div>
		</>
	);
}

"use client";

import { useEffect, useRef, useMemo } from "react";
import { BUILDINGS } from "@/data";
import type { PortType, PortDirection } from "@/data/types";
import {
	Command,
	CommandInput,
	CommandList,
	CommandGroup,
	CommandItem,
	CommandEmpty,
} from "@SatisFactoryPlaner/ui/components/command";

interface NodeSearchPopupProps {
	/** Screen-space position for the popup */
	screenPosition: { x: number; y: number };
	/** Port type of the dragged connection */
	portType: PortType;
	/** Direction of the SOURCE port (the port the user dragged from) */
	portDirection: PortDirection;
	onSelect: (buildingId: string) => void;
	onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
	source: "Source",
	production: "Production",
	logistics: "Logistics",
	power: "Power",
	storage: "Storage",
	transport: "Transport",
	special: "Special",
};

export function NodeSearchPopup({
	screenPosition,
	portType,
	portDirection,
	onSelect,
	onClose,
}: NodeSearchPopupProps) {
	const ref = useRef<HTMLDivElement>(null);

	// Filter buildings: show ones with a compatible port
	const compatibleBuildings = useMemo(() => {
		const needDirection: PortDirection =
			portDirection === "output" ? "input" : "output";
		return BUILDINGS.filter((b) =>
			b.ports.some((p) => p.type === portType && p.direction === needDirection),
		);
	}, [portType, portDirection]);

	// Group by category
	const grouped = useMemo(() => {
		const groups: Record<string, typeof compatibleBuildings> = {};
		for (const b of compatibleBuildings) {
			const cat = b.category;
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(b);
		}
		return groups;
	}, [compatibleBuildings]);

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
			{/* Backdrop to catch clicks outside the popup */}
			<div
				className="fixed inset-0 z-40"
				onMouseDown={onClose}
			/>
			<div
				ref={ref}
				className="fixed z-50 w-64 rounded-lg border border-border bg-popover shadow-xl"
			style={{
				left: screenPosition.x,
				top: screenPosition.y,
				transform: "translate(-50%, 8px)",
			}}
		>
			<Command className="rounded-lg">
				<CommandInput placeholder="Search buildings..." autoFocus />
				<CommandList>
					<CommandEmpty>No buildings found.</CommandEmpty>
					{Object.entries(grouped).map(([category, buildings]) => (
						<CommandGroup
							key={category}
							heading={CATEGORY_LABELS[category] ?? category}
						>
							{buildings.map((b) => (
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
									<span className="ml-auto text-xs text-muted-foreground">
										{b.ports.filter((p) => p.type === portType).length}p
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					))}
				</CommandList>
			</Command>
		</div>
		</>
	);
}

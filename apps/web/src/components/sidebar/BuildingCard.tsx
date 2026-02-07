"use client";

import type { BuildingDefinition } from "@/data/types";
import { useUIStore } from "@/store/uiStore";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@SatisFactoryPlaner/ui/components/tooltip";
import { cn } from "@SatisFactoryPlaner/ui/lib/utils";

interface BuildingCardProps {
	building: BuildingDefinition;
}

export function BuildingCard({ building }: BuildingCardProps) {
	const selectedBuildingDefId = useUIStore((s) => s.selectedBuildingDefId);
	const setSelectedBuildingDef = useUIStore((s) => s.setSelectedBuildingDef);

	const isSelected = selectedBuildingDefId === building.id;

	const conveyorIn = building.ports.filter(
		(p) => p.type === "conveyor" && p.direction === "input",
	).length;
	const conveyorOut = building.ports.filter(
		(p) => p.type === "conveyor" && p.direction === "output",
	).length;
	const pipeIn = building.ports.filter(
		(p) => p.type === "pipe" && p.direction === "input",
	).length;
	const pipeOut = building.ports.filter(
		(p) => p.type === "pipe" && p.direction === "output",
	).length;

	const powerText =
		building.powerConsumption > 0
			? `${building.powerConsumption} MW`
			: building.powerConsumption < 0
				? `${Math.abs(building.powerConsumption)} MW`
				: null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					draggable
					onDragStart={(e) => {
						e.dataTransfer.setData(
							"application/satisfactory-building",
							building.id,
						);
						e.dataTransfer.effectAllowed = "move";
					}}
					onClick={() =>
						setSelectedBuildingDef(isSelected ? null : building.id)
					}
					className={cn(
						"flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-left transition-colors",
						isSelected
							? "bg-primary/20 ring-1 ring-primary"
							: "hover:bg-accent",
					)}
				>
					<div
						className="h-7 w-7 shrink-0 rounded"
						style={{ backgroundColor: building.color }}
					/>
					<div className="min-w-0 flex-1">
						<div className="truncate text-xs font-medium text-foreground">
							{building.name}
						</div>
						<div className="flex items-center gap-1.5 mt-0.5">
							{(conveyorIn > 0 || conveyorOut > 0) && (
								<span className="text-[10px] text-orange-400">
									{conveyorIn > 0 && `${conveyorIn}in`}
									{conveyorIn > 0 && conveyorOut > 0 && "/"}
									{conveyorOut > 0 && `${conveyorOut}out`}
								</span>
							)}
							{(pipeIn > 0 || pipeOut > 0) && (
								<span className="text-[10px] text-cyan-400">
									{pipeIn > 0 && `${pipeIn}in`}
									{pipeIn > 0 && pipeOut > 0 && "/"}
									{pipeOut > 0 && `${pipeOut}out`}
								</span>
							)}
							{powerText && (
								<span className={cn(
									"text-[10px] ml-auto",
									building.powerConsumption < 0
										? "text-green-400"
										: "text-zinc-500",
								)}>
									{powerText}
								</span>
							)}
						</div>
					</div>
				</button>
			</TooltipTrigger>
			<TooltipContent side="right">
				<p className="font-medium">{building.name}</p>
				<p className="text-muted-foreground">
					{building.width}m x {building.length}m |{" "}
					{building.powerConsumption > 0
						? `${building.powerConsumption} MW`
						: building.powerConsumption < 0
							? `${Math.abs(building.powerConsumption)} MW gen`
							: "No power"}
				</p>
				{building.description && (
					<p className="text-muted-foreground text-xs mt-1">
						{building.description}
					</p>
				)}
			</TooltipContent>
		</Tooltip>
	);
}

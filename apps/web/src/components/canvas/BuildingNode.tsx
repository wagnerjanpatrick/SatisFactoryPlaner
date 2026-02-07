"use client";

import { memo, useMemo, useCallback, Fragment } from "react";
import { Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import type { BuildingNode as BuildingNodeType } from "@/store/flowTypes";
import { getBuildingDef, getRecipesForBuilding, getRecipe, getItem, ITEMS } from "@/data";
import { getRotatedSize, getEffectiveSide, getEffectiveOffset } from "@/lib/geometry";
import { PIXELS_PER_METER } from "@/lib/constants";
import { useBuildingStore } from "@/store/buildingStore";
import { useHistoryStore } from "@/store/historyStore";
import { useUIStore } from "@/store/uiStore";
import { useNodeAnalysis } from "@/hooks/useFlowAnalysis";
import { BaseNode } from "./BaseNode";
import { BaseHandle } from "./BaseHandle";
import { cn } from "@SatisFactoryPlaner/ui/lib/utils";
import { Slider } from "@SatisFactoryPlaner/ui/components/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@SatisFactoryPlaner/ui/components/select";
import { Input } from "@SatisFactoryPlaner/ui/components/input";

const POSITION_MAP = {
	left: Position.Left,
	right: Position.Right,
	top: Position.Top,
	bottom: Position.Bottom,
} as const;

const STATUS_COLORS: Record<string, { border: string; shadow: string } | undefined> = {
	ok: { border: "#22c55e", shadow: "0 0 6px #22c55e44" },
	warning: { border: "#eab308", shadow: "0 0 6px #eab30844" },
	error: { border: "#ef4444", shadow: "0 0 6px #ef444444" },
	bottleneck: { border: "#f97316", shadow: "0 0 6px #f9731644" },
	overproducing: { border: "#3b82f6", shadow: "0 0 6px #3b82f644" },
};

function BuildingNodeComponent({ id, data, selected, dragging }: NodeProps<BuildingNodeType>) {
	const def = getBuildingDef(data.buildingId);
	const { deleteElements } = useReactFlow();
	const setRecipe = useBuildingStore((s) => s.setRecipe);
	const setOverclock = useBuildingStore((s) => s.setOverclock);
	const setSomersloops = useBuildingStore((s) => s.setSomersloops);
	const setSourceItem = useBuildingStore((s) => s.setSourceItem);
	const setSourceRate = useBuildingStore((s) => s.setSourceRate);
	const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
	const focusedId = useUIStore((s) => s.focusedInstanceId);
	const setHoveredInstance = useUIStore((s) => s.setHoveredInstance);
	const isFocused = focusedId === id;
	const nodeAnalysis = useNodeAnalysis(id);

	const onMouseEnter = useCallback(() => setHoveredInstance(id), [id, setHoveredInstance]);
	const onMouseLeave = useCallback(() => setHoveredInstance(null), [setHoveredInstance]);

	if (!def) return null;

	const { width, length } = getRotatedSize(def, data.rotation);
	const pxWidth = width * PIXELS_PER_METER;
	const pxHeight = length * PIXELS_PER_METER;
	const isSource = def.category === "source";
	const recipes = getRecipesForBuilding(data.buildingId);
	const currentRecipe = data.recipeId ? getRecipe(data.recipeId) : null;
	const hasControls = recipes.length > 0 || def.canOverclock || def.somersloopSlots > 0;

	// Status styling
	const statusStyle = nodeAnalysis ? STATUS_COLORS[nodeAnalysis.status] : undefined;

	// Port rate + item map
	const portRateMap = useMemo(() => {
		if (!def) return {} as Record<string, number>;
		const map: Record<string, number> = {};
		const mult = data.overclockPercent / 100;

		if (isSource) {
			if (data.sourceRate && data.sourceRate > 0) {
				const rate = Math.round(data.sourceRate * mult * 10) / 10;
				for (const port of def.ports.filter((p) => p.direction === "output")) {
					map[port.id] = rate;
				}
			}
			return map;
		}

		if (!currentRecipe) return map;
		const inputPorts = def.ports.filter((p) => p.direction === "input");
		const outputPorts = def.ports.filter((p) => p.direction === "output");
		currentRecipe.inputs.forEach((io, i) => {
			if (inputPorts[i]) {
				map[inputPorts[i].id] = Math.round(io.perMinute * mult * 10) / 10;
			}
		});
		currentRecipe.outputs.forEach((io, i) => {
			if (outputPorts[i]) {
				map[outputPorts[i].id] = Math.round(io.perMinute * mult * 10) / 10;
			}
		});
		return map;
	}, [currentRecipe, def, data.overclockPercent, data.sourceRate, isSource]);

	// Port-to-item name map
	const portItemMap = useMemo(() => {
		if (!def) return {} as Record<string, string>;
		const map: Record<string, string> = {};

		if (isSource && data.sourceItemId) {
			const item = getItem(data.sourceItemId);
			if (item) {
				for (const port of def.ports.filter((p) => p.direction === "output")) {
					map[port.id] = item.name;
				}
			}
			return map;
		}

		if (!currentRecipe) return map;
		const inputPorts = def.ports.filter((p) => p.direction === "input");
		const outputPorts = def.ports.filter((p) => p.direction === "output");
		currentRecipe.inputs.forEach((io, i) => {
			if (inputPorts[i]) {
				const item = getItem(io.itemId);
				if (item) map[inputPorts[i].id] = item.name;
			}
		});
		currentRecipe.outputs.forEach((io, i) => {
			if (outputPorts[i]) {
				const item = getItem(io.itemId);
				if (item) map[outputPorts[i].id] = item.name;
			}
		});
		return map;
	}, [currentRecipe, def, isSource, data.sourceItemId]);

	const onDelete = useCallback(() => {
		deleteElements({ nodes: [{ id }] });
	}, [id, deleteElements]);

	// Recipe change (applies to all selected of same type)
	const onRecipeChange = useCallback(
		(value: string) => {
			pushSnapshot();
			const recipeId = value === "__none__" ? undefined : value;
			const allBuildings = useBuildingStore.getState().buildings;
			const currentSelectedIds = useUIStore.getState().selectedInstanceIds;
			for (const sid of currentSelectedIds) {
				const b = allBuildings[sid];
				if (b && b.buildingId === data.buildingId) {
					setRecipe(sid, recipeId);
				}
			}
		},
		[pushSnapshot, data.buildingId, setRecipe],
	);

	// Overclock slider (all selected)
	const onOverclockChange = useCallback(
		(values: number[]) => {
			const v = values[0];
			if (v === undefined) return;
			const allBuildings = useBuildingStore.getState().buildings;
			const currentSelectedIds = useUIStore.getState().selectedInstanceIds;
			for (const sid of currentSelectedIds) {
				const b = allBuildings[sid];
				if (!b) continue;
				const d = getBuildingDef(b.buildingId);
				if (d?.canOverclock) {
					setOverclock(sid, v);
				}
			}
		},
		[setOverclock],
	);

	// Overclock number input (all selected)
	const onOverclockInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const v = Number.parseInt(e.target.value, 10);
			if (Number.isNaN(v)) return;
			const clamped = Math.max(1, Math.min(250, v));
			const allBuildings = useBuildingStore.getState().buildings;
			const currentSelectedIds = useUIStore.getState().selectedInstanceIds;
			for (const sid of currentSelectedIds) {
				const b = allBuildings[sid];
				if (!b) continue;
				const d = getBuildingDef(b.buildingId);
				if (d?.canOverclock) {
					setOverclock(sid, clamped);
				}
			}
		},
		[setOverclock],
	);

	// Somersloops number input
	const onSomersloopsChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const v = Number.parseInt(e.target.value, 10);
			if (Number.isNaN(v)) return;
			setSomersloops(id, Math.max(0, Math.min(def?.somersloopSlots ?? 0, v)));
		},
		[id, setSomersloops, def?.somersloopSlots],
	);

	const onInputBlur = useCallback(() => {
		pushSnapshot();
	}, [pushSnapshot]);

	// Source node callbacks
	const onSourceItemChange = useCallback(
		(value: string) => {
			pushSnapshot();
			const itemId = value === "__none__" ? undefined : value;
			setSourceItem(id, itemId);
		},
		[pushSnapshot, id, setSourceItem],
	);

	const onSourceRateChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = Number.parseFloat(e.target.value);
			if (!Number.isNaN(val)) {
				setSourceRate(id, val);
			}
		},
		[id, setSourceRate],
	);

	// Handles — absolute pixel positioning so controls don't shift handles
	const handles = useMemo(() => {
		if (!def) return null;

		const outputClip: Record<string, string> = {
			right: "polygon(0 0, 100% 50%, 0 100%)",
			left: "polygon(100% 0, 0 50%, 100% 100%)",
			bottom: "polygon(0 0, 100% 0, 50% 100%)",
			top: "polygon(50% 0, 100% 100%, 0 100%)",
		};

		return def.ports.map((port) => {
			const effectiveSide = getEffectiveSide(port.side, data.rotation);
			const effectiveOffset = getEffectiveOffset(port, def, data.rotation);
			const rfPosition = POSITION_MAP[effectiveSide];
			const isHorizontalEdge = effectiveSide === "top" || effectiveSide === "bottom";
			const isInput = port.direction === "input";

			const offsetStyle: React.CSSProperties = isHorizontalEdge
				? { left: `${effectiveOffset * pxWidth}px` }
				: { top: `${effectiveOffset * pxHeight}px` };

			const colorClass = port.type === "conveyor"
				? isInput
					? "!border-orange-500 !bg-orange-500/20"
					: "!border-none !bg-orange-500"
				: isInput
					? "!border-cyan-500 !bg-cyan-500/20 !rounded-sm"
					: "!border-none !bg-cyan-500";

			if (!isInput) {
				Object.assign(offsetStyle, {
					clipPath: outputClip[effectiveSide],
				});
			}

			// Rate + item labels — positioned outside the node boundary, next to handles
			const rate = portRateMap[port.id];
			const itemName = portItemMap[port.id];
			const labelStyle: React.CSSProperties = { position: "absolute", fontSize: 10, whiteSpace: "nowrap" };
			if (effectiveSide === "left") {
				labelStyle.right = `${pxWidth}px`;
				labelStyle.top = `${effectiveOffset * pxHeight}px`;
				labelStyle.transform = "translate(-8px, -50%)";
				labelStyle.textAlign = "right";
			} else if (effectiveSide === "right") {
				labelStyle.left = `${pxWidth}px`;
				labelStyle.top = `${effectiveOffset * pxHeight}px`;
				labelStyle.transform = "translate(8px, -50%)";
			} else if (effectiveSide === "top") {
				labelStyle.left = `${effectiveOffset * pxWidth}px`;
				labelStyle.top = 0;
				labelStyle.transform = "translate(-50%, calc(-100% - 8px))";
				labelStyle.textAlign = "center";
			} else {
				labelStyle.left = `${effectiveOffset * pxWidth}px`;
				labelStyle.top = `${pxHeight}px`;
				labelStyle.transform = "translate(-50%, 8px)";
				labelStyle.textAlign = "center";
			}

			const hasLabel = rate !== undefined || itemName;

			return (
				<Fragment key={port.id}>
					<BaseHandle
						id={port.id}
						type={isInput ? "target" : "source"}
						position={rfPosition}
						className={cn(
							"!h-3 !w-3",
							isInput ? "!rounded-full" : "!rounded-none",
							colorClass,
						)}
						style={offsetStyle}
					/>
					{hasLabel && (
						<div
							className="pointer-events-none select-none font-medium text-white/80"
							style={labelStyle}
						>
							{itemName && <div className="text-[8px] text-white/50">{itemName}</div>}
							{rate !== undefined && <div>{rate}</div>}
						</div>
					)}
				</Fragment>
			);
		});
	}, [def, data.rotation, portRateMap, portItemMap, pxWidth, pxHeight]);

	// --- Source nodes ---
	if (isSource) {
		const sourceItem = data.sourceItemId ? getItem(data.sourceItemId) : null;
		const sourceRate = data.sourceRate ?? 0;
		const sourceFontSize = Math.max(8, Math.min(14, pxWidth * 0.12));

		// Filter items based on source type
		const availableItems = useMemo(() => {
			if (data.buildingId === "resource-node") {
				return ITEMS.filter((i) => i.category === "solid");
			}
			if (data.buildingId === "resource-well") {
				return ITEMS.filter((i) => i.category === "fluid");
			}
			return ITEMS;
		}, [data.buildingId]);

		return (
			<div
				style={{ width: pxWidth, height: pxHeight }}
				className="relative"
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				<BaseNode
					className={cn(
						"h-full w-full !rounded-full !border-dashed !border-2",
						"flex flex-col items-center justify-center",
					)}
					style={{
						borderColor: statusStyle?.border ?? def.color,
						backgroundColor: `${def.color}22`,
						boxShadow: statusStyle?.shadow,
					}}
				>
					<span
						style={{ fontSize: sourceFontSize, color: def.color }}
						className="text-center leading-tight select-none font-medium px-1"
					>
						{sourceItem ? sourceItem.name : def.name}
					</span>
					{sourceRate > 0 && (
						<span
							style={{ fontSize: Math.max(8, sourceFontSize - 2) }}
							className="text-white/50 select-none"
						>
							{sourceRate}/min
						</span>
					)}
				</BaseNode>
				{selected && (
					<button
						type="button"
						onClick={onDelete}
						className="nodrag nopan absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition"
					>
						<Trash2 size={10} />
					</button>
				)}

				{/* Source config — floating panel */}
				{selected && isFocused && !dragging && (
					<div
						className="nodrag nopan absolute z-20 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 shadow-xl text-popover-foreground space-y-1.5"
						style={{ top: pxHeight + 8, minWidth: 200 }}
					>
						<Select
							value={data.sourceItemId ?? "__none__"}
							onValueChange={onSourceItemChange}
						>
							<SelectTrigger className="nodrag h-7 w-full text-[11px]">
								<SelectValue placeholder="Select item" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">No item</SelectItem>
								{availableItems.map((item) => (
									<SelectItem key={item.id} value={item.id}>
										{item.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="flex items-center gap-1.5">
							<Input
								type="number"
								min={0}
								step={1}
								value={sourceRate || ""}
								onChange={onSourceRateChange}
								onBlur={onInputBlur}
								placeholder="0"
								className="nodrag !h-7 w-full !px-2 !text-[11px]"
							/>
							<span className="shrink-0 text-[11px] text-white/50">/min</span>
						</div>
						{def.canOverclock && (
							<div className="space-y-1">
								<div className="flex items-center gap-1">
									<span className="text-[10px] text-white/50 shrink-0">Clock Speed:</span>
									<Input
										type="number"
										min={1}
										max={250}
										value={data.overclockPercent}
										onChange={onOverclockInputChange}
										onBlur={onInputBlur}
										className="nodrag !h-5 w-14 !px-1 !text-[11px] text-center"
									/>
									<span className="text-[10px] text-white/50">%</span>
								</div>
								<Slider
									min={1}
									max={250}
									step={1}
									value={[data.overclockPercent]}
									onValueChange={onOverclockChange}
									className="nodrag"
								/>
							</div>
						)}
					</div>
				)}

				{handles}
			</div>
		);
	}

	const hasAdvanced = def.canOverclock || def.somersloopSlots > 0;

	// --- Regular buildings ---
	return (
		<div
			style={{ width: pxWidth, height: pxHeight }}
			className="relative"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<BaseNode
				className="h-full w-full flex flex-col overflow-hidden"
				style={{
					backgroundColor: `${def.color}30`,
					borderColor: statusStyle?.border ?? `${def.color}66`,
					boxShadow: statusStyle?.shadow,
				}}
			>
				{/* Name header */}
				<div
					className="w-full shrink-0 px-2 py-1 text-center"
					style={{ backgroundColor: `${def.color}55` }}
				>
					<span className="text-[13px] leading-tight select-none font-semibold text-white drop-shadow-sm">
						{def.name}
					</span>
				</div>

				{/* Recipe selector */}
				{recipes.length > 0 && (
					<div className="nodrag nopan shrink-0 px-2 pt-1">
						<Select
							value={data.recipeId ?? "__none__"}
							onValueChange={onRecipeChange}
						>
							<SelectTrigger className="nodrag h-6 w-full text-[10px]">
								<SelectValue placeholder="Select Recipe" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">No recipe</SelectItem>
								{recipes.map((r) => (
									<SelectItem key={r.id} value={r.id}>
										{r.name}{r.isAlternate ? " (Alt)" : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Clock speed + somersloops — single row */}
				{hasAdvanced && (
					<div className="nodrag nopan shrink-0 px-2 pt-1 space-y-0.5">
						<div className="flex items-center gap-1">
							{def.canOverclock && (
								<>
									<span className="text-[9px] text-white/50 shrink-0">Clock:</span>
									<Input
										type="number"
										min={1}
										max={250}
										value={data.overclockPercent}
										onChange={onOverclockInputChange}
										onBlur={onInputBlur}
										className="nodrag !h-5 w-10 min-w-0 !px-1 !text-[9px] text-center"
									/>
									<span className="text-[9px] text-white/50">%</span>
								</>
							)}
							{def.somersloopSlots > 0 && (
								<>
									<span style={{ color: "#e879f9" }} className="text-[9px] leading-none ml-1">&#x25C6;</span>
									<Input
										type="number"
										min={0}
										max={def.somersloopSlots}
										value={data.somersloops}
										onChange={onSomersloopsChange}
										onBlur={onInputBlur}
										className="nodrag !h-5 w-7 min-w-0 !px-0.5 !text-[9px] text-center"
									/>
									<span className="text-[9px] text-white/50">/{def.somersloopSlots}</span>
								</>
							)}
						</div>
						{/* Slider only when node is large enough in both dimensions */}
						{def.canOverclock && Math.min(pxWidth, pxHeight) >= 130 && (
							<Slider
								min={1}
								max={250}
								step={1}
								value={[data.overclockPercent]}
								onValueChange={onOverclockChange}
								className="nodrag"
							/>
						)}
					</div>
				)}
			</BaseNode>

			{/* Delete button */}
			{selected && (
				<button
					type="button"
					onClick={onDelete}
					className="nodrag nopan absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition"
				>
					<Trash2 size={10} />
				</button>
			)}

			{handles}
		</div>
	);
}

export default memo(BuildingNodeComponent);

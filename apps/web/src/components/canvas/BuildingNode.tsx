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
	const fontSize = Math.max(8, Math.min(pxWidth * 0.12, pxHeight * 0.2, 14));
	const hasPanel = recipes.length > 0 || def.canOverclock;

	// Status styling
	const statusStyle = nodeAnalysis ? STATUS_COLORS[nodeAnalysis.status] : undefined;

	// Port rate map: recipe-based for production, sourceRate-based for sources
	const portRateMap = useMemo(() => {
		if (!def) return {};
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

	const onDelete = useCallback(() => {
		deleteElements({ nodes: [{ id }] });
	}, [id, deleteElements]);

	// Apply recipe to all selected buildings of the same type
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

	// Apply overclock to all selected buildings that support it
	const onOverclockChange = useCallback(
		(values: number[]) => {
			const v = values[0];
			if (v === undefined) return;
			pushSnapshot();
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
		[pushSnapshot, setOverclock],
	);

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

	const onSourceRateBlur = useCallback(() => {
		pushSnapshot();
	}, [pushSnapshot]);

	const handles = useMemo(() => {
		if (!def) return null;

		// Clip-path triangles pointing outward per side
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
				? { left: `${effectiveOffset * 100}%` }
				: { top: `${effectiveOffset * 100}%` };

			const colorClass = port.type === "conveyor"
				? isInput
					? "!border-orange-500 !bg-orange-500/20"
					: "!border-none !bg-orange-500"
				: isInput
					? "!border-cyan-500 !bg-cyan-500/20 !rounded-sm"
					: "!border-none !bg-cyan-500";

			// Output handles: triangle shape, no border-radius
			if (!isInput) {
				Object.assign(offsetStyle, {
					clipPath: outputClip[effectiveSide],
				});
			}

			// Rate label position: inside the node near the handle
			const rate = portRateMap[port.id];
			const labelStyle: React.CSSProperties = { position: "absolute", fontSize: 8 };
			if (effectiveSide === "left") {
				labelStyle.left = 10;
				labelStyle.top = `${effectiveOffset * 100}%`;
				labelStyle.transform = "translateY(-50%)";
			} else if (effectiveSide === "right") {
				labelStyle.right = 10;
				labelStyle.top = `${effectiveOffset * 100}%`;
				labelStyle.transform = "translateY(-50%)";
			} else if (effectiveSide === "top") {
				labelStyle.left = `${effectiveOffset * 100}%`;
				labelStyle.top = 10;
				labelStyle.transform = "translateX(-50%)";
			} else {
				labelStyle.left = `${effectiveOffset * 100}%`;
				labelStyle.bottom = 10;
				labelStyle.transform = "translateX(-50%)";
			}

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
					{rate !== undefined && (
						<div
							className="pointer-events-none select-none font-medium text-white/80"
							style={labelStyle}
						>
							{rate}
						</div>
					)}
				</Fragment>
			);
		});
	}, [def, data.rotation, portRateMap]);

	// --- Source nodes ---
	if (isSource) {
		const sourceItem = data.sourceItemId ? getItem(data.sourceItemId) : null;
		const sourceRate = data.sourceRate ?? 0;
		const sourceFontSize = Math.max(6, Math.min(fontSize - 2, 10));

		// Filter items based on source type
		const availableItems = useMemo(() => {
			if (data.buildingId === "resource-node") {
				return ITEMS.filter((i) => i.category === "solid");
			}
			if (data.buildingId === "resource-well") {
				return ITEMS.filter((i) => i.category === "fluid");
			}
			return ITEMS; // infinite-source gets all
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
							style={{ fontSize: Math.max(6, sourceFontSize - 2) }}
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

				{/* Source config panel */}
				{selected && isFocused && !dragging && (
					<div
						className="nodrag nopan absolute z-20 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 shadow-xl text-popover-foreground space-y-1.5"
						style={{ top: pxHeight + 4, minWidth: 180 }}
					>
						<Select
							value={data.sourceItemId ?? "__none__"}
							onValueChange={onSourceItemChange}
						>
							<SelectTrigger className="h-6 w-full text-[10px]">
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
							<input
								type="number"
								min={0}
								step={1}
								value={sourceRate || ""}
								onChange={onSourceRateChange}
								onBlur={onSourceRateBlur}
								placeholder="0"
								className="nodrag h-6 w-full rounded border border-border bg-background px-2 text-[10px] text-foreground outline-none focus:border-ring"
							/>
							<span className="shrink-0 text-[10px] text-muted-foreground">/min</span>
						</div>
						{def.canOverclock && (
							<div className="space-y-0.5">
								<span className="text-[9px] text-muted-foreground">
									Overclock: {data.overclockPercent}%
								</span>
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

	const rateFontSize = Math.max(6, Math.min(fontSize - 3, 9));

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
				{/* Name */}
				<div
					className="w-full shrink-0 px-1 py-0.5 text-center"
					style={{ backgroundColor: `${def.color}55` }}
				>
					<span
						style={{ fontSize }}
						className="leading-tight select-none font-semibold text-white drop-shadow-sm"
					>
						{def.name}
					</span>
				</div>
				{/* Recipe name */}
				<div className="flex-1 flex items-center justify-center px-1">
					{currentRecipe ? (
						<span
							style={{ fontSize: rateFontSize }}
							className="text-center text-white/60 select-none leading-tight"
						>
							{currentRecipe.name}
						</span>
					) : recipes.length > 0 ? (
						<span
							style={{ fontSize: rateFontSize }}
							className="text-center text-white/40 select-none"
						>
							No recipe
						</span>
					) : null}
				</div>
			</BaseNode>

			{/* Delete button on selection */}
			{selected && (
				<button
					type="button"
					onClick={onDelete}
					className="nodrag nopan absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition"
				>
					<Trash2 size={10} />
				</button>
			)}

			{/* Selection panel: recipe + overclock (only on focused node, hidden while dragging) */}
			{selected && isFocused && !dragging && hasPanel && (
				<div
					className="nodrag nopan absolute z-20 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 shadow-xl text-popover-foreground space-y-1.5"
					style={{ top: pxHeight + 4, minWidth: Math.max(pxWidth, 160) }}
				>
					{recipes.length > 0 && (
						<Select
							value={data.recipeId ?? "__none__"}
							onValueChange={onRecipeChange}
						>
							<SelectTrigger className="h-6 w-full text-[10px]">
								<SelectValue placeholder="No recipe" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">No recipe</SelectItem>
								{recipes.map((r) => (
									<SelectItem key={r.id} value={r.id}>
										{r.name}
										{r.isAlternate ? " (Alt)" : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					{def.canOverclock && (
						<div className="space-y-0.5">
							<span className="text-[9px] text-muted-foreground">
								Overclock: {data.overclockPercent}%
							</span>
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

export default memo(BuildingNodeComponent);

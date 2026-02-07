"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ITEMS,
	CONVEYOR_TIERS,
	PIPE_TIERS,
	getItem,
	isRawResource,
} from "@/data";
import { solveProductionTree } from "@/lib/productionSolver";
import { layoutProductionTree } from "@/lib/productionLayout";
import { commitProductionTree } from "@/lib/productionGenerator";
import type { ProductionTreeConfig, ProductionTree } from "@/lib/productionTypes";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@SatisFactoryPlaner/ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@SatisFactoryPlaner/ui/components/select";
import { Button } from "@SatisFactoryPlaner/ui/components/button";
import { Input } from "@SatisFactoryPlaner/ui/components/input";
import {
	Command,
	CommandInput,
	CommandList,
	CommandGroup,
	CommandItem,
	CommandEmpty,
} from "@SatisFactoryPlaner/ui/components/command";
import { RecipeTreeView } from "./RecipeTreeView";

interface ProductionPlannerDialogProps {
	open: boolean;
	onClose: () => void;
	/** Viewport center in world coords (meters) to place the tree */
	viewportCenter: { x: number; y: number };
}

// Items that can be produced (have at least one recipe)
const PRODUCIBLE_ITEMS = ITEMS.filter((i) => !isRawResource(i.id));

const ITEM_GROUPS: { label: string; items: typeof PRODUCIBLE_ITEMS }[] = (() => {
	const groups = new Map<string, typeof PRODUCIBLE_ITEMS>();
	for (const item of PRODUCIBLE_ITEMS) {
		const cat = item.category === "fluid" ? "Fluids" : "Solids";
		const list = groups.get(cat) ?? [];
		list.push(item);
		groups.set(cat, list);
	}
	return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
})();

type Step = "item" | "settings" | "recipes" | "summary";

export function ProductionPlannerDialog({
	open,
	onClose,
	viewportCenter,
}: ProductionPlannerDialogProps) {
	const [step, setStep] = useState<Step>("item");
	const [targetItemId, setTargetItemId] = useState<string>("");
	const [targetRate, setTargetRate] = useState(30);
	const [conveyorTierId, setConveyorTierId] = useState("mk5");
	const [pipeTierId, setPipeTierId] = useState("mk2");
	const [mergeIntermediates, setMergeIntermediates] = useState(true);
	const [useLogistics, setUseLogistics] = useState(true);
	const [recipeOverrides, setRecipeOverrides] = useState<Map<string, string>>(
		new Map(),
	);

	const config: ProductionTreeConfig | null = useMemo(() => {
		if (!targetItemId) return null;
		return {
			targetItemId,
			targetRate,
			conveyorTierId,
			pipeTierId,
			mergeIntermediates,
			recipeOverrides,
		};
	}, [targetItemId, targetRate, conveyorTierId, pipeTierId, mergeIntermediates, recipeOverrides]);

	const solvedTree: ProductionTree | null = useMemo(() => {
		if (!config) return null;
		return solveProductionTree(config);
	}, [config]);

	const handleItemSelect = useCallback((itemId: string) => {
		setTargetItemId(itemId);
		setRecipeOverrides(new Map());
		setStep("settings");
	}, []);

	const handleRecipeChange = useCallback(
		(itemId: string, recipeId: string) => {
			setRecipeOverrides((prev) => {
				const next = new Map(prev);
				next.set(itemId, recipeId);
				return next;
			});
		},
		[],
	);

	const handleGenerate = useCallback(() => {
		if (!solvedTree) return;
		const layout = layoutProductionTree(solvedTree);
		// Center the tree on the viewport
		const ox = viewportCenter.x - layout.bounds.width / 2;
		const oy = viewportCenter.y - layout.bounds.height / 2;
		commitProductionTree(solvedTree, layout, ox, oy, useLogistics);
		onClose();
	}, [solvedTree, viewportCenter, onClose, useLogistics]);

	const handleClose = useCallback(() => {
		setStep("item");
		setTargetItemId("");
		setTargetRate(30);
		setRecipeOverrides(new Map());
		onClose();
	}, [onClose]);

	const targetItem = targetItemId ? getItem(targetItemId) : null;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
			<DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>
						{step === "item" && "Production Planner"}
						{step === "settings" && `Produce: ${targetItem?.name ?? ""}`}
						{step === "recipes" && "Recipe Selection"}
						{step === "summary" && "Summary"}
					</DialogTitle>
					<DialogDescription>
						{step === "item" && "Select the item you want to produce"}
						{step === "settings" && "Configure production rate and belt tier"}
						{step === "recipes" && "Review and customize recipes for each step"}
						{step === "summary" && "Review the production chain before generating"}
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto min-h-0">
					{/* Step 1: Item selection */}
					{step === "item" && (
						<Command className="rounded-lg border border-border">
							<CommandInput placeholder="Search items..." autoFocus />
							<CommandList className="max-h-[350px]">
								<CommandEmpty>No items found.</CommandEmpty>
								{ITEM_GROUPS.map((group) => (
									<CommandGroup key={group.label} heading={group.label}>
										{group.items.map((item) => (
											<CommandItem
												key={item.id}
												value={item.name}
												onSelect={() => handleItemSelect(item.id)}
												className="cursor-pointer"
											>
												<span className="truncate">{item.name}</span>
											</CommandItem>
										))}
									</CommandGroup>
								))}
							</CommandList>
						</Command>
					)}

					{/* Step 2: Settings */}
					{step === "settings" && (
						<div className="space-y-4 py-2">
							{/* Target rate */}
							<div className="space-y-1.5">
								<label className="text-sm text-white/70">Target Rate (items/min)</label>
								<div className="flex items-center gap-2">
									<Input
										type="number"
										min={1}
										value={targetRate}
										onChange={(e) =>
											setTargetRate(Math.max(1, Number(e.target.value) || 1))
										}
										className="w-24"
									/>
									<div className="flex gap-1">
										{[10, 30, 60, 120].map((r) => (
											<Button
												key={r}
												variant={targetRate === r ? "default" : "outline"}
												size="sm"
												onClick={() => setTargetRate(r)}
												className="text-xs"
											>
												{r}
											</Button>
										))}
									</div>
								</div>
							</div>

							{/* Belt tier */}
							<div className="space-y-1.5">
								<label className="text-sm text-white/70">Conveyor Belt Tier</label>
								<Select value={conveyorTierId} onValueChange={setConveyorTierId}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CONVEYOR_TIERS.map((t) => (
											<SelectItem key={t.id} value={t.id}>
												{t.name} ({t.throughput}/min)
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Pipe tier */}
							<div className="space-y-1.5">
								<label className="text-sm text-white/70">Pipeline Tier</label>
								<Select value={pipeTierId} onValueChange={setPipeTierId}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{PIPE_TIERS.map((t) => (
											<SelectItem key={t.id} value={t.id}>
												{t.name} ({t.throughput} m³/min)
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Merge toggle */}
							<div className="flex items-center gap-3">
								<label className="text-sm text-white/70">Shared intermediates</label>
								<div className="flex gap-1">
									<Button
										variant={mergeIntermediates ? "default" : "outline"}
										size="sm"
										onClick={() => setMergeIntermediates(true)}
										className="text-xs"
									>
										Merge
									</Button>
									<Button
										variant={!mergeIntermediates ? "default" : "outline"}
										size="sm"
										onClick={() => setMergeIntermediates(false)}
										className="text-xs"
									>
										Separate
									</Button>
								</div>
							</div>

							{/* Logistics toggle */}
							<div className="flex items-center gap-3">
								<label className="text-sm text-white/70">Routing</label>
								<div className="flex gap-1">
									<Button
										variant={useLogistics ? "default" : "outline"}
										size="sm"
										onClick={() => setUseLogistics(true)}
										className="text-xs"
									>
										Splitters/Mergers
									</Button>
									<Button
										variant={!useLogistics ? "default" : "outline"}
										size="sm"
										onClick={() => setUseLogistics(false)}
										className="text-xs"
									>
										Direct
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Recipe selection */}
					{step === "recipes" && solvedTree && (
						<RecipeTreeView
							tree={solvedTree}
							onRecipeChange={handleRecipeChange}
						/>
					)}

					{/* Step 4: Summary */}
					{step === "summary" && solvedTree && (
						<div className="space-y-3 py-2">
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="rounded-lg border border-border p-3">
									<div className="text-white/50 text-xs">Total Machines</div>
									<div className="text-xl font-bold">{solvedTree.totalMachines}</div>
								</div>
								<div className="rounded-lg border border-border p-3">
									<div className="text-white/50 text-xs">Total Power</div>
									<div className="text-xl font-bold">{Math.round(solvedTree.totalPower)} MW</div>
								</div>
							</div>

							{/* Raw resources */}
							<div>
								<div className="text-sm text-white/50 mb-1">Raw Resources Required</div>
								<div className="space-y-1">
									{Array.from(solvedTree.rawResources.entries()).map(
										([itemId, rate]) => {
											const item = getItem(itemId);
											return (
												<div
													key={itemId}
													className="flex items-center justify-between text-sm px-2 py-1 rounded bg-white/5"
												>
													<span>{item?.name ?? itemId}</span>
													<span className="text-white/50">
														{Math.round(rate * 10) / 10}/min
													</span>
												</div>
											);
										},
									)}
								</div>
							</div>

							{/* Warnings */}
							{solvedTree.warnings.length > 0 && (
								<div>
									<div className="text-sm text-yellow-400/70 mb-1">Warnings</div>
									{solvedTree.warnings.map((w, i) => (
										<div key={i} className="text-xs text-yellow-400/50 px-2">
											{w}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Navigation footer */}
				{step !== "item" && (
					<DialogFooter className="flex justify-between gap-2">
						<Button
							variant="outline"
							onClick={() => {
								if (step === "settings") setStep("item");
								else if (step === "recipes") setStep("settings");
								else if (step === "summary") setStep("recipes");
							}}
						>
							Back
						</Button>
						<div className="flex gap-2">
							{step === "settings" && (
								<Button onClick={() => setStep("recipes")}>
									Next: Recipes
								</Button>
							)}
							{step === "recipes" && (
								<Button onClick={() => setStep("summary")}>
									Next: Summary
								</Button>
							)}
							{step === "summary" && (
								<Button onClick={handleGenerate}>
									Generate
								</Button>
							)}
						</div>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}

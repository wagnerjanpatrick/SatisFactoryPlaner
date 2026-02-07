"use client";

import { getItem, getRecipesProducingItem, getRecipe, getBuildingDef } from "@/data";
import type { ProductionTree, ProductionNode } from "@/lib/productionTypes";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@SatisFactoryPlaner/ui/components/select";

interface RecipeTreeViewProps {
	tree: ProductionTree;
	onRecipeChange: (itemId: string, recipeId: string) => void;
}

export function RecipeTreeView({ tree, onRecipeChange }: RecipeTreeViewProps) {
	const root = tree.nodes.get(tree.rootNodeId);
	if (!root) return null;

	return (
		<div className="space-y-0.5 text-sm max-h-[400px] overflow-y-auto">
			<TreeNode node={root} tree={tree} depth={0} onRecipeChange={onRecipeChange} />
		</div>
	);
}

function TreeNode({
	node,
	tree,
	depth,
	onRecipeChange,
}: {
	node: ProductionNode;
	tree: ProductionTree;
	depth: number;
	onRecipeChange: (itemId: string, recipeId: string) => void;
}) {
	const item = getItem(node.itemId);
	const recipe = node.recipeId ? getRecipe(node.recipeId) : undefined;
	const building = node.buildingId ? getBuildingDef(node.buildingId) : undefined;
	const availableRecipes = getRecipesProducingItem(node.itemId);
	const hasAlternates = availableRecipes.length > 1;

	const rateDisplay = Math.round(node.requiredRate * 10) / 10;

	return (
		<div>
			<div
				className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5"
				style={{ paddingLeft: `${depth * 20 + 8}px` }}
			>
				{/* Depth indicator */}
				{depth > 0 && (
					<span className="text-white/20 text-xs">{"└"}</span>
				)}

				{/* Color dot */}
				<span
					className="inline-block h-2 w-2 rounded-full shrink-0"
					style={{ backgroundColor: building?.color ?? (node.type === "source" ? "#22c55e" : "#888") }}
				/>

				{/* Item name */}
				<span className="text-white/90 font-medium truncate">
					{item?.name ?? node.itemId}
				</span>

				{/* Rate */}
				<span className="text-white/40 text-xs shrink-0">
					{rateDisplay}/min
				</span>

				{/* Machine count */}
				{node.type === "production" && (
					<span className="text-white/30 text-xs shrink-0">
						x{node.machineCount}
					</span>
				)}

				{/* Recipe selector (only if alternates exist) */}
				{node.type === "production" && hasAlternates && (
					<Select
						value={node.recipeId ?? ""}
						onValueChange={(v) => onRecipeChange(node.itemId, v)}
					>
						<SelectTrigger className="h-5 w-auto min-w-[100px] max-w-[160px] text-[10px] ml-auto">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{availableRecipes.map((r) => (
								<SelectItem key={r.id} value={r.id}>
									{r.name}{r.isAlternate ? " (Alt)" : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				{/* Recipe name (if no alternates) */}
				{node.type === "production" && !hasAlternates && recipe && (
					<span className="text-white/25 text-[10px] ml-auto truncate">
						{recipe.name}
					</span>
				)}

				{/* Source label */}
				{node.type === "source" && (
					<span className="text-green-400/50 text-[10px] ml-auto">
						Raw Resource
					</span>
				)}
			</div>

			{/* Render child inputs */}
			{node.inputs.map((edge) => {
				const childNode = tree.nodes.get(edge.sourceNodeId);
				if (!childNode) return null;
				return (
					<TreeNode
						key={`${node.nodeId}-${edge.itemId}`}
						node={childNode}
						tree={tree}
						depth={depth + 1}
						onRecipeChange={onRecipeChange}
					/>
				);
			})}
		</div>
	);
}

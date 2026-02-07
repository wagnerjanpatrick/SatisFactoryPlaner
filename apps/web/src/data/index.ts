import { BUILDINGS } from "./buildings";
import { CONVEYOR_TIERS } from "./conveyor-tiers";
import { ITEMS } from "./items";
import { PIPE_TIERS } from "./pipe-tiers";
import { RECIPES } from "./recipes";
import type {
	BuildingCategory,
	BuildingDefinition,
	ConveyorTier,
	ItemDefinition,
	PipeTier,
	RecipeDefinition,
} from "./types";

export {
	BUILDINGS,
	CONVEYOR_TIERS,
	ITEMS,
	PIPE_TIERS,
	RECIPES,
};

export type {
	BuildingCategory,
	BuildingDefinition,
	ConveyorTier,
	ItemDefinition,
	PipeTier,
	RecipeDefinition,
};

const buildingMap = new Map<string, BuildingDefinition>(
	BUILDINGS.map((b) => [b.id, b]),
);
const itemMap = new Map<string, ItemDefinition>(
	ITEMS.map((i) => [i.id, i]),
);
const recipeMap = new Map<string, RecipeDefinition>(
	RECIPES.map((r) => [r.id, r]),
);
const conveyorTierMap = new Map<string, ConveyorTier>(
	CONVEYOR_TIERS.map((t) => [t.id, t]),
);
const pipeTierMap = new Map<string, PipeTier>(
	PIPE_TIERS.map((t) => [t.id, t]),
);

export function getBuildingDef(id: string): BuildingDefinition | undefined {
	return buildingMap.get(id);
}

export function getItem(id: string): ItemDefinition | undefined {
	return itemMap.get(id);
}

export function getRecipe(id: string): RecipeDefinition | undefined {
	return recipeMap.get(id);
}

export function getRecipesForBuilding(buildingId: string): RecipeDefinition[] {
	return RECIPES.filter((r) => r.buildingId === buildingId);
}

export function getConveyorTier(id: string): ConveyorTier | undefined {
	return conveyorTierMap.get(id);
}

export function getPipeTier(id: string): PipeTier | undefined {
	return pipeTierMap.get(id);
}

export function getBuildingsByCategory(
	category: BuildingCategory,
): BuildingDefinition[] {
	return BUILDINGS.filter((b) => b.category === category);
}

/** First non-alternate recipe that produces the given item */
export function getDefaultRecipeForItem(
	itemId: string,
): RecipeDefinition | undefined {
	return RECIPES.find(
		(r) => !r.isAlternate && r.outputs.some((o) => o.itemId === itemId),
	);
}

/** All recipes (including alternates) that produce the given item */
export function getRecipesProducingItem(itemId: string): RecipeDefinition[] {
	return RECIPES.filter((r) => r.outputs.some((o) => o.itemId === itemId));
}

/** True if no recipe produces this item (it's a raw ore/fluid) */
export function isRawResource(itemId: string): boolean {
	return !RECIPES.some((r) => r.outputs.some((o) => o.itemId === itemId));
}

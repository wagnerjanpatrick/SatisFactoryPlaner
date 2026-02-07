/** A node in the solved production tree */
export interface ProductionNode {
	/** Unique ID within the tree (not a store instanceId) */
	nodeId: string;
	type: "production" | "source";
	/** The primary item this node produces */
	itemId: string;
	/** Required output rate (items/min) */
	requiredRate: number;
	/** Recipe used (production nodes only) */
	recipeId?: string;
	/** Building type (production nodes only) */
	buildingId?: string;
	/** Number of parallel machines needed */
	machineCount: number;
	/** Overclock percent for each machine (length === machineCount) */
	overclockPerMachine: number[];
	/** Actual output rate (sum of all machines' production) */
	actualRate: number;
	/** Tree depth (0 = target, increases toward raw resources) */
	depth: number;
	/** Input edges — what this node consumes */
	inputs: ProductionEdge[];
}

/** A connection between two production nodes */
export interface ProductionEdge {
	itemId: string;
	/** Required throughput (items/min) */
	rate: number;
	/** The node that supplies this item */
	sourceNodeId: string;
	connectionType: "conveyor" | "pipe";
	/** How many parallel belts/pipes needed for the throughput */
	parallelLines: number;
	/** Belt/pipe tier to use */
	tier: string;
}

/** User configuration for the production planner */
export interface ProductionTreeConfig {
	targetItemId: string;
	targetRate: number;
	conveyorTierId: string;
	pipeTierId: string;
	mergeIntermediates: boolean;
	/** itemId -> recipeId overrides (user-selected alternates) */
	recipeOverrides: Map<string, string>;
}

/** The output of the solver */
export interface ProductionTree {
	nodes: Map<string, ProductionNode>;
	rootNodeId: string;
	totalPower: number;
	totalMachines: number;
	/** All raw resource requirements: itemId -> rate */
	rawResources: Map<string, number>;
	/** Warnings (cycles, missing recipes, etc.) */
	warnings: string[];
}

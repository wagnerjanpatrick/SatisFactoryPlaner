import type { PlacedBuilding, Connection } from "@/store/types";
import type { BuildingNode, ConnectionEdge } from "@/store/flowTypes";
import { getBuildingDef } from "@/data";
import { getRotatedSize } from "./geometry";
import { PIXELS_PER_METER } from "./constants";

/**
 * Convert a PlacedBuilding (top-left position) to a React Flow node (center position).
 * nodeOrigin={[0.5, 0.5]} means React Flow treats node.position as the center.
 */
export function buildingToNode(building: PlacedBuilding): BuildingNode {
	const def = getBuildingDef(building.buildingId);
	const { width, length } = def
		? getRotatedSize(def, building.rotation)
		: { width: 0, length: 0 };

	return {
		id: building.instanceId,
		type: "building",
		position: {
			x: (building.x + width / 2) * PIXELS_PER_METER,
			y: (building.y + length / 2) * PIXELS_PER_METER,
		},
		data: {
			buildingId: building.buildingId,
			rotation: building.rotation,
			recipeId: building.recipeId,
			overclockPercent: building.overclockPercent,
			somersloops: building.somersloops,
			label: building.label,
			sourceItemId: building.sourceItemId,
			sourceRate: building.sourceRate,
		},
	};
}

/**
 * Convert a React Flow node (center position) back to a PlacedBuilding (top-left position).
 */
export function nodeToBuilding(node: BuildingNode): PlacedBuilding {
	const def = getBuildingDef(node.data.buildingId);
	const { width, length } = def
		? getRotatedSize(def, node.data.rotation)
		: { width: 0, length: 0 };

	return {
		instanceId: node.id,
		buildingId: node.data.buildingId,
		x: node.position.x / PIXELS_PER_METER - width / 2,
		y: node.position.y / PIXELS_PER_METER - length / 2,
		rotation: node.data.rotation,
		recipeId: node.data.recipeId,
		overclockPercent: node.data.overclockPercent,
		somersloops: node.data.somersloops,
		label: node.data.label,
		sourceItemId: node.data.sourceItemId,
		sourceRate: node.data.sourceRate,
	};
}

export function connectionToEdge(conn: Connection): ConnectionEdge {
	return {
		id: conn.id,
		source: conn.sourceInstanceId,
		sourceHandle: conn.sourcePortId,
		target: conn.targetInstanceId,
		targetHandle: conn.targetPortId,
		type: conn.type,
		data: {
			tier: conn.tier,
			waypoints: conn.waypoints,
			connectionType: conn.type,
		},
	};
}

export function edgeToConnection(edge: ConnectionEdge): Connection {
	return {
		id: edge.id,
		sourceInstanceId: edge.source,
		sourcePortId: edge.sourceHandle!,
		targetInstanceId: edge.target,
		targetPortId: edge.targetHandle!,
		type: edge.data!.connectionType,
		tier: edge.data!.tier,
		waypoints: edge.data!.waypoints,
	};
}

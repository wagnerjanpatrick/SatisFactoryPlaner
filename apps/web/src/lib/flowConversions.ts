import type { PlacedBuilding, Connection } from "@/store/types";
import type { BuildingNode, ConnectionEdge } from "@/store/flowTypes";
import { getBuildingDef } from "@/data";
import { getRotatedSize } from "./geometry";
import { PIXELS_PER_METER } from "./constants";

/**
 * Convert a PlacedBuilding (top-left in meters) to a React Flow node (top-left in pixels).
 * nodeOrigin defaults to [0, 0] so position IS the top-left corner.
 */
export function buildingToNode(building: PlacedBuilding): BuildingNode {
	const def = getBuildingDef(building.buildingId);
	const { width, length } = def
		? getRotatedSize(def, building.rotation)
		: { width: 0, length: 0 };

	const pxWidth = width * PIXELS_PER_METER;
	const pxHeight = length * PIXELS_PER_METER;

	return {
		id: building.instanceId,
		type: "building",
		position: {
			x: building.x * PIXELS_PER_METER,
			y: building.y * PIXELS_PER_METER,
		},
		width: pxWidth,
		height: pxHeight,
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
 * Convert a React Flow node (top-left in pixels) back to a PlacedBuilding (top-left in meters).
 */
export function nodeToBuilding(node: BuildingNode): PlacedBuilding {
	return {
		instanceId: node.id,
		buildingId: node.data.buildingId,
		x: node.position.x / PIXELS_PER_METER,
		y: node.position.y / PIXELS_PER_METER,
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

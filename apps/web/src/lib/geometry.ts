import type { BuildingDefinition, PortDefinition } from "@/data/types";
import type { PlacedBuilding } from "@/store/types";
import { PIXELS_PER_METER } from "./constants";

export interface WorldPort {
	id: string;
	type: "conveyor" | "pipe";
	direction: "input" | "output";
	side: "top" | "right" | "bottom" | "left";
	x: number;
	y: number;
}

export function snapToGrid(value: number, gridSize: number): number {
	return Math.round(value / gridSize) * gridSize;
}

export function getRotatedSize(
	def: BuildingDefinition,
	rotation: 0 | 90 | 180 | 270,
): { width: number; length: number } {
	if (rotation === 90 || rotation === 270) {
		return { width: def.length, length: def.width };
	}
	return { width: def.width, length: def.length };
}

export function getPortWorldPosition(
	port: PortDefinition,
	building: PlacedBuilding,
	def: BuildingDefinition,
): { x: number; y: number } {
	const { width, length } = getRotatedSize(def, building.rotation);

	let localX: number;
	let localY: number;

	switch (port.side) {
		case "left":
			localX = 0;
			localY = port.offset * def.length;
			break;
		case "right":
			localX = def.width;
			localY = port.offset * def.length;
			break;
		case "top":
			localX = port.offset * def.width;
			localY = 0;
			break;
		case "bottom":
			localX = port.offset * def.width;
			localY = def.length;
			break;
	}

	let rotatedX: number;
	let rotatedY: number;

	switch (building.rotation) {
		case 0:
			rotatedX = localX;
			rotatedY = localY;
			break;
		case 90:
			rotatedX = def.length - localY;
			rotatedY = localX;
			break;
		case 180:
			rotatedX = def.width - localX;
			rotatedY = def.length - localY;
			break;
		case 270:
			rotatedX = localY;
			rotatedY = def.width - localX;
			break;
	}

	return {
		x: building.x + rotatedX,
		y: building.y + rotatedY,
	};
}

const SIDE_ROTATION_MAP: Record<number, Record<string, "top" | "right" | "bottom" | "left">> = {
	0:   { left: "left", right: "right", top: "top", bottom: "bottom" },
	90:  { left: "top", top: "right", right: "bottom", bottom: "left" },
	180: { left: "right", right: "left", top: "bottom", bottom: "top" },
	270: { left: "bottom", bottom: "right", right: "top", top: "left" },
};

export function getEffectiveSide(
	side: "top" | "right" | "bottom" | "left",
	rotation: 0 | 90 | 180 | 270,
): "top" | "right" | "bottom" | "left" {
	return SIDE_ROTATION_MAP[rotation]![side]!;
}

export function getWorldPorts(
	building: PlacedBuilding,
	def: BuildingDefinition,
): WorldPort[] {
	return def.ports.map((port) => {
		const pos = getPortWorldPosition(port, building, def);
		return {
			id: port.id,
			type: port.type,
			direction: port.direction,
			side: getEffectiveSide(port.side, building.rotation),
			x: pos.x,
			y: pos.y,
		};
	});
}

export function worldToCanvas(x: number, y: number): { x: number; y: number } {
	return {
		x: x * PIXELS_PER_METER,
		y: y * PIXELS_PER_METER,
	};
}

export function canvasToWorld(x: number, y: number): { x: number; y: number } {
	return {
		x: x / PIXELS_PER_METER,
		y: y / PIXELS_PER_METER,
	};
}

export function getBuildingAABB(
	building: PlacedBuilding,
	def: BuildingDefinition,
): { minX: number; minY: number; maxX: number; maxY: number } {
	const { width, length } = getRotatedSize(def, building.rotation);
	return {
		minX: building.x,
		minY: building.y,
		maxX: building.x + width,
		maxY: building.y + length,
	};
}

export function aabbOverlap(
	a: { minX: number; minY: number; maxX: number; maxY: number },
	b: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
	return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

/**
 * Compute the effective offset (0-1) along the rotated edge for a port.
 * This determines the CSS top/left percentage for React Flow Handle positioning.
 */
export function getEffectiveOffset(
	port: PortDefinition,
	def: BuildingDefinition,
	rotation: 0 | 90 | 180 | 270,
): number {
	// Compute local position on unrotated building
	let localX: number;
	let localY: number;

	switch (port.side) {
		case "left":
			localX = 0;
			localY = port.offset * def.length;
			break;
		case "right":
			localX = def.width;
			localY = port.offset * def.length;
			break;
		case "top":
			localX = port.offset * def.width;
			localY = 0;
			break;
		case "bottom":
			localX = port.offset * def.width;
			localY = def.length;
			break;
	}

	// Rotate the position
	let rotatedX: number;
	let rotatedY: number;

	switch (rotation) {
		case 0:
			rotatedX = localX;
			rotatedY = localY;
			break;
		case 90:
			rotatedX = def.length - localY;
			rotatedY = localX;
			break;
		case 180:
			rotatedX = def.width - localX;
			rotatedY = def.length - localY;
			break;
		case 270:
			rotatedX = localY;
			rotatedY = def.width - localX;
			break;
	}

	const { width, length } = getRotatedSize(def, rotation);
	const effectiveSide = getEffectiveSide(port.side, rotation);

	// Compute offset fraction along the effective edge
	switch (effectiveSide) {
		case "left":
		case "right":
			return rotatedY / length;
		case "top":
		case "bottom":
			return rotatedX / width;
	}
}

import type { BuildingDefinition } from "@/data/types";
import type { PlacedBuilding } from "@/store/types";
import { getBuildingDef } from "@/data";
import { getBuildingAABB } from "./geometry";
import { BELT_PADDING } from "./constants";

export class OccupancyGrid {
	private grid: Uint8Array;
	private width: number;
	private height: number;
	private offsetX: number;
	private offsetY: number;

	constructor(bounds: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	}) {
		this.offsetX = Math.floor(bounds.minX) - BELT_PADDING;
		this.offsetY = Math.floor(bounds.minY) - BELT_PADDING;
		this.width =
			Math.ceil(bounds.maxX) - this.offsetX + BELT_PADDING * 2;
		this.height =
			Math.ceil(bounds.maxY) - this.offsetY + BELT_PADDING * 2;
		this.grid = new Uint8Array(this.width * this.height);
	}

	private toIndex(worldX: number, worldY: number): number {
		const gx = Math.floor(worldX) - this.offsetX;
		const gy = Math.floor(worldY) - this.offsetY;
		if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) {
			return -1;
		}
		return gy * this.width + gx;
	}

	markRect(
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
		padding = 0,
	): void {
		const startX = Math.floor(minX - padding) - this.offsetX;
		const startY = Math.floor(minY - padding) - this.offsetY;
		const endX = Math.ceil(maxX + padding) - this.offsetX;
		const endY = Math.ceil(maxY + padding) - this.offsetY;

		for (let y = Math.max(0, startY); y < Math.min(this.height, endY); y++) {
			for (
				let x = Math.max(0, startX);
				x < Math.min(this.width, endX);
				x++
			) {
				this.grid[y * this.width + x] = 1;
			}
		}
	}

	markBuilding(building: PlacedBuilding, def: BuildingDefinition): void {
		const aabb = getBuildingAABB(building, def);
		this.markRect(aabb.minX, aabb.minY, aabb.maxX, aabb.maxY, BELT_PADDING);
	}

	isWalkable(worldX: number, worldY: number): boolean {
		const idx = this.toIndex(worldX, worldY);
		if (idx < 0) return false;
		return this.grid[idx] === 0;
	}

	getWidth(): number {
		return this.width;
	}

	getHeight(): number {
		return this.height;
	}

	getOffsetX(): number {
		return this.offsetX;
	}

	getOffsetY(): number {
		return this.offsetY;
	}

	isBlocked(gx: number, gy: number): boolean {
		if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) {
			return true;
		}
		return this.grid[gy * this.width + gx] === 1;
	}

	static fromBuildings(
		buildings: Record<string, PlacedBuilding>,
	): OccupancyGrid {
		const entries = Object.values(buildings);
		if (entries.length === 0) {
			return new OccupancyGrid({
				minX: -100,
				minY: -100,
				maxX: 100,
				maxY: 100,
			});
		}

		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		const buildingsWithDefs: Array<{
			building: PlacedBuilding;
			def: BuildingDefinition;
		}> = [];

		for (const building of entries) {
			const def = getBuildingDef(building.buildingId);
			if (!def) continue;
			const aabb = getBuildingAABB(building, def);
			minX = Math.min(minX, aabb.minX);
			minY = Math.min(minY, aabb.minY);
			maxX = Math.max(maxX, aabb.maxX);
			maxY = Math.max(maxY, aabb.maxY);
			buildingsWithDefs.push({ building, def });
		}

		const padding = 20;
		const grid = new OccupancyGrid({
			minX: minX - padding,
			minY: minY - padding,
			maxX: maxX + padding,
			maxY: maxY + padding,
		});

		for (const { building, def } of buildingsWithDefs) {
			grid.markBuilding(building, def);
		}

		return grid;
	}
}

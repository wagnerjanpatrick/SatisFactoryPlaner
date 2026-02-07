import type { PlacedBuilding } from "@/store/types";
import type { BuildingDefinition } from "@/data/types";
import { getBuildingDef } from "@/data";
import { getWorldPorts, type WorldPort } from "./geometry";
import { AUTO_CONNECT_RANGE } from "./constants";

export interface ProposedConnection {
	sourceInstanceId: string;
	sourcePortId: string;
	targetInstanceId: string;
	targetPortId: string;
	type: "conveyor" | "pipe";
	distance: number;
}

/**
 * Given a newly placed building, finds compatible nearby ports and proposes connections.
 * Rules:
 * - Only connect output -> input of same type (conveyor/pipe)
 * - Within AUTO_CONNECT_RANGE meters
 * - Each port can only be proposed once (closest match wins)
 */
export function findAutoConnections(
	newBuilding: PlacedBuilding,
	allBuildings: Record<string, PlacedBuilding>,
	existingConnections: Set<string>,
): ProposedConnection[] {
	const newDef = getBuildingDef(newBuilding.buildingId);
	if (!newDef) return [];

	const newPorts = getWorldPorts(newBuilding, newDef);
	const proposals: ProposedConnection[] = [];
	const usedPorts = new Set<string>();

	// Collect all nearby building ports
	const nearbyPorts: {
		port: WorldPort;
		instanceId: string;
	}[] = [];

	for (const other of Object.values(allBuildings)) {
		if (other.instanceId === newBuilding.instanceId) continue;

		const otherDef = getBuildingDef(other.buildingId);
		if (!otherDef) continue;

		const otherPorts = getWorldPorts(other, otherDef);
		for (const port of otherPorts) {
			nearbyPorts.push({ port, instanceId: other.instanceId });
		}
	}

	// For each port on the new building, find the best match
	for (const newPort of newPorts) {
		const portKey = `${newBuilding.instanceId}:${newPort.id}`;
		if (existingConnections.has(portKey) || usedPorts.has(portKey)) continue;

		let bestMatch: ProposedConnection | null = null;
		let bestDistance = AUTO_CONNECT_RANGE;

		for (const { port: otherPort, instanceId: otherInstanceId } of nearbyPorts) {
			// Must be same type but opposite direction
			if (otherPort.type !== newPort.type) continue;
			if (otherPort.direction === newPort.direction) continue;

			const otherPortKey = `${otherInstanceId}:${otherPort.id}`;
			if (existingConnections.has(otherPortKey) || usedPorts.has(otherPortKey)) continue;

			const dx = newPort.x - otherPort.x;
			const dy = newPort.y - otherPort.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < bestDistance) {
				bestDistance = distance;

				// Determine source (output) and target (input)
				const isNewOutput = newPort.direction === "output";
				bestMatch = {
					sourceInstanceId: isNewOutput ? newBuilding.instanceId : otherInstanceId,
					sourcePortId: isNewOutput ? newPort.id : otherPort.id,
					targetInstanceId: isNewOutput ? otherInstanceId : newBuilding.instanceId,
					targetPortId: isNewOutput ? otherPort.id : newPort.id,
					type: newPort.type,
					distance,
				};
			}
		}

		if (bestMatch) {
			usedPorts.add(portKey);
			usedPorts.add(
				`${bestMatch.sourceInstanceId === newBuilding.instanceId ? bestMatch.targetInstanceId : bestMatch.sourceInstanceId}:${bestMatch.sourceInstanceId === newBuilding.instanceId ? bestMatch.targetPortId : bestMatch.sourcePortId}`,
			);
			proposals.push(bestMatch);
		}
	}

	return proposals.sort((a, b) => a.distance - b.distance);
}

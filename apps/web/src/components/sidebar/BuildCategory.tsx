"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { BuildingDefinition } from "@/data/types";
import { BuildingCard } from "./BuildingCard";

interface BuildCategoryProps {
	name: string;
	buildings: BuildingDefinition[];
}

export function BuildCategory({ name, buildings }: BuildCategoryProps) {
	const [isOpen, setIsOpen] = useState(true);

	if (buildings.length === 0) return null;

	return (
		<div>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200"
			>
				{isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
				{name}
				<span className="ml-auto text-zinc-600">{buildings.length}</span>
			</button>
			{isOpen && (
				<div className="flex flex-col gap-0.5 px-2 pb-2">
					{buildings.map((b) => (
						<BuildingCard key={b.id} building={b} />
					))}
				</div>
			)}
		</div>
	);
}

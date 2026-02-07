"use client";

import { useMemo } from "react";
import { BUILDINGS } from "@/data";
import type { BuildingCategory as CategoryType } from "@/data/types";
import { useUIStore } from "@/store/uiStore";
import { SearchInput } from "./SearchInput";
import { BuildCategory } from "./BuildCategory";

const CATEGORIES: { id: CategoryType; label: string }[] = [
	{ id: "source", label: "Source" },
	{ id: "production", label: "Production" },
	{ id: "logistics", label: "Logistics" },
	{ id: "power", label: "Power" },
	{ id: "storage", label: "Storage" },
	{ id: "transport", label: "Transport" },
	{ id: "special", label: "Special" },
];

export function BuildMenu() {
	const searchQuery = useUIStore((s) => s.searchQuery);

	const filtered = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return BUILDINGS;
		return BUILDINGS.filter((b) => b.name.toLowerCase().includes(query));
	}, [searchQuery]);

	return (
		<div className="flex flex-col gap-1 p-2">
			<SearchInput />
			<div className="mt-1 flex flex-col gap-0.5">
				{CATEGORIES.map((cat) => (
					<BuildCategory
						key={cat.id}
						name={cat.label}
						buildings={filtered.filter((b) => b.category === cat.id)}
					/>
				))}
			</div>
		</div>
	);
}

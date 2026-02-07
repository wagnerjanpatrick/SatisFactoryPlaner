"use client";

import { Search } from "lucide-react";
import { Input } from "@SatisFactoryPlaner/ui/components/input";
import { useUIStore } from "@/store/uiStore";

export function SearchInput() {
	const searchQuery = useUIStore((s) => s.searchQuery);
	const setSearchQuery = useUIStore((s) => s.setSearchQuery);

	return (
		<div className="relative">
			<Search
				size={14}
				className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				placeholder="Search buildings..."
				className="pl-8 h-8 text-xs"
			/>
		</div>
	);
}

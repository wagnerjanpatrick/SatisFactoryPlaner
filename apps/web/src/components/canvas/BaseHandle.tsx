"use client";

import type { ComponentProps } from "react";
import { Handle, type HandleProps } from "@xyflow/react";
import { cn } from "@SatisFactoryPlaner/ui/lib/utils";

export type BaseHandleProps = HandleProps;

export function BaseHandle({
	className,
	children,
	...props
}: ComponentProps<typeof Handle>) {
	return (
		<Handle
			{...props}
			className={cn(
				"!h-3 !w-3 !rounded-full !border-2 !border-muted-foreground !bg-background transition",
				className,
			)}
		>
			{children}
		</Handle>
	);
}

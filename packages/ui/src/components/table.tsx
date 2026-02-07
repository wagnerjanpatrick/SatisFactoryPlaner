"use client";

import * as React from "react";

import { cn } from "../lib/utils";

const TableStyleContext = React.createContext<{
  noSeparators: boolean;
  noZebra: boolean;
}>({
  noSeparators: false,
  noZebra: false,
});

function Table({
  className,
  noSeparators,
  noZebra,
  children,
  ...props
}: {
  noSeparators?: boolean;
  noZebra?: boolean;
} & React.ComponentProps<"table">) {
  return (
    <TableStyleContext.Provider
      value={{ noSeparators: !!noSeparators, noZebra: !!noZebra }}
    >
      <div
        className="relative w-full overflow-x-auto"
        data-slot="table-container"
      >
        <table
          className={cn("w-full caption-bottom text-sm", className)}
          data-slot="table"
          {...props}
        >
          {children}
        </table>
      </div>
    </TableStyleContext.Provider>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  const { noSeparators, noZebra } = React.useContext(TableStyleContext);
  return (
    <thead
      className={cn(
        noSeparators ? undefined : "[&_tr]:border-b",
        noZebra ? undefined : "[&_tr:nth-child(even)]:bg-muted/30",
        className
      )}
      data-slot="table-header"
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const { noSeparators, noZebra } = React.useContext(TableStyleContext);
  return (
    <tbody
      className={cn(
        noSeparators ? undefined : "[&_tr:last-child]:border-0",
        noZebra ? undefined : "[&_tr:nth-child(even)]:bg-muted/30",
        className
      )}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  const { noSeparators, noZebra } = React.useContext(TableStyleContext);
  return (
    <tfoot
      className={cn(
        "bg-muted/50 font-medium [&>tr]:last:border-b-0",
        noSeparators ? undefined : "border-t",
        noZebra ? undefined : "[&_tr:nth-child(even)]:bg-muted/30",
        className
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  const { noSeparators, noZebra } = React.useContext(TableStyleContext);
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        noSeparators ? undefined : "border-b",
        noZebra ? undefined : "even:bg-muted/30",
        className
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn("mt-4 text-muted-foreground text-sm", className)}
      data-slot="table-caption"
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

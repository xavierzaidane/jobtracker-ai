"use client";

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { TriageEmail } from "@/types/application";

interface InboxGroupHeaderProps {
  title: string;
  count: number;
  accent?: string;
  emails: TriageEmail[];
  selectedIds: Set<string>;
  onToggleGroup: (emails: TriageEmail[], checked: boolean) => void;
}

export const InboxGroupHeader: React.FC<InboxGroupHeaderProps> = ({
  title,
  count,
  accent = "text-foreground",
  emails,
  selectedIds,
  onToggleGroup,
}) => {
  const isGroupAllSelected = emails.every((e) => selectedIds.has(e.id));
  const isGroupSomeSelected =
    emails.some((e) => selectedIds.has(e.id)) && !isGroupAllSelected;

  return (
    <TableRow className="bg-muted/10 hover:bg-muted/15 border-b border-border/40 select-none">
      <TableCell className="pl-5 pr-2 py-2">
        <Checkbox
          checked={
            isGroupAllSelected ? true : isGroupSomeSelected ? "indeterminate" : false
          }
          onCheckedChange={(checked) => onToggleGroup(emails, !!checked)}
          aria-label={`Select all ${title}`}
        />
      </TableCell>
      <TableCell colSpan={4} className="py-2 pr-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className={accent}>{title}</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              ({count})
            </span>
          </span>
          {/* Dotted/Dashed dividing line across table matching reference design */}
          <div className="flex-1 border-b border-dashed border-border/80 ml-2" />
        </div>
      </TableCell>
    </TableRow>
  );
};


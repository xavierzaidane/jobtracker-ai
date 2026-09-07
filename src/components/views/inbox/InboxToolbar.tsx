"use client";

import React from "react";
import { Sparkles, Search, X, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InboxToolbarProps {
  filter: "pending" | "approved";
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBatchApprove: () => void;
}

export const InboxToolbar: React.FC<InboxToolbarProps> = ({
  filter,
  totalCount,
  searchQuery,
  onSearchChange,
  selectedCount,
  onBatchApprove,
}) => {
  return (
    <div className="px-5 py-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-normal text-foreground tracking-tight">
            {filter === "pending" ? "AI Triage Inbox" : "Processed Applications"}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Total {totalCount} {totalCount === 1 ? "email" : "emails"}{" "}
          {filter === "pending" ? "awaiting review" : "triaged to board"}
        </p>
      </div>

      {/* Right Controls: Search & Batch Action */}
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search emails, company..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 text-xs pl-8 pr-7 bg-muted/30 dark:bg-muted/20 border-border"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


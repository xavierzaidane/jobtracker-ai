"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  SlidersHorizontal,
  Check,
  ArrowRight,
} from "lucide-react";
import { SenderAvatar } from "@/components/ui/sender-avatar";
import { ActiveView } from "@/types/application";
import { cn } from "@/lib/utils";
import { ActivityRowItem, getStatusBadgeConfig } from "./types";

interface RecentActivitiesTableProps {
  activities: ActivityRowItem[];
  onNavigateView?: (view: ActiveView) => void;
}

export const RecentActivitiesTable: React.FC<RecentActivitiesTableProps> = ({
  activities,
  onNavigateView,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Offers" | "Interviews" | "Replies" | "Applied"
  >("All");
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchesSearch =
        item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === "Offers") matchesFilter = item.statusStage === "offer";
      if (activeFilter === "Interviews") matchesFilter = item.statusStage === "interview";
      if (activeFilter === "Replies") matchesFilter = item.statusStage === "reply";
      if (activeFilter === "Applied") matchesFilter = item.statusStage === "applied";

      return matchesSearch && matchesFilter;
    });
  }, [activities, searchQuery, activeFilter]);

  const toggleRow = (id: string) => {
    setSelectedRowIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllRows = () => {
    if (filteredActivities.every((item) => selectedRowIds[item.id])) {
      setSelectedRowIds({});
    } else {
      const allSelected: Record<string, boolean> = {};
      filteredActivities.forEach((item) => {
        allSelected[item.id] = true;
      });
      setSelectedRowIds(allSelected);
    }
  };

  return (
    <Card className="rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground space-y-4">
      {/* Header with Title and Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-normal tracking-tight text-foreground">
            Recent Activity
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time feed of applications and recruiter messages
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity..."
              className="h-8 pl-8 text-xs rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium rounded-xl border-border bg-background hover:bg-secondary text-foreground gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{activeFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-xl bg-popover text-popover-foreground border-border text-xs"
            >
              <DropdownMenuLabel>Filter by stage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["All", "Offers", "Interviews", "Replies", "Applied"] as const).map(
                (filterOption) => (
                  <DropdownMenuItem
                    key={filterOption}
                    onClick={() => setActiveFilter(filterOption)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{filterOption}</span>
                    {activeFilter === filterOption && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-8 py-2.5 px-2">
              <input
                type="checkbox"
                checked={
                  filteredActivities.length > 0 &&
                  filteredActivities.every((item) => selectedRowIds[item.id])
                }
                onChange={toggleAllRows}
                className="rounded-xs border-border accent-primary cursor-pointer"
              />
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3">
              ID
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3">
              Activity
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3">
              Source
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3">
              Date
            </TableHead>
            <TableHead className="w-8 py-2.5 px-2 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredActivities.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground text-xs"
              >
                {searchQuery || activeFilter !== "All"
                  ? "No activities found matching criteria."
                  : "No application activity recorded yet. Tracked applications and recruiter updates will appear here."}
              </TableCell>
            </TableRow>
          ) : (
            filteredActivities.slice(0, 5).map((row) => {
              const isSelected = !!selectedRowIds[row.id];
              const statusBadge = getStatusBadgeConfig(row.statusStage);

              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors border-border hover:bg-muted/50 cursor-pointer",
                    isSelected && "bg-muted/30"
                  )}
                >
                  {/* Checkbox */}
                  <TableCell className="py-3 px-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(row.id)}
                      className="rounded-xs border-border accent-primary cursor-pointer"
                    />
                  </TableCell>

                  {/* ID */}
                  <TableCell className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                    {row.displayId}
                  </TableCell>

                  {/* Activity with SenderAvatar */}
                  <TableCell className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <SenderAvatar
                        sender={row.sender}
                        company={row.company}
                        size="sm"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-normal text-foreground text-xs leading-tight truncate">
                          {row.company}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-tight truncate">
                          {row.role}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Source */}
                  <TableCell className="py-3 px-3 text-xs text-muted-foreground truncate max-w-[120px]">
                    {row.source}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border shrink-0 shadow-2xs">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          statusBadge.dotBg
                        )}
                      />
                      <span>{statusBadge.label}</span>
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="py-3 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                    {row.date}
                  </TableCell>

                  {/* Action Link to Board/Inbox */}
                  <TableCell className="py-3 px-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (row.origin === "inbox") {
                          onNavigateView?.("inbox");
                        } else {
                          onNavigateView?.("board");
                        }
                      }}
                      className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground"
                      title={
                        row.origin === "inbox"
                          ? "View in Inbox"
                          : "View on Board"
                      }
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

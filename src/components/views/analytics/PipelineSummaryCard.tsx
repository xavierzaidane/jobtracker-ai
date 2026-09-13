"use client";

import React, { useState } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  Zap,
  Inbox,
  MoreVertical,
} from "lucide-react";
import { ActiveView } from "@/types/application";

interface PipelineSummaryCardProps {
  total: number;
  onQuickApply?: () => void;
  onNavigateView?: (view: ActiveView) => void;
}

export const PipelineSummaryCard: React.FC<PipelineSummaryCardProps> = ({
  total,
  onQuickApply,
  onNavigateView,
}) => {
  const [selectedChannel, setSelectedChannel] = useState("all");

  return (
    <Card className="md:col-span-1 xl:col-span-4 rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground flex flex-col justify-between space-y-5">
      <div>
        {/* Header with shadcn Select */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-normal">
            Total Applications
          </span>
          <Select
            value={selectedChannel}
            onValueChange={setSelectedChannel}
          >
            <SelectTrigger className="w-[125px] h-8 text-xs rounded-full border-border bg-secondary text-secondary-foreground font-medium">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Large Value & Trend */}
        <div className="mt-3">
          <div className="text-5xl font-normal tracking-tight text-foreground">
            {total}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Total tracked
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            onClick={onQuickApply}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-normal h-10 rounded-full flex items-center justify-center gap-1.5 shadow-xs transition-all text-xs sm:text-sm active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Quick Apply</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigateView?.("inbox")}
            className="bg-muted hover:bg-muted/80 text-secondary-foreground font-medium h-10 rounded-full flex items-center justify-center gap-1.5 border border-border transition-all text-xs sm:text-sm active:scale-[0.98]"
          >
            <Inbox className="w-4 h-4" />
            <span>Triage Inbox</span>
          </Button>
        </div>
      </div>

      {/* Application Channels Mini Cards */}
      <div className="pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground font-medium mb-2.5">
          Channels <span className="text-border mx-1">|</span> Total 3 active
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Channel 1 */}
          <div className="rounded-2xl border border-border p-2.5 bg-card hover:bg-muted/50 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium text-foreground truncate">
                LinkedIn
              </span>
              <MoreVertical className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-normal text-foreground leading-tight">
                24 Applied
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                50% of volume
              </div>
            </div>
            <div className="mt-2 text-[10px] font-normal text-primary">
              Active
            </div>
          </div>

          {/* Channel 2 */}
          <div className="rounded-2xl border border-border p-2.5 bg-card hover:bg-muted/50 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium text-foreground truncate">
                Referrals
              </span>
              <MoreVertical className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-normal text-foreground leading-tight">
                16 Applied
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                33% of volume
              </div>
            </div>
            <div className="mt-2 text-[10px] font-normal text-primary">
              Active
            </div>
          </div>

          {/* Channel 3 */}
          <div className="rounded-2xl border border-border p-2.5 bg-card hover:bg-muted/50 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium text-foreground truncate">
                Direct ATS
              </span>
              <MoreVertical className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-normal text-foreground leading-tight">
                8 Applied
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                17% of volume
              </div>
            </div>
            <div className="mt-2 text-[10px] font-normal text-muted-foreground">
              Active
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};


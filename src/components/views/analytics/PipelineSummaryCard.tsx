"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Inbox, MoreVertical } from "lucide-react";
import { ActiveView, JobApplication } from "@/types/application";

interface PipelineSummaryCardProps {
  total: number;
  applications?: JobApplication[];
  onQuickApply?: () => void;
  onNavigateView?: (view: ActiveView) => void;
}

export const PipelineSummaryCard: React.FC<PipelineSummaryCardProps> = ({
  total,
  applications = [],
  onQuickApply,
  onNavigateView,
}) => {
  const [selectedChannel, setSelectedChannel] = useState("all");

  const channelStats = useMemo(() => {
    const totalApps = applications.length;
    let atsCount = 0;
    let linkedinCount = 0;
    let referralCount = 0;

    applications.forEach((app) => {
      if (app.ats_source) {
        atsCount++;
      } else if (app.summary?.toLowerCase().includes("referral") || app.role?.toLowerCase().includes("referral")) {
        referralCount++;
      } else {
        linkedinCount++;
      }
    });

    const calcPct = (count: number) => (totalApps > 0 ? Math.round((count / totalApps) * 100) : 0);

    return [
      {
        name: "LinkedIn",
        count: linkedinCount,
        pct: calcPct(linkedinCount),
        active: linkedinCount > 0,
      },
      {
        name: "Referrals",
        count: referralCount,
        pct: calcPct(referralCount),
        active: referralCount > 0,
      },
      {
        name: "Direct ATS",
        count: atsCount,
        pct: calcPct(atsCount),
        active: atsCount > 0,
      },
    ];
  }, [applications]);

  const activeChannelsCount = channelStats.filter((c) => c.active).length;

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
          Channels <span className="text-border mx-1">|</span> Total {activeChannelsCount} active
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {channelStats.map((chan) => (
            <div
              key={chan.name}
              className="rounded-2xl border border-border p-2.5 bg-card hover:bg-muted/50 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium text-foreground truncate">
                  {chan.name}
                </span>
                <MoreVertical className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" />
              </div>
              <div className="mt-2">
                <div className="text-xs font-normal text-foreground leading-tight">
                  {chan.count} Applied
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                  {chan.pct}% of volume
                </div>
              </div>
              <div className={"mt-2 text-[10px] font-normal " + (chan.active ? "text-primary" : "text-muted-foreground")}>
                {chan.active ? "Active" : "Inactive"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

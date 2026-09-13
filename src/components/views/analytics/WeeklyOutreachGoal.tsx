"use client";

import React from "react";
import { Card } from "@/components/ui/card";

interface WeeklyOutreachGoalProps {
  submittedThisWeek: number;
  weeklyTarget: number;
}

export const WeeklyOutreachGoal: React.FC<WeeklyOutreachGoalProps> = ({
  submittedThisWeek,
  weeklyTarget,
}) => {
  const percentage = Math.min(
    100,
    Math.round((submittedThisWeek / (weeklyTarget || 1)) * 100)
  );

  return (
    <Card className="rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-normal tracking-tight text-foreground">
          Weekly Outreach Goal
        </h2>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
          {percentage}% on track
        </span>
      </div>

      {/* Progress Bar with Diagonal Striped Backfill */}
      <div className="relative h-4 rounded-full border border-border overflow-hidden flex bg-muted p-0.5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
        <div
          className="h-full flex-1"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              var(--border),
              var(--border) 3px,
              transparent 3px,
              transparent 7px
            )`,
          }}
        />
      </div>

      {/* Goal Labels */}
      <div className="flex items-center justify-between text-xs font-normal text-foreground pt-0.5">
        <span>{submittedThisWeek} submitted this week</span>
        <span>{weeklyTarget} weekly target</span>
      </div>
    </Card>
  );
};


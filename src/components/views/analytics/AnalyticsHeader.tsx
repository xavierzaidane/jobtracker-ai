"use client";

import React, { useMemo } from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveView } from "@/types/application";

interface AnalyticsHeaderProps {
  totalApplications: number;
  pendingInboxCount: number;
  onNavigateView?: (view: ActiveView) => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  totalApplications,
  pendingInboxCount,
  onNavigateView,
}) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning, Xavier";
    if (hour < 18) return "Good afternoon, Xavier";
    return "Good evening, Xavier";
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Stay on top of your tasks, monitor progress, and track status.
        </p>
      </div>

      {/* Quick Status Pill */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>{totalApplications} Applications Active</span>
        </span>
      </div>
    </div>
  );
};


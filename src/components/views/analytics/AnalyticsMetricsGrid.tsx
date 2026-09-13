"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Calendar,
  Mail,
  Clock,
} from "lucide-react";
import { AnalyticsMetrics } from "./types";

interface AnalyticsMetricsGridProps {
  metrics: AnalyticsMetrics;
}

export const AnalyticsMetricsGrid: React.FC<AnalyticsMetricsGridProps> = ({
  metrics,
}) => {
  return (
    <div className="md:col-span-1 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {/* Tile 1: Primary Brand Color Highlight Card */}
      <Card className="rounded-2xl p-5 shadow-xs border border-primary/30 bg-primary text-primary-foreground flex flex-col justify-between min-h-[150px]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-normal text-primary-foreground/90">
            Active Offers
          </span>
          <div className="w-7 h-7 rounded-full bg-primary-foreground/20 backdrop-blur-xs flex items-center justify-center text-primary-foreground">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1">
          <div className="text-4xl font-normal tracking-tight text-primary-foreground">
            {metrics.offers} {metrics.offers === 1 ? "Offer" : "Offers"}
          </div>
        </div>

        <div>

        </div>
      </Card>

      {/* Tile 2: Total Spending / Interview Stage */}
      <Card className="rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground flex flex-col justify-between min-h-[150px]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-normal text-muted-foreground">
            Total Spending
          </span>
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-blue-500">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1">
          <div className="text-4xl font-normal tracking-tight text-foreground">
            ${metrics.interviews * 140}
          </div>
        </div>

        <div>
        </div>
      </Card>

      {/* Tile 3: Total Income / Recruiter Replies */}
      <Card className="rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground flex flex-col justify-between min-h-[150px]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-normal text-muted-foreground">
            Total Income
          </span>
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-amber-500">
            <Mail className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1">
          <div className="text-4xl font-normal tracking-tight text-foreground">
            $1,050
          </div>
        </div>

        <div>
        </div>
      </Card>

      {/* Tile 4: Total Revenue / Avg Response Days */}
      <Card className="rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground flex flex-col justify-between min-h-[150px]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-normal text-muted-foreground">
            Total Revenue
          </span>
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-primary">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1">
          <div className="text-4xl font-normal tracking-tight text-foreground">
            $850
          </div>
        </div>

        <div>
        </div>
      </Card>
    </div>
  );
};


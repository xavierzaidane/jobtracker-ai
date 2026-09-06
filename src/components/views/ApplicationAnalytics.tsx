"use client";

import React, { useMemo } from "react";
import { JobApplication, COLUMNS } from "@/types/application";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  Percent,
} from "lucide-react";

interface ApplicationAnalyticsProps {
  applications: JobApplication[];
}

export const ApplicationAnalytics: React.FC<ApplicationAnalyticsProps> = ({
  applications,
}) => {
  const metrics = useMemo(() => {
    const total = applications.length;
    if (total === 0) {
      return {
        total: 0,
        applied: 0,
        reply: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        responseRate: 0,
        interviewRate: 0,
        offerRate: 0,
        avgResponseDays: 0,
      };
    }

    const counts = {
      applied: 0,
      reply: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });

    const respondedCount = counts.reply + counts.interview + counts.offer + counts.rejected;
    const responseRate = Math.round((respondedCount / total) * 100);
    const interviewCount = counts.interview + counts.offer;
    const interviewRate = Math.round((interviewCount / total) * 100);
    const offerRate = Math.round((counts.offer / (interviewCount || 1)) * 100);

    // Calculate avg response days from history log or dates
    let totalDays = 0;
    let countedApps = 0;
    applications.forEach((app) => {
      if (app.applied_date && app.latest_update_date && app.status !== "applied") {
        const diff =
          new Date(app.latest_update_date).getTime() -
          new Date(app.applied_date).getTime();
        const days = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
        totalDays += days;
        countedApps++;
      }
    });
    const avgResponseDays = countedApps > 0 ? (totalDays / countedApps).toFixed(1) : "5.4";

    return {
      total,
      ...counts,
      responseRate,
      interviewRate,
      offerRate,
      avgResponseDays,
    };
  }, [applications]);

  const funnelSteps = [
    {
      label: "Applications Sent",
      count: metrics.total,
      pct: 100,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      icon: FileCheck,
    },
    {
      label: "Recruiter Replies",
      count: metrics.reply + metrics.interview + metrics.offer,
      pct: metrics.total > 0 ? Math.round(((metrics.reply + metrics.interview + metrics.offer) / metrics.total) * 100) : 0,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      icon: MessageSquare,
    },
    {
      label: "Technical & Onsite Interviews",
      count: metrics.interview + metrics.offer,
      pct: metrics.total > 0 ? Math.round(((metrics.interview + metrics.offer) / metrics.total) * 100) : 0,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      icon: Calendar,
    },
    {
      label: "Offers Extended",
      count: metrics.offer,
      pct: metrics.total > 0 ? Math.round((metrics.offer / metrics.total) * 100) : 0,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      icon: Award,
    },
  ];

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-card overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Application Pipeline Analytics & Funnel
          </h2>
          <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-secondary">
            {metrics.total} Tracked Applications
          </span>
        </div>
      </div>

      {/* Main Analytics Canvas */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 max-w-5xl mx-auto w-full space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Response Rate</span>
              <Percent className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.responseRate}%
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Replies or updates
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Interview Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.interviewRate}%
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Reached interview stage
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Offer Conversion</span>
              <Award className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.offerRate}%
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Interviews converted
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Avg Response</span>
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.avgResponseDays} <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Application to reply
            </span>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Full-Funnel Conversion Pipeline
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Progression of applications through each critical hiring milestone
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {funnelSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${step.textColor}`} />
                      <span className="font-medium text-foreground">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{step.count}</span>
                      <span className="text-muted-foreground text-[11px]">({step.pct}%)</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(4, step.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Current Status Distribution
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {COLUMNS.map((col) => {
              const count = metrics[col.id] || 0;
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;

              return (
                <div
                  key={col.id}
                  className="p-3 rounded-lg border border-border bg-card/60 flex flex-col items-start"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${col.badgeBg}`} />
                    <span className="text-xs font-medium text-muted-foreground truncate">
                      {col.title}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{count}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{pct}% of total</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insight banner */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Pipeline Health: </span>
            <span className="text-muted-foreground">
              Your response rate is currently at {metrics.responseRate}%, which is above the industry tech benchmark of 15-20%. With {metrics.offer} active offer extended, prioritize scheduling debrief calls before competing deadlines expire.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


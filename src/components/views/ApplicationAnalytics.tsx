"use client";

import React, { useMemo } from "react";
import {
  JobApplication,
  TriageEmail,
  ActiveView,
} from "@/types/application";
import {
  AnalyticsHeader,
  PipelineSummaryCard,
  AnalyticsMetricsGrid,
  IncomeBarChart,
  WeeklyOutreachGoal,
  TopTargetRoles,
  RecentActivitiesTable,
  ActivityRowItem,
  AnalyticsMetrics,
  TopProspects,
  getStatusBadgeConfig,
} from "./analytics";

export { getStatusBadgeConfig };

interface ApplicationAnalyticsProps {
  applications: JobApplication[];
  triageEmails?: TriageEmail[];
  onQuickApply?: () => void;
  onNavigateView?: (view: ActiveView) => void;
}

export const ApplicationAnalytics: React.FC<ApplicationAnalyticsProps> = ({
  applications,
  triageEmails = [],
  onQuickApply,
  onNavigateView,
}) => {
  // Compute live pipeline metrics dynamically from applications & inbox
  const metrics: AnalyticsMetrics = useMemo(() => {
    const total = applications.length;
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

    const respondedCount =
      counts.reply + counts.interview + counts.offer + counts.rejected;
    const responseRate =
      total > 0 ? Math.round((respondedCount / total) * 100) : 0;
    const interviewCount = counts.interview + counts.offer;
    const interviewRate =
      total > 0 ? Math.round((interviewCount / total) * 100) : 0;

    // Calculate response days
    let totalDays = 0;
    let countedApps = 0;
    applications.forEach((app) => {
      if (
        app.applied_date &&
        app.latest_update_date &&
        app.status !== "applied"
      ) {
        const diff =
          new Date(app.latest_update_date).getTime() -
          new Date(app.applied_date).getTime();
        const days = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
        totalDays += days;
        countedApps++;
      }
    });
    const avgResponseDays =
      countedApps > 0 ? (totalDays / countedApps).toFixed(1) : "0.0";

    // Weekly applications submitted (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recentSubmissions = applications.filter((app) => {
      const d = new Date(app.applied_date).getTime();
      return d >= sevenDaysAgo;
    }).length;
    const submittedThisWeek = recentSubmissions;
    const weeklyTarget = 5;

    const pendingInboxCount = triageEmails.filter((e) => !e.is_approved).length;

    return {
      total,
      rawTotal: total,
      offers: counts.offer,
      interviews: counts.interview,
      replies: counts.reply,
      applied: counts.applied,
      responseRate,
      interviewRate,
      avgResponseDays,
      submittedThisWeek,
      weeklyTarget,
      pendingInboxCount,
    };
  }, [applications, triageEmails]);

  // Aggregate dynamic items from both Board Applications and AI Triage Inbox
  const combinedActivities: ActivityRowItem[] = useMemo(() => {
    const items: ActivityRowItem[] = [];

    // Map Board Applications
    applications.forEach((app, idx) => {
      const assignedSource = app.ats_source
        ? app.ats_source.toUpperCase()
        : app.summary?.toLowerCase().includes("referral")
        ? "Referral"
        : "Direct Application";

      const avatarIcons: ActivityRowItem["avatarIcon"][] = [
        "zap",
        "compass",
        "send",
        "sparkles",
        "building",
        "briefcase",
      ];
      const avatarBgs = [
        "bg-primary text-primary-foreground",
        "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        "bg-secondary text-secondary-foreground border border-border",
      ];

      const dateVal =
        app.latest_update_date || app.applied_date || new Date().toISOString();

      items.push({
        id: `board-${app.id}`,
        displayId: `APP_${String(idx + 1).padStart(6, "0")}`,
        company: app.company,
        role: app.role,
        sender: app.sender,
        source: assignedSource,
        avatarBg: avatarBgs[idx % avatarBgs.length],
        avatarIcon: avatarIcons[idx % avatarIcons.length],
        statusStage: app.status,
        date: new Date(dateVal).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        rawDate: new Date(dateVal).getTime(),
        origin: "board",
      });
    });

    // Map Triage Inbox Emails
    triageEmails.forEach((email, idx) => {
      items.push({
        id: `inbox-${email.id}`,
        displayId: `TRG_${String(idx + 1).padStart(6, "0")}`,
        company: email.company,
        role: email.role,
        sender: email.sender,
        source: email.ats_source ? `${email.ats_source.toUpperCase()} (AI)` : "AI Triage Inbox",
        avatarBg: "bg-primary/10 text-primary border border-primary/20",
        avatarIcon: "send",
        statusStage: email.detected_status,
        date: new Date(email.date).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        rawDate: new Date(email.date).getTime(),
        origin: "inbox",
      });
    });

    return items.sort((a, b) => b.rawDate - a.rawDate);
  }, [applications, triageEmails]);

  // Top Target Cards (Dynamically derived from applications)
  const topProspects: TopProspects = useMemo(() => {
    const topInterview = applications.find((a) => a.status === "interview");
    const topOffer = applications.find((a) => a.status === "offer");

    return {
      card1: topInterview
        ? {
            company: topInterview.company,
            role: topInterview.role,
            stage: "Interview Stage",
            compRange: "Active",
          }
        : null,
      card2: topOffer
        ? {
            company: topOffer.company,
            role: topOffer.role,
            stage: "Offer Extended",
            compRange: "Review Compensation",
          }
        : null,
    };
  }, [applications]);

  // Dynamic monthly application volume for chart
  const monthlyChartData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6: {
      month: string;
      year: number;
      monthIndex: number;
      sent: number;
      interviews: number;
    }[] = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        sent: 0,
        interviews: 0,
      });
    }

    applications.forEach((app) => {
      const dateStr = app.applied_date || app.latest_update_date;
      if (!dateStr) return;
      const appDate = new Date(dateStr);
      if (isNaN(appDate.getTime())) return;

      const bucket = last6.find(
        (b) => b.monthIndex === appDate.getMonth() && b.year === appDate.getFullYear()
      );
      if (bucket) {
        bucket.sent++;
        if (app.status === "interview" || app.status === "offer") {
          bucket.interviews++;
        }
      }
    });

    return last6.map(({ month, sent, interviews }) => ({ month, sent, interviews }));
  }, [applications]);

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-background text-foreground font-sans overflow-y-auto custom-scroll transition-colors">
      <div className="p-6 md:p-8 max-w-8xl mx-auto w-full space-y-6">
        {/* Header Bar */}
        <AnalyticsHeader
          totalApplications={metrics.total}
          pendingInboxCount={metrics.pendingInboxCount}
          onNavigateView={onNavigateView}
        />

        {/* TOP ROW: 3 Responsive Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
          <PipelineSummaryCard
            total={metrics.total}
            applications={applications}
            onQuickApply={onQuickApply}
            onNavigateView={onNavigateView}
          />
          <AnalyticsMetricsGrid metrics={metrics} />
          <IncomeBarChart data={monthlyChartData} />
        </div>

        {/* BOTTOM ROW: 2 Responsive Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Outreach Goal + Top Target Roles */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            <WeeklyOutreachGoal
              submittedThisWeek={metrics.submittedThisWeek}
              weeklyTarget={metrics.weeklyTarget}
            />
            <TopTargetRoles
              topProspects={topProspects}
              onQuickApply={onQuickApply}
            />
          </div>

          {/* Right Column: Recent Activities Table */}
          <div className="lg:col-span-7 xl:col-span-8">
            <RecentActivitiesTable
              activities={combinedActivities}
              onNavigateView={onNavigateView}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

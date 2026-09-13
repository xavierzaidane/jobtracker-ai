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
      total > 0 ? Math.round((respondedCount / total) * 100) : 68;
    const interviewCount = counts.interview + counts.offer;
    const interviewRate =
      total > 0 ? Math.round((interviewCount / total) * 100) : 45;

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
      countedApps > 0 ? (totalDays / countedApps).toFixed(1) : "4.2";

    // Weekly applications submitted (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recentSubmissions = applications.filter((app) => {
      const d = new Date(app.applied_date).getTime();
      return d >= sevenDaysAgo;
    }).length;
    const submittedThisWeek = recentSubmissions > 0 ? recentSubmissions : 4;
    const weeklyTarget = 5;

    const pendingInboxCount = triageEmails.filter((e) => !e.is_approved).length;

    return {
      total: total > 0 ? total : 48,
      rawTotal: total,
      offers: counts.offer > 0 ? counts.offer : total > 0 ? counts.offer : 2,
      interviews:
        counts.interview > 0
          ? counts.interview
          : total > 0
          ? counts.interview
          : 5,
      replies: counts.reply > 0 ? counts.reply : total > 0 ? counts.reply : 8,
      applied:
        counts.applied > 0 ? counts.applied : total > 0 ? counts.applied : 33,
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
      const sources = ["LinkedIn", "Referral", "Direct ATS", "Company Portal"];
      const assignedSource = sources[idx % sources.length];
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
        displayId: `APP_${String(idx + 70).padStart(6, "0")}`,
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
        displayId: `TRG_${String(idx + 20).padStart(6, "0")}`,
        company: email.company,
        role: email.role,
        sender: email.sender,
        source: "AI Triage Inbox",
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

    // Fallback activities if none exist
    if (items.length === 0) {
      return [
        {
          id: "fb-1",
          displayId: "APP_000076",
          company: "Anthropic",
          role: "Research Engineer · Systems",
          sender: "recruiting@anthropic.com",
          source: "Referral",
          avatarBg: "bg-primary text-primary-foreground",
          avatarIcon: "zap",
          statusStage: "offer",
          date: "17 Apr, 2026 03:45 PM",
          rawDate: Date.now() - 3600000,
          origin: "board",
        },
        {
          id: "fb-2",
          displayId: "APP_000075",
          company: "OpenAI",
          role: "Fullstack Engineer · Platform",
          sender: "talent@openai.com",
          source: "Direct ATS",
          avatarBg:
            "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          avatarIcon: "compass",
          statusStage: "interview",
          date: "15 Apr, 2026 11:30 AM",
          rawDate: Date.now() - 7200000,
          origin: "board",
        },
        {
          id: "fb-3",
          displayId: "APP_000074",
          company: "Linear",
          role: "Senior Frontend Engineer",
          sender: "hiring@linear.app",
          source: "LinkedIn",
          avatarBg:
            "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20",
          avatarIcon: "send",
          statusStage: "offer",
          date: "15 Apr, 2026 12:00 PM",
          rawDate: Date.now() - 14400000,
          origin: "board",
        },
        {
          id: "fb-4",
          displayId: "APP_000073",
          company: "Vercel",
          role: "Infrastructure Engineer · Edge",
          sender: "recruiting@vercel.com",
          source: "LinkedIn",
          avatarBg:
            "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          avatarIcon: "sparkles",
          statusStage: "reply",
          date: "14 Apr, 2026 09:15 PM",
          rawDate: Date.now() - 28800000,
          origin: "board",
        },
        {
          id: "fb-5",
          displayId: "APP_000072",
          company: "Supabase",
          role: "Staff Backend Architect",
          sender: "careers@supabase.io",
          source: "Direct ATS",
          avatarBg:
            "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
          avatarIcon: "building",
          statusStage: "applied",
          date: "10 Apr, 2026 06:00 AM",
          rawDate: Date.now() - 86400000,
          origin: "board",
        },
      ];
    }

    return items.sort((a, b) => b.rawDate - a.rawDate);
  }, [applications, triageEmails]);

  // Top Target Cards (Dynamically derived from applications)
  const topProspects: TopProspects = useMemo(() => {
    const topInterview = applications.find(
      (a) => a.status === "interview"
    ) || {
      company: "Google",
      role: "Staff Software Engineer",
      status: "interview",
    };

    const topOffer = applications.find((a) => a.status === "offer") || {
      company: "Stripe",
      role: "Tech Lead · Payments",
      status: "offer",
    };

    return {
      card1: {
        company: topInterview.company,
        role: topInterview.role,
        stage: "System Design & Arch",
        compRange: "$280,000 - $320,000",
      },
      card2: {
        company: topOffer.company,
        role: topOffer.role,
        stage: "Final Offer Extended",
        compRange: "$265,000 - $295,000",
      },
    };
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
            onQuickApply={onQuickApply}
            onNavigateView={onNavigateView}
          />
          <AnalyticsMetricsGrid metrics={metrics} />
          <IncomeBarChart />
        </div>

        {/* BOTTOM ROW: 2 Responsive Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Spending Limit + My Cards */}
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

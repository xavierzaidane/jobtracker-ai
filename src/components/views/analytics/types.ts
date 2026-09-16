import { ApplicationStatus, TriageStatus } from "@/types/application";

export interface ActivityRowItem {
  id: string;
  displayId: string;
  company: string;
  role: string;
  sender?: string | null;
  source: string;
  avatarBg?: string;
  avatarIcon?: "zap" | "compass" | "send" | "sparkles" | "building" | "briefcase";
  statusStage: TriageStatus;
  date: string;
  rawDate: number;
  origin: "board" | "inbox";
}

export interface AnalyticsMetrics {
  total: number;
  rawTotal: number;
  offers: number;
  interviews: number;
  replies: number;
  applied: number;
  responseRate: number;
  interviewRate: number;
  avgResponseDays: string;
  submittedThisWeek: number;
  weeklyTarget: number;
  pendingInboxCount: number;
}

export interface TopProspectItem {
  company: string;
  role: string;
  stage: string;
  compRange: string;
}

export interface TopProspects {
  card1?: TopProspectItem | null;
  card2?: TopProspectItem | null;
}

export const getStatusBadgeConfig = (status: TriageStatus) => {
  switch (status) {
    case "offer":
      return {
        label: "Offer Received",
        dotBg: "bg-emerald-500",
      };
    case "interview":
      return {
        label: "Interview",
        dotBg: "bg-blue-500",
      };
    case "reply":
      return {
        label: "Recruiter Reply",
        dotBg: "bg-amber-500",
      };
    case "rejected":
      return {
        label: "Not Selected",
        dotBg: "bg-rose-500",
      };
    case "unparsed":
      return {
        label: "Unparsed Email",
        dotBg: "bg-zinc-500",
      };
    case "applied":
    default:
      return {
        label: "Applied",
        dotBg: "bg-purple-500",
      };
  }
};

import { ApplicationStatus, TriageStatus } from "@/types/application";

export const getCompanyColor = (companyName: string): string => {
  const colors = [
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  ];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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

export const getStatusBadgeClasses = (status: TriageStatus): string => {
  switch (status) {
    case "offer":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    case "interview":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25";
    case "reply":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
    case "rejected":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25";
    case "unparsed":
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25";
    default:
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25";
  }
};

export const formatRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

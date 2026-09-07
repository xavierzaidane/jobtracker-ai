"use client";

import React from "react";
import {
  RefreshCw,
  Plus,
  Share2,
  Download,
  Link,
  Sparkles,
} from "lucide-react";
import { ApplicationStatus, ActiveView } from "@/types/application";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LinearHeaderProps {
  activeView?: ActiveView;
  activeStatusFilter: ApplicationStatus | "all";
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAddModal: () => void;
  totalCount: number;
  onOpenAddWishlist?: () => void;
  isWishlistAdding?: boolean;
  onOpenAddEvent?: () => void;
  triageFilter?: "pending" | "approved";
  onTriageFilterChange?: (filter: "pending" | "approved") => void;
  pendingTriageCount?: number;
  approvedTriageCount?: number;
}

export const LinearHeader: React.FC<LinearHeaderProps> = ({
  activeView = "board",
  activeStatusFilter,
  onRefresh,
  isRefreshing,
  onOpenAddModal,
  totalCount,
  onOpenAddWishlist,
  isWishlistAdding = false,
  onOpenAddEvent,
  triageFilter = "pending",
  onTriageFilterChange,
  pendingTriageCount = 0,
  approvedTriageCount = 0,
}) => {
  const getBreadcrumbLabel = () => {
    if (activeView === "calendar") return "Interview Calendar";
    if (activeView === "backlog") return "Backlog & Wishlist";
    if (activeView === "analytics") return "Analytics & Funnel";
    if (activeView === "inbox") return "AI Triage Inbox";

    switch (activeStatusFilter) {
      case "applied":
        return "Applied";
      case "reply":
        return "Recruiter Reply";
      case "interview":
        return "Interview";
      case "offer":
        return "Offers";
      case "rejected":
        return "Not Selected";
      default:
        return "Board";
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      alert("Board link copied to clipboard!");
    }
  };

  return (
    <header className="h-[48px] px-3 sm:px-4 border-b border-border flex items-center justify-between shrink-0 bg-card select-none text-[13px]">
      {/* Left: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] min-w-0">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground shrink-0" />
        <span className="font-medium text-muted-foreground truncate hidden md:inline">Job Search 2026</span>
        <span className="text-border hidden md:inline">/</span>
        <span className="font-normal text-foreground truncate">{getBreadcrumbLabel()}</span>
      </div>

      {/* Right: Action Toolbar */}
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex text-[12px] h-7 px-2.5 font-medium text-foreground bg-background border-border"
            >
              <Share2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
              <Link className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Copy link</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => alert("Board snapshot saved!")}
              className="cursor-pointer gap-2"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Export snapshot</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-border mx-0.5 hidden sm:block"></div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
          title="Refresh Applications"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
        </Button>

        {/* View-Specific Primary Actions */}
        {activeView === "board" && (
          <Button
            size="sm"
            onClick={onOpenAddModal}
            className="h-7 text-[12px] px-3 font-semibold text-primary-foreground bg-primary hover:bg-primary/90 gap-1 active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Job</span>
          </Button>
        )}

        {activeView === "backlog" && (
          <Button
            size="sm"
            onClick={onOpenAddWishlist}
            variant={isWishlistAdding ? "secondary" : "default"}
            className="h-7 text-[12px] px-3 font-semibold gap-1 active:scale-95 shadow-xs"
          >
            <Plus className={`w-3.5 h-3.5 ${isWishlistAdding ? "rotate-45 transition-transform" : ""}`} />
            <span>{isWishlistAdding ? "Close Form" : "Save Opportunity"}</span>
          </Button>
        )}

        {activeView === "calendar" && (
          <Button
            size="sm"
            onClick={onOpenAddEvent}
            className="h-7 text-[12px] px-3 font-semibold text-primary-foreground bg-primary hover:bg-primary/90 gap-1 active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </Button>
        )}

        {activeView === "inbox" && (
          <div className="flex items-center gap-2">
            {/* Live Indicator */}
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Sparkles className="w-3 h-3" />
              <span>n8n Live</span>
            </span>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-0.5 bg-secondary p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => onTriageFilterChange?.("pending")}
                className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                  triageFilter === "pending"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending ({pendingTriageCount})
              </button>
              <button
                type="button"
                onClick={() => onTriageFilterChange?.("approved")}
                className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                  triageFilter === "approved"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Approved ({approvedTriageCount})
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};




"use client";

import React from "react";
import {
  RefreshCw,
  Plus,
  Share2,
  Download,
  Link,
} from "lucide-react";
import { ApplicationStatus, ActiveView, AppNotification } from "@/types/application";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
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
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
  onTestNotification?: () => void;
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
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onSelectNotification,
  onTestNotification,
}) => {
  const getBreadcrumbLabel = () => {
    if (activeView === "calendar") return "Interview Calendar";
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

        {/* Real-time Notification Center */}
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={onMarkNotificationAsRead || (() => {})}
          onMarkAllAsRead={onMarkAllNotificationsAsRead || (() => {})}
          onClearAll={onClearAllNotifications || (() => {})}
          onSelectNotification={onSelectNotification}
          onTestNotification={onTestNotification}
        />

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
            {/* Live Indicator with n8n logo */}
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border ">
              <img
                src="/n8n-color.png"
                alt="n8n"
                className="w-4 h-4 object-contain shrink-0"
              />
              <span>Live</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </span>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => onTriageFilterChange?.("pending")}
                className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                  triageFilter === "pending"
                    ? "bg-input dark:bg-card text-foreground shadow-2xs font-normal"
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
                    ? "bg-input dark:bg-card text-foreground shadow-2xs font-normal"
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




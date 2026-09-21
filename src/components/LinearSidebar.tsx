"use client";

import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import {
  Search,
  Inbox,
  CircleDot,
  CircleDashed,
  Kanban,
  ChevronRight,
  ChevronDown,
  Sprout,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ApplicationStatus, ActiveView } from "@/types/application";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { ModeToggle } from "@/components/mode-toggle";
import { getUserAvatarUrl } from "@/lib/utils";

interface LinearSidebarProps {
  activeView?: ActiveView;
  onSelectView?: (view: ActiveView) => void;
  activeStatusFilter: ApplicationStatus | "all";
  onSelectStatusFilter: (status: ApplicationStatus | "all") => void;
  statusCounts: Record<string, number>;
  totalCount: number;
  pendingTriageCount?: number;
  wishlistCount?: number;
  upcomingInterviewsCount?: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  isRealtimeConnected: boolean;
  isDemoMode: boolean;
  user?: User | null;
  onOpenAuthModal?: () => void;
  onOpenSettingsModal?: () => void;
  onSignOut?: () => void;
}

export const LinearSidebar: React.FC<LinearSidebarProps> = ({
  activeView = "board",
  onSelectView,
  activeStatusFilter,
  onSelectStatusFilter,
  statusCounts,
  totalCount,
  pendingTriageCount = 0,
  wishlistCount = 0,
  upcomingInterviewsCount = 0,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  isRealtimeConnected,
  isDemoMode,
  user = null,
  onOpenAuthModal,
  onOpenSettingsModal,
  onSignOut,
}) => {
  const [teamOpen, setTeamOpen] = useState(true);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? resolvedTheme === "dark" : false;

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  // Derive user profile display values matching reference
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email
      ? user.email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Liam Smith");
  const displayEmail = user?.email || (isDemoMode ? "smith@example.com" : "");
  const avatarUrl = getUserAvatarUrl(
    user?.email || (isDemoMode ? "smith@example.com" : null),
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  );

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 border-none bg-sidebar text-sidebar-foreground w-64">
      {/* Header: Brandby Switcher + Search */}
      <SidebarHeader className="p-3 pb-2 pt-5 gap-2 border-none">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 text-foreground font-medium text-md">
            <span className="truncate tracking-tight font-medium text-neutral-900 dark:text-neutral-100">
              CareerOps
            </span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative flex items-center w-full mt-1">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          <SidebarInput
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 w-full pl-8 pr-7 text-xs bg-neutral-100/90 dark:bg-neutral-800/80 border-none rounded-md placeholder:text-neutral-400 text-neutral-800 dark:text-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-300"
            placeholder="Search..."
          />
          <span className="absolute right-2 text-[10px] text-neutral-400 font-mono px-1 py-0.2 rounded bg-neutral-200/50 dark:bg-neutral-700/50 pointer-events-none">
            /
          </span>
        </div>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="custom-scroll px-2 py-0 flex flex-col gap-0.5">
        {/* Top Navigation: My issues */}
        <div className="flex flex-col gap-0.5 px-1 py-0.5">
          <button
            type="button"
            onClick={() => {
              onSelectView?.("board");
              onSelectStatusFilter("all");
            }}
            className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] transition-colors text-left ${
              activeView === "board" && activeStatusFilter === "all"
                ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CircleDot className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>My Board</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {totalCount}
            </span>
          </button>
        </div>

        {/* Section Heading: Teams */}
        <div className="px-3 pt-3 pb-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">
          Teams
        </div>

        {/* Collapsible Team: Workbench */}
        <div className="px-1 flex flex-col">
          <button
            type="button"
            onClick={() => setTeamOpen(!teamOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                Workbench
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-150 ${
                teamOpen ? "" : "-rotate-90"
              }`}
            />
          </button>

          {teamOpen && (
            <div className="ml-4 pl-3.5 border-l border-neutral-200 dark:border-neutral-800 my-1 flex flex-col gap-1.5">
              {/* Issues Group */}
              <div>
                <div className="flex items-center gap-2 px-1 py-1 text-neutral-700 dark:text-neutral-300">
                  <CircleDashed className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="text-[13px]">Issues</span>
                </div>
                <div className="ml-2.5 pl-2.5 border-l border-neutral-200 dark:border-neutral-800 my-0.5 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView?.("board");
                      onSelectStatusFilter("all");
                    }}
                    className={`w-full text-left px-2 py-1 rounded-md text-[13px] transition-colors ${
                      activeView === "board" && activeStatusFilter === "all"
                        ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900"
                    }`}
                  >
                    Board
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectView?.("calendar")}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[13px] transition-colors ${
                      activeView === "calendar"
                        ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900"
                    }`}
                  >
                    <span>Calendar</span>
                    {upcomingInterviewsCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                        {upcomingInterviewsCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Views */}
              <div
                onClick={() => onSelectView?.("analytics")}
                className={`flex items-center gap-2 px-1 py-1 rounded-md cursor-pointer transition-colors ${
                  activeView === "analytics"
                    ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                }`}
              >
                <Kanban className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="text-[13px]">Views</span>
              </div>
            </div>
          )}

          {/* Secondary Projects */}
          <div className="flex flex-col gap-0.5 mt-2">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-400 flex items-center justify-center text-[8px] text-white shadow-2xs">
                  🔮
                </div>
                <span className="text-[13px] text-neutral-700 dark:text-neutral-300 font-normal">
                  V1.0
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            </div>

            <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-amber-500/20 flex items-center justify-center text-[10px]">
                  🌋
                </div>
                <span className="text-[13px] text-neutral-700 dark:text-neutral-300 font-normal">
                  Landing Page
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            </div>
          </div>
        </div>
      </SidebarContent>

      {/* Footer: Official shadcn NavUser + Theme Switcher & Version */}
      <SidebarFooter className="p-2.5 pt-1.5 bg-sidebar border-none flex flex-col gap-1.5">
        <NavUser
          user={{
            name: displayName,
            email: displayEmail || "Guest User",
            avatar: avatarUrl,
            isAuthenticated: !!user,
          }}
          onOpenAuthModal={onOpenAuthModal}
          onOpenSettingsModal={onOpenSettingsModal}
          onSignOut={onSignOut}
        />

        {/* Bottom utility bar: shadcn ModeToggle + Version */}
        <div className="flex items-center justify-between px-1 pt-1.5 border-t border-neutral-200/50 dark:border-neutral-800/50">
          <div className="flex items-center gap-1.5">
            <ModeToggle />
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
              Theme
            </span>
          </div>

          <span className="text-[10px] text-neutral-400 font-sans tracking-tight">
            V1.00-20-002-03
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

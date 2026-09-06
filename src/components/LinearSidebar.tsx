"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Inbox,
  CircleDot,
  CircleDashed,
  RotateCcw,
  Folder,
  Kanban,
  ChevronRight,
  ChevronDown,
  Sprout,
  Sun,
  Moon,
  PanelRight,
  Check,
  Plus,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}) => {
  const [teamOpen, setTeamOpen] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState("Brandby");
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

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 border-none bg-sidebar text-sidebar-foreground w-64">
      {/* Header: Brandby Switcher + Toggle Button + Search */}
      <SidebarHeader className="p-3 pb-2 pt-5 gap-2 border-none ">
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-foreground font-medium text-[13.5px] hover:opacity-85 transition-opacity focus:outline-none">
                {/* Brandby logo: dark rounded square with lime geometric icon */}
                <div className="w-5.5 h-5.5 rounded-md bg-[#1c1d1f] flex items-center justify-center shrink-0 shadow-xs p-1">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="5" cy="5" r="1.2" fill="#D2FD29" />
                    <circle cx="11" cy="5" r="1.2" fill="#D2FD29" />
                    <circle cx="5" cy="11" r="1.2" fill="#D2FD29" />
                    <circle cx="11" cy="11" r="1.2" fill="#D2FD29" />
                    <line x1="2.5" y1="5" x2="13.5" y2="5" stroke="#D2FD29" strokeWidth="1.3" strokeLinecap="round" />
                    <line x1="2.5" y1="11" x2="13.5" y2="11" stroke="#D2FD29" strokeWidth="1.3" strokeLinecap="round" />
                    <line x1="5" y1="2.5" x2="5" y2="13.5" stroke="#D2FD29" strokeWidth="1.3" strokeLinecap="round" />
                    <line x1="11" y1="2.5" x2="11" y2="13.5" stroke="#D2FD29" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="truncate tracking-tight font-medium text-neutral-900 dark:text-neutral-100">
                  {activeWorkspace}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 font-normal" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Workspaces
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setActiveWorkspace("Brandby")}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#1c1d1f] flex items-center justify-center text-[9px] text-[#D2FD29] font-bold">
                    #
                  </div>
                  <span>Brandby</span>
                </div>
                {activeWorkspace === "Brandby" && <Check className="w-3.5 h-3.5 text-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveWorkspace("Trackly")}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">
                    🎯
                  </div>
                  <span>Trackly</span>
                </div>
                {activeWorkspace === "Trackly" && <Check className="w-3.5 h-3.5 text-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenAddModal} className="flex items-center gap-2 cursor-pointer">
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                <span>New Application</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Top-Right Toggle Button matching reference */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-6 h-6 rounded-md border border-neutral-200/90 dark:border-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs"
            title="Toggle Sidebar"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
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
        {/* Top Navigation: Inbox & My issues */}
        <div className="flex flex-col gap-0.5 px-1 py-0.5">
          <button
            type="button"
            onClick={() => onSelectView?.("inbox")}
            className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] transition-colors text-left ${
              activeView === "inbox"
                ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>Inbox</span>
            </div>
            {pendingTriageCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-semibold">
                {pendingTriageCount}
              </span>
            )}
          </button>
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
              <span>My issues</span>
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

        {/* Collapsible Team: MSP Launch */}
        <div className="px-1 flex flex-col">
          <button
            type="button"
            onClick={() => setTeamOpen(!teamOpen)}
            className="w-full flex items-center justify-between px-2 py-1 text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                MSP Launch
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
                  <button
                    type="button"
                    onClick={() => onSelectView?.("backlog")}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[13px] transition-colors ${
                      activeView === "backlog"
                        ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900"
                    }`}
                  >
                    <span>Backlog</span>
                    {wishlistCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Sprints Group */}
              <div>
                <div className="flex items-center gap-2 px-1 py-1 text-neutral-700 dark:text-neutral-300">
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="text-[13px]">Sprints</span>
                </div>
                <div className="ml-2.5 pl-2.5 border-l border-neutral-200 dark:border-neutral-800 my-0.5 flex flex-col gap-0.5">
                  <div
                    onClick={() => {
                      onSelectView?.("board");
                      onSelectStatusFilter("offer");
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[13px] cursor-pointer transition-colors ${
                      activeView === "board" && activeStatusFilter === "offer"
                        ? "bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900"
                    }`}
                  >
                    <span>Current</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                      {statusCounts.offer || 0}
                    </span>
                  </div>
                  <div
                    onClick={() => onSelectView?.("calendar")}
                    className="w-full text-left px-2 py-1 rounded-md text-[13px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 cursor-pointer transition-colors"
                  >
                    Upcoming
                  </div>
                  <div
                    onClick={() => {
                      onSelectView?.("board");
                      onSelectStatusFilter("rejected");
                    }}
                    className="w-full text-left px-2 py-1 rounded-md text-[13px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 cursor-pointer transition-colors"
                  >
                    Completed
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div
                onClick={() => onSelectView?.("backlog")}
                className="flex items-center gap-2 px-1 py-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-md cursor-pointer transition-colors"
              >
                <Folder className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="text-[13px]">Projects</span>
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

          {/* Secondary Teams / Projects */}
          <div className="flex flex-col gap-0.5 mt-2">
            {/* V1.0 */}
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

            {/* Landing Page */}
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

      {/* Footer matching reference */}
      <SidebarFooter className="p-3 pt-2 bg-sidebar border-none flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">

          {/* Theme switch capsule */}
          <div
            onClick={handleToggleTheme}
            className="h-6 rounded-full bg-neutral-200/80 dark:bg-neutral-800 p-0.5 flex items-center gap-0.5 cursor-pointer border border-neutral-300/40 dark:border-neutral-700"
            title="Toggle Light / Dark Mode"
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                !isDarkMode
                  ? "bg-white text-neutral-800 shadow-2xs"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Sun className="w-3 h-3" />
            </div>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                isDarkMode
                  ? "bg-neutral-700 text-white shadow-2xs"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <Moon className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Version tag */}
        <span className="text-[10px] text-neutral-400 font-sans tracking-tight">
          V1.00-20-002-03
        </span>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

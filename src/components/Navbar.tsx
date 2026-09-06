"use client";

import React from "react";
import { Plus, Search, Sparkles, Wifi, RefreshCw } from "lucide-react";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  isRealtimeConnected: boolean;
  isDemoMode: boolean;
  totalCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  isRealtimeConnected,
  isDemoMode,
  totalCount,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md px-6 lg:px-10 py-4">
      <div className="max-w-7px mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
                  Job Applications
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {totalCount} Total
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Add Button */}
          <button
            onClick={onOpenAddModal}
            className="md:hidden p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs transition active:scale-95"
            title="Add Application"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Search, Indicators & Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search input */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, role, sender..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Live Status Badge */}
          {isDemoMode ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 border border-amber-200/80 text-amber-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Mode</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200/80 text-emerald-700">
              <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"}`} />
              <span>{isRealtimeConnected ? "Realtime Live" : "Supabase Connected"}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

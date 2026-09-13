"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  ExternalLink,
  Laptop,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SenderAvatar } from "@/components/ui/sender-avatar";
import { AppNotification, ApplicationStatus } from "@/types/application";
import {
  requestDesktopNotificationPermission,
  getDesktopNotificationPermission,
} from "@/lib/desktopNotification";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
  onTestNotification?: () => void;
}

const STATUS_BADGES: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string }
> = {
  offer: {
    label: "Offer",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  interview: {
    label: "Interview",
    bg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  reply: {
    label: "Reply",
    bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  applied: {
    label: "Applied",
    bg: "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
  },
  rejected: {
    label: "Update",
    bg: "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30",
    text: "text-rose-700 dark:text-rose-300",
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
  onTestNotification,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    try {
      const muted = localStorage.getItem("job_tracker_sound_muted") === "true";
      setIsMuted(muted);
      setDesktopPermission(getDesktopNotificationPermission());
    } catch {}
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem("job_tracker_sound_muted", String(nextMuted));
    } catch {}
  };

  const handleRequestDesktop = async () => {
    const perm = await requestDesktopNotificationPermission();
    setDesktopPermission(perm);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className={cn("h-4 w-4", unreadCount > 0 && "text-foreground")} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[400px] p-0 shadow-xl border border-border bg-popover rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-foreground">Notifications</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {unreadCount} new
              </span>
            ) : (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                All read
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute notification sounds" : "Mute notification sounds"}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> : <Volume2 className="h-3.5 w-3.5 text-primary" />}
            </button>

            {/* Desktop Notification Prompt */}
            {desktopPermission !== "granted" && (
              <button
                onClick={handleRequestDesktop}
                title="Enable browser desktop notifications"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Mark All Read */}
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Read all</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-2">
                <Bell className="h-5 w-5 stroke-[1.5]" />
              </div>
              <p className="text-xs font-medium text-foreground">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">
                Real-time updates from your n8n workflow and Supabase will appear here.
              </p>
              {onTestNotification && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTestNotification}
                  className="mt-3.5 h-7 text-[11px] gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Simulate Live Alert
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((n) => {
                const badge = STATUS_BADGES[n.status] || STATUS_BADGES.applied;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) onMarkAsRead(n.id);
                      if (onSelectNotification) onSelectNotification(n);
                    }}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/40",
                      !n.is_read && "bg-primary/[0.03] dark:bg-primary/[0.06]"
                    )}
                  >
                    {/* Unread indicator dot */}
                    {!n.is_read && (
                      <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}

                    {/* Recruiter / Company Avatar */}
                    <div className="shrink-0 mt-0.5">
                      <SenderAvatar sender={n.sender} company={n.company} size="sm" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[12px] font-medium text-foreground truncate">
                          {n.title}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.2 text-[9px] font-medium border",
                            badge.bg,
                            badge.text
                          )}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground/70">
                        <span className="truncate font-medium text-foreground/80">
                          {n.company} • {n.role}
                        </span>
                        <span className="shrink-0">{formatRelativeTime(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2 bg-muted/20">
            {onTestNotification ? (
              <button
                onClick={onTestNotification}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Simulate live event</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}


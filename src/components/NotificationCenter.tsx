"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Laptop,
  GripVertical,
  Archive,
  ChevronRight,
  Award,
  Calendar,
  MessageSquare,
  Send,
  Info,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SenderAvatar } from "@/components/ui/sender-avatar";
import { AppNotification, ApplicationStatus } from "@/types/application";
import {
  requestDesktopNotificationPermission,
  getDesktopNotificationPermission,
} from "@/lib/desktopNotification";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
  onTestNotification?: () => void;
  onDeleteNotification?: (id: string) => void;
}

const STATUS_BADGES: Record<
  ApplicationStatus,
  {
    label: string;
    bg: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  offer: {
    label: "Offer",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: Award,
  },
  interview: {
    label: "Interview",
    bg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: Calendar,
  },
  reply: {
    label: "Reply",
    bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    icon: MessageSquare,
  },
  applied: {
    label: "Applied",
    bg: "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
    icon: Send,
  },
  rejected: {
    label: "Update",
    bg: "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30",
    text: "text-rose-700 dark:text-rose-300",
    icon: Info,
  },
};

function cleanNotificationTitle(title: string): string {
  return title
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .trim();
}

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
  onDeleteNotification,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>("default");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

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

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteNotification) {
      onDeleteNotification(id);
    } else {
      onMarkAsRead(id);
    }
    setActiveActionId(null);
  };

  const handleArchiveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onMarkAsRead(id);
    setActiveActionId(null);
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
          className="relative h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className={cn("h-4 w-4", unreadCount > 0 && "text-foreground")} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-normal text-primary-foreground shadow-sm animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[410px] p-0 shadow-xl border border-border bg-popover rounded-xl overflow-hidden"
      >
        <Card className="rounded-none border-none shadow-none bg-popover">
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
                    <Sparkles className="h-3 w-3 text-primary" />
                    Simulate Live Alert
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-border/60 list-none m-0 p-0">
                {notifications.map((n) => {
                  const badge = STATUS_BADGES[n.status] || STATUS_BADGES.applied;
                  const isActive = activeActionId === n.id;

                  return (
                    <li
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) onMarkAsRead(n.id);
                        if (onSelectNotification) onSelectNotification(n);
                      }}
                      className={cn(
                        "group relative flex items-center justify-between p-3 transition-colors cursor-pointer hover:bg-muted/40 overflow-hidden",
                        !n.is_read && "bg-primary/[0.03] dark:bg-primary/[0.06]"
                      )}
                    >

                      {/* Animated sliding left content */}
                      <motion.div
                        animate={{ x: isActive ? -48 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-w-0 flex items-start gap-3 pl-1"
                      >
                        {/* Recruiter / Company Avatar */}
                        <div className="shrink-0 mt-0.5">
                          <SenderAvatar sender={n.sender} company={n.company} size="sm" />
                        </div>

                        {/* Text and Badges */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[12px] font-medium text-foreground truncate">
                              {cleanNotificationTitle(n.title)}
                            </span>
                            {(() => {
                              const BadgeIcon = badge.icon;
                              return (
                                <span
                                  className={cn(
                                    "shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium border",
                                    badge.bg,
                                    badge.text
                                  )}
                                >
                                  <BadgeIcon className="h-2.5 w-2.5" />
                                  {badge.label}
                                </span>
                              );
                            })()}
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
                      </motion.div>

                      {/* Right Action Controls (Framer-Motion interactive revealed actions) */}
                      <div className="ml-2 flex items-center shrink-0">
                        {isActive ? (
                          <div
                            className="flex items-center space-x-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => handleArchiveItem(e, n.id)}
                              title="Mark as read / Archive"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded-md hover:bg-muted text-destructive transition-colors"
                              onClick={(e) => handleDeleteItem(e, n.id)}
                              title="Delete notification"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionId(null);
                              }}
                              title="Close actions"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="p-1 rounded-md opacity-50 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionId(n.id);
                            }}
                            title="Actions"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
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
                  <Sparkles className="h-3 w-3 text-card-foreground" />
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
        </Card>
      </PopoverContent>
    </Popover>
  );
}

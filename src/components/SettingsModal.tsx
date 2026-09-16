"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Shield, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CalendarSettings, JobApplication, InterviewEvent } from "@/types/application";
import { DEFAULT_CALENDAR_SETTINGS } from "@/lib/googleCalendar";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncTriggered?: () => void;
  onResetCleanState?: () => void;
  applications?: JobApplication[];
  events?: InterviewEvent[];
}

const REMINDER_OPTIONS = [
  { label: "10 min", value: 10 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1 day", value: 1440 },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  onSyncTriggered,
  onResetCleanState,
  applications,
  events,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS);

  const handleResetCleanState = () => {
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("job_tracker_")) {
          localStorage.removeItem(key);
        }
      });
    }
    if (onResetCleanState) {
      onResetCleanState();
    }
    toast.success("All local tracker data cleared. Clean empty state active.");
    onOpenChange(false);
  };

  // Fetch current integration status & settings on open
  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setIsLoading(true);

    fetch("/api/integrations/google-calendar/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setIsConnected(Boolean(data.is_connected));
        setAccountEmail(data.account_email || null);
        setLastSyncedAt(data.last_synced_at || null);
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch calendar settings:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  const handleConnect = () => {
    window.location.href = "/api/integrations/google-calendar/connect";
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/integrations/google-calendar/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      if (res.ok) {
        setIsConnected(false);
        setAccountEmail(null);
        toast.success("Google Calendar disconnected.");
      }
    } catch {
      toast.error("Failed to disconnect Google Calendar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const interviewApps = (applications || []).filter((a) => a.status === "interview");
      const res = await fetch("/api/integrations/google-calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events || [],
          applications: interviewApps,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLastSyncedAt(new Date().toISOString());
        const count = (data.synced_count || 0) + (data.updated_count || 0);
        toast.success(
          data.is_mock
            ? `Sync complete. ${count} event(s) synced.`
            : `Google Calendar sync complete. ${count} active event(s) synced.`
        );
        if (onSyncTriggered) onSyncTriggered();
      } else {
        const errMsg = data.errors?.[0] || data.error || "Synchronization failed.";
        toast.error(errMsg);
      }
    } catch {
      toast.error("An error occurred during calendar synchronization.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleReminder = (minutes: number) => {
    const current = settings.reminders || [];
    let updated: number[];
    if (current.includes(minutes)) {
      updated = current.filter((m) => m !== minutes);
    } else {
      updated = [...current, minutes].sort((a, b) => a - b);
    }
    setSettings((prev) => ({ ...prev, reminders: updated }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/integrations/google-calendar/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        toast.success("Calendar settings saved.");
      } else {
        toast.error("Failed to save settings.");
      }
    } catch {
      toast.error("An error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-6 text-card-foreground">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold">
            Calendar settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure interview event synchronization with Google Calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2 pb-1 text-xs">
          {/* Section 1: Integration Status & Actions */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Image
                    src="/gcalendar.png"
                    alt="Google Calendar"
                    width={18}
                    height={18}
                    className="shrink-0 object-contain"
                  />
                  <span className="text-sm font-medium text-foreground">Google Calendar</span>
                  <span className="text-[11px] text-muted-foreground">
                    {isConnected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected && accountEmail
                    ? accountEmail
                    : "Sync interview rounds directly to your calendar."}
                </p>
              </div>

              {isConnected ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? "Syncing..." : "Sync now"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  <Image
                    src="/gcalendar.png"
                    alt="Google Calendar"
                    width={14}
                    height={14}
                    className="shrink-0 object-contain"
                  />
                  Connect
                </Button>
              )}
            </div>

            {isConnected && lastSyncedAt && (
              <p className="text-[11px] text-muted-foreground pt-0.5">
                Last synced at {new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          {/* Section 2: Preferences */}
          <div className="space-y-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preferences
            </div>

            {/* Auto-Sync Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <Checkbox
                checked={settings.auto_sync}
                onCheckedChange={(val) => setSettings((prev) => ({ ...prev, auto_sync: !!val }))}
                className="mt-0.5 rounded-sm"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-foreground">
                  Auto-sync interview stage
                </span>
                <p className="text-xs text-muted-foreground">
                  Automatically create calendar events when applications move to Interview.
                </p>
              </div>
            </label>

            {/* Default Time Setting */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="default-time" className="text-xs font-medium text-foreground">
                  Default interview time
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Used when time is unspecified. Marked as <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-foreground">[Time TBD]</code>.
                </p>
              </div>
              <Input
                id="default-time"
                type="time"
                value={settings.default_time || "10:00"}
                onChange={(e) => setSettings((prev) => ({ ...prev, default_time: e.target.value }))}
                className="w-24 h-8 text-xs bg-background shrink-0"
              />
            </div>

            {/* Reminders Pill Row */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-medium text-foreground block">
                Reminder notifications
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                {REMINDER_OPTIONS.map((opt) => {
                  const isSelected = (settings.reminders || []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleReminder(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Advanced / Data Management (De-emphasized) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight
                className={cn("w-3.5 h-3.5 transition-transform duration-200", showAdvanced && "rotate-90")}
              />
              <span>Advanced</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-foreground">
                    Clear local tracker data
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Reset cached applications, notifications, and local state.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetCleanState}
                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  Reset state
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Encrypted with Row-Level Security</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 px-3"
            >
              {isSaving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

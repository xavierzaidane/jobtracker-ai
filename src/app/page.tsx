"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import {
  JobApplication,
  ApplicationStatus,
  ActiveView,
  InterviewEvent,
  TriageEmail,
  AppNotification,
} from "@/types/application";
import {
  supabase,
  isSupabaseConfigured,
  fetchApplicationsFromSupabase,
  fetchTriageEmailsFromSupabase,
  fetchNotificationsFromSupabase,
  updateApplicationStatusInSupabase,
  upsertApplicationInSupabase,
  deleteApplicationFromSupabase,
  markNotificationAsReadInSupabase,
  markAllNotificationsAsReadInSupabase,
  getCurrentUser,
  signOutUser,
  onAuthStateChange,
  approveTriageEmailInSupabase,
  dismissTriageEmailInSupabase,
} from "@/lib/supabase";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notificationSound";
import { showDesktopNotification } from "@/lib/desktopNotification";
import { LinearSidebar } from "@/components/LinearSidebar";
import { LinearHeader } from "@/components/LinearHeader";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ApplicationDetailModal } from "@/components/ApplicationDetailModal";
import { ApplicationFormModal } from "@/components/ApplicationFormModal";
import { AuthModal } from "@/components/AuthModal";
import { SettingsModal } from "@/components/SettingsModal";
import { InterviewCalendar } from "@/components/views/InterviewCalendar";
import { ApplicationAnalytics } from "@/components/views/ApplicationAnalytics";
import { AITriageInbox } from "@/components/views/AITriageInbox";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const LOCAL_STORAGE_KEY = "job_tracker_applications_v3";
const LOCAL_STORAGE_APPROVED_KEY = "job_tracker_approved_emails_v3";
const LOCAL_STORAGE_DISMISSED_KEY = "job_tracker_dismissed_emails_v3";
const LOCAL_STORAGE_NOTIFICATIONS_KEY = "job_tracker_notifications_v3";

export default function DashboardPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>("board");
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>([]);
  const [triageEmails, setTriageEmails] = useState<TriageEmail[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const handleResetCleanState = useCallback(() => {
    setApplications([]);
    setInterviewEvents([]);
    setTriageEmails([]);
    setNotifications([]);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<ApplicationStatus | "all">("all");

  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<ApplicationStatus>("applied");

  // View coordination states
  const [isWishlistAdding, setIsWishlistAdding] = useState(false);
  const [calendarAddEventTrigger, setCalendarAddEventTrigger] = useState(0);
  const [triageFilter, setTriageFilter] = useState<"pending" | "approved">("pending");

  // Approval & Dismissed storage helpers
  const getStoredApprovedIds = useCallback((): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_APPROVED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  const getStoredDismissedIds = useCallback((): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  // 1. Initial Load & Data Fetching with timeout safety
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const approvedIds = getStoredApprovedIds();
      const dismissedIds = getStoredDismissedIds();

      if (isSupabaseConfigured) {
        const fetchAppsPromise = fetchApplicationsFromSupabase();
        const fetchEmailsPromise = fetchTriageEmailsFromSupabase();
        const fetchNotifsPromise = fetchNotificationsFromSupabase();
        const timeoutPromise = new Promise<any[]>((_, reject) =>
          setTimeout(() => reject(new Error("Supabase fetch timeout")), 5000)
        );

        const [appsResult, emailsResult, notifsResult] = await Promise.allSettled([
          Promise.race([fetchAppsPromise, timeoutPromise]),
          Promise.race([fetchEmailsPromise, timeoutPromise]),
          Promise.race([fetchNotifsPromise, timeoutPromise]),
        ]);

        if (appsResult.status === "fulfilled" && Array.isArray(appsResult.value) && appsResult.value.length > 0) {
          setApplications(appsResult.value);
        }

        if (emailsResult.status === "fulfilled" && Array.isArray(emailsResult.value)) {
          const supabaseEmails = emailsResult.value as TriageEmail[];

          // Format real Supabase emails
          const realEmailsFormatted = supabaseEmails.map((em) => ({
            ...em,
            is_approved: approvedIds.has(em.id),
          }));

          // Filter out dismissed
          const activeEmails = realEmailsFormatted.filter((e) => !dismissedIds.has(e.id));
          setTriageEmails(activeEmails);
        }

        if (notifsResult.status === "fulfilled" && Array.isArray(notifsResult.value) && notifsResult.value.length > 0) {
          setNotifications(notifsResult.value);
        }
      } else {
        const saved = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setApplications(parsed);
            }
          } catch {
            // Keep empty state
          }
        }

        const savedNotifs = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_NOTIFICATIONS_KEY) : null;
        if (savedNotifs) {
          try {
            const parsedNotifs = JSON.parse(savedNotifs);
            if (Array.isArray(parsedNotifs) && parsedNotifs.length > 0) {
              setNotifications(parsedNotifs);
            }
          } catch {}
        }

        // Apply local approval & dismissal in local mode
        setTriageEmails((prev) =>
          prev
            .filter((e) => !dismissedIds.has(e.id))
            .map((e) => ({
              ...e,
              is_approved: approvedIds.has(e.id) ? true : e.is_approved,
            }))
        );
      }
    } catch (err) {
      console.warn("Using current applications data:", err);
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, [getStoredApprovedIds, getStoredDismissedIds]);

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("calendar_connected") === "true") {
        toast.success("Google Calendar connected successfully!");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get("calendar_error")) {
        toast.error(`Google Calendar connection failed: ${urlParams.get("calendar_error")}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    if (isSupabaseConfigured) {
      getCurrentUser().then(setUser);
      const { data: { subscription } } = onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        loadData();
      });
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [loadData]);

  // Persist mock data changes to localStorage in demo mode
  useEffect(() => {
    if (!isSupabaseConfigured && isLoaded && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(applications));
    }
  }, [applications, isLoaded]);

  useEffect(() => {
    if (!isSupabaseConfigured && isLoaded && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  // Realtime notification receiver & dispatcher
  const handleIncomingNotification = useCallback(
    (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);

      // 1. Audio chime
      playNotificationSound(
        notif.status === "offer" || notif.status === "interview" ? "offer" : "default"
      );

      // 2. Sonner toast popup
      toast(notif.title, {
        description: `${notif.company} • ${notif.role}: ${notif.message}`,
        action: {
          label: "View in Board",
          onClick: () => {
            setActiveView("board");
            if (notif.application_id) {
              setApplications((currentApps) => {
                const app = currentApps.find((a) => a.id === notif.application_id);
                if (app) setSelectedApplication(app);
                return currentApps;
              });
            }
          },
        },
        duration: 7000,
      });

      // 3. Browser desktop push notification
      showDesktopNotification(notif.title, {
        body: `${notif.company} • ${notif.role}\n${notif.message}`,
        onClick: () => {
          window.focus();
          setActiveView("board");
        },
      });
    },
    []
  );

  // 2. Setup Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Realtime notification event:", payload);
          const newNotif = payload.new as AppNotification;
          if (newNotif && newNotif.id) {
            handleIncomingNotification(newNotif);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        (payload) => {
          console.log("Realtime application event:", payload);
          if (payload.eventType === "INSERT") {
            const newApp = payload.new as JobApplication;
            setApplications((prev) => {
              if (prev.some((a) => a.id === newApp.id)) return prev;
              return [newApp, ...prev];
            });

            // Also add to AI Triage Inbox as pending item
            const newInboxItem: TriageEmail = {
              id: newApp.id,
              application_id: newApp.id,
              thread_id: newApp.thread_id || "",
              company: newApp.company,
              role: newApp.role,
              sender: newApp.sender || "Unknown Sender",
              subject: newApp.subject || "Application Update",
              date: newApp.latest_update_date || newApp.applied_date || new Date().toISOString(),
              detected_status: newApp.status,
              confidence_score: 0.96,
              ai_rationale: newApp.summary
                ? `Gemini AI: "${newApp.summary}"`
                : "Real-time update received from n8n automation.",
              summary: newApp.summary || "Application status updated.",
              is_approved: false,
            };
            setTriageEmails((prev) => [newInboxItem, ...prev.filter((e) => e.id !== newInboxItem.id)]);
          } else if (payload.eventType === "UPDATE") {
            const updatedApp = payload.new as JobApplication;
            setApplications((prev) =>
              prev.map((app) => (app.id === updatedApp.id ? { ...app, ...updatedApp } : app))
            );
            // Also update any matching triage email
            setTriageEmails((prev) =>
              prev.map((em) =>
                em.application_id === updatedApp.id || em.id === updatedApp.id
                  ? {
                      ...em,
                      company: updatedApp.company,
                      role: updatedApp.role,
                      detected_status: updatedApp.status,
                      summary: updatedApp.summary || em.summary,
                    }
                  : em
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setApplications((prev) => prev.filter((app) => app.id !== deletedId));
            setTriageEmails((prev) =>
              prev.filter((em) => em.id !== deletedId && em.application_id !== deletedId)
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "application_updates",
        },
        (payload) => {
          console.log("Realtime application update event:", payload);
          const update = payload.new as any;
          if (update && update.id) {
            setApplications((currentApps) => {
              const parentApp = currentApps.find((a) => a.id === update.application_id);
              const newInboxItem: TriageEmail = {
                id: update.id,
                application_id: update.application_id,
                thread_id: update.thread_id || parentApp?.thread_id || "",
                company: parentApp?.company || "Company",
                role: parentApp?.role || "Role",
                sender: update.sender || "Unknown Sender",
                subject: update.subject || "Application Update",
                date: update.email_date || new Date().toISOString(),
                detected_status: update.status || "applied",
                confidence_score: 0.96,
                ai_rationale: update.summary
                  ? `Gemini AI: "${update.summary}"`
                  : "Real-time email update received from n8n.",
                summary: update.summary || "New email update logged.",
                is_approved: false,
              };

              setTriageEmails((prev) => [newInboxItem, ...prev.filter((e) => e.id !== newInboxItem.id)]);
              return currentApps;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
        } else {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Status counts for the sidebar badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      applied: 0,
      reply: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });
    return counts;
  }, [applications]);

  // 3. Status Drag-and-Drop Handler (Hover.dev style with beforeId ordering)
  const handleStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus,
    beforeId?: string | null
  ) => {
    let updatedCard: JobApplication | undefined;

    setApplications((prev) => {
      const copy = [...prev];
      const cardIdx = copy.findIndex((c) => c.id === applicationId);
      if (cardIdx === -1) return prev;

      updatedCard = {
        ...copy[cardIdx],
        status: newStatus,
        latest_update_date: new Date().toISOString(),
        history_log: [
          ...(copy[cardIdx].history_log || []),
          {
            date: new Date().toISOString(),
            status: newStatus,
            summary: `Status moved to ${newStatus}.`,
          },
        ],
      };

      copy.splice(cardIdx, 1);

      if (beforeId && beforeId !== "-1") {
        const insertIndex = copy.findIndex((c) => c.id === beforeId);
        if (insertIndex !== -1) {
          copy.splice(insertIndex, 0, updatedCard);
        } else {
          copy.push(updatedCard);
        }
      } else {
        copy.push(updatedCard);
      }

      return copy;
    });

    if (selectedApplication && selectedApplication.id === applicationId) {
      setSelectedApplication((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    if (isSupabaseConfigured) {
      try {
        await updateApplicationStatusInSupabase(applicationId, newStatus);
      } catch (err) {
        console.error("Failed to sync status change to Supabase:", err);
      }
    }

    // Google Calendar Auto-Sync Trigger
    if (newStatus === "interview") {
      fetch("/api/integrations/google-calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, application: updatedCard }),
      }).catch(() => {});
    } else if (newStatus === "rejected") {
      fetch("/api/integrations/google-calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action: "delete" }),
      }).catch(() => {});
    }
  };

  // 4. Upsert (Create / Edit) Handler
  const handleFormSubmit = async (formData: Partial<JobApplication>) => {
    if (isSupabaseConfigured) {
      try {
        const savedApp = await upsertApplicationInSupabase(formData);
        if (savedApp) {
          setApplications((prev) => {
            const exists = prev.some((a) => a.id === savedApp.id);
            if (exists) {
              return prev.map((a) => (a.id === savedApp.id ? savedApp : a));
            }
            return [savedApp, ...prev];
          });
        }
      } catch (err) {
        console.error("Failed to upsert to Supabase:", err);
      }
    } else {
      if (formData.id) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === formData.id
              ? {
                  ...app,
                  ...formData,
                  latest_update_date: new Date().toISOString(),
                }
              : app
          )
        );
      } else {
        const newApp: JobApplication = {
          id: `app-${Date.now()}`,
          company: formData.company || "Untitled",
          role: formData.role || "Role",
          status: formData.status || defaultStatusForNew || "applied",
          applied_date: formData.applied_date || new Date().toISOString(),
          latest_update_date: new Date().toISOString(),
          summary: formData.summary || "Manually added application.",
          sender: formData.sender,
          subject: formData.subject,
          history_log: [
            {
              date: new Date().toISOString(),
              status: formData.status || defaultStatusForNew || "applied",
              summary: "Created manually in dashboard.",
            },
          ],
        };
        setApplications((prev) => [newApp, ...prev]);
      }
    }
  };

  // 5. Delete Handler
  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to remove this application?")) return;

    setApplications((prev) => prev.filter((app) => app.id !== id));

    if (selectedApplication?.id === id) {
      setSelectedApplication(null);
    }

    if (isSupabaseConfigured) {
      try {
        await deleteApplicationFromSupabase(id);
      } catch (err) {
        console.error("Failed to delete application from Supabase:", err);
      }
    }

    // Google Calendar Cancellation Trigger
    fetch("/api/integrations/google-calendar/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id, action: "delete" }),
    }).catch(() => {});
  };

  // 6. Modal Open Triggers
  const handleOpenAddModal = (status: ApplicationStatus = "applied") => {
    setEditingApplication(null);
    setDefaultStatusForNew(status);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (application: JobApplication) => {
    setEditingApplication(application);
    setDefaultStatusForNew(application.status);
    setIsFormModalOpen(true);
  };

  // 7. Filtered applications by Search and Active Status Filter
  const filteredApplications = useMemo(() => {
    let result = applications;

    if (activeStatusFilter !== "all") {
      result = result.filter((app) => app.status === activeStatusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.company.toLowerCase().includes(query) ||
          app.role.toLowerCase().includes(query) ||
          (app.sender && app.sender.toLowerCase().includes(query)) ||
          (app.summary && app.summary.toLowerCase().includes(query)) ||
          (app.subject && app.subject.toLowerCase().includes(query))
      );
    }

    return result;
  }, [applications, searchQuery, activeStatusFilter]);




  // 9. Interview Calendar Handlers
  // 8. Interview Calendar Handlers
  const handleAddInterviewEvent = (eventData: Partial<InterviewEvent>) => {
    const newEvent: InterviewEvent = {
      id: `int-${Date.now()}`,
      company: eventData.company || "Company",
      role: eventData.role || "Role",
      round: eventData.round || "Technical Phone",
      date: eventData.date || new Date().toISOString().split("T")[0],
      time: eventData.time || "14:00",
      meeting_url: eventData.meeting_url,
      notes: eventData.notes,
    };
    setInterviewEvents((prev) => [...prev, newEvent]);
  };

  // 10. AI Triage Inbox Handlers
  const handleApproveTriageEmail = async (email: TriageEmail, overrideStatus?: ApplicationStatus) => {
    const statusToUse: ApplicationStatus =
      overrideStatus || (email.detected_status === "unparsed" ? "applied" : (email.detected_status as ApplicationStatus));

    if (isSupabaseConfigured) {
      try {
        await approveTriageEmailInSupabase(email, statusToUse);
      } catch (err) {
        console.warn("Could not sync triage approval to Supabase:", err);
      }
    }

    const existing = applications.find(
      (a) =>
        (email.application_id && a.id === email.application_id) ||
        (email.thread_id && a.thread_id === email.thread_id) ||
        (a.company.toLowerCase() === email.company.toLowerCase() &&
          a.role.toLowerCase() === email.role.toLowerCase())
    );

    if (existing) {
      if (existing.status !== statusToUse) {
        handleStatusChange(existing.id, statusToUse);
      }
    } else {
      const newApp: JobApplication = {
        id: `app-${Date.now()}`,
        thread_id: email.thread_id,
        company: email.company,
        role: email.role,
        status: statusToUse,
        applied_date: email.date,
        latest_update_date: email.date,
        sender: email.sender,
        subject: email.subject,
        summary: email.summary,
        history_log: [
          {
            date: email.date,
            status: statusToUse,
            summary: email.summary,
            subject: email.subject,
            sender: email.sender,
          },
        ],
      };
      handleFormSubmit(newApp);
    }

    // Persist approval to localStorage
    try {
      const approvedIds = getStoredApprovedIds();
      approvedIds.add(email.id);
      localStorage.setItem(LOCAL_STORAGE_APPROVED_KEY, JSON.stringify(Array.from(approvedIds)));
    } catch (err) {
      console.error("Failed to save approved email ID:", err);
    }

    setTriageEmails((prev) =>
      prev.map((e) => (e.id === email.id ? { ...e, is_approved: true, detected_status: statusToUse } : e))
    );
    toast.success(`Approved update for ${email.company}`);
  };

  const handleDismissTriageEmail = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        await dismissTriageEmailInSupabase(id);
      } catch (err) {
        console.warn("Could not sync dismissal to Supabase:", err);
      }
    }

    try {
      const dismissedIds = getStoredDismissedIds();
      dismissedIds.add(id);
      localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, JSON.stringify(Array.from(dismissedIds)));
    } catch (err) {
      console.error("Failed to save dismissed email ID:", err);
    }

    setTriageEmails((prev) => prev.filter((e) => e.id !== id));
    toast.info("Triage email dismissed");
  };

  const handleBatchApproveTriageEmails = (emailsToApprove: TriageEmail[]) => {
    emailsToApprove.forEach((email) => {
      handleApproveTriageEmail(email);
    });
  };

  // 11. Notification Center Handlers
  const handleMarkNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    if (isSupabaseConfigured) {
      await markNotificationAsReadInSupabase(id);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (isSupabaseConfigured) {
      await markAllNotificationsAsReadInSupabase();
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
    }
  };

  const handleSelectNotification = (notif: AppNotification) => {
    if (notif.application_id) {
      const app = applications.find((a) => a.id === notif.application_id);
      if (app) {
        setSelectedApplication(app);
        setActiveView("board");
        return;
      }
    }
    if (notif.status === "interview") {
      setActiveView("calendar");
    } else {
      setActiveView("board");
    }
  };

  const handleTestNotification = () => {
    const testSamples = [
      {
        company: "Stripe",
        role: "Staff Frontend Engineer",
        status: "offer" as ApplicationStatus,
        title: "Job Offer Received",
        message: "Stripe extended an official job offer! Review compensation package.",
        sender: "recruiter.sarah@stripe.com",
      },
      {
        company: "Linear",
        role: "Product Engineer",
        status: "interview" as ApplicationStatus,
        title: "Interview Invitation",
        message: "Linear invited you to a System Architecture Round next Wednesday.",
        sender: "talent@linear.app",
      },
      {
        company: "Google",
        role: "Senior Software Engineer",
        status: "reply" as ApplicationStatus,
        title: "Recruiter Reply",
        message: "Recruiter reviewed your portfolio and requested 15-minute phone sync.",
        sender: "google-talent@google.com",
      },
      {
        company: "Vercel",
        role: "Next.js Framework Engineer",
        status: "applied" as ApplicationStatus,
        title: "Application Submitted",
        message: "Application confirmed by Vercel applicant tracking system.",
        sender: "jobs@vercel.com",
      },
    ];

    const random = testSamples[Math.floor(Math.random() * testSamples.length)];
    const matchingApp = applications.find(
      (a) => a.company.toLowerCase() === random.company.toLowerCase()
    );

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      application_id: matchingApp?.id || null,
      title: random.title,
      message: random.message,
      status: random.status,
      company: random.company,
      role: random.role,
      sender: random.sender,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    handleIncomingNotification(newNotif);
  };

  return (
    <SidebarProvider defaultOpen={true} className="h-screen h-[100dvh] w-screen max-w-[100vw] overflow-hidden bg-sidebar">
      {/* Official shadcn Sidebar */}
      <LinearSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        activeStatusFilter={activeStatusFilter}
        onSelectStatusFilter={setActiveStatusFilter}
        statusCounts={statusCounts}
        totalCount={applications.length}
        pendingTriageCount={triageEmails.filter((e) => !e.is_approved).length}
        upcomingInterviewsCount={interviewEvents.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => handleOpenAddModal("applied")}
        isRealtimeConnected={isRealtimeConnected}
        isDemoMode={!isSupabaseConfigured}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onSignOut={async () => {
          try {
            await signOutUser();
            setUser(null);
            toast.success("Signed out successfully");
          } catch (err: any) {
            toast.error(err?.message || "Failed to sign out");
          }
        }}
      />

      {/* Main Canvas with SidebarInset */}
      <SidebarInset className="flex-1 flex flex-col min-w-0 min-h-0 bg-sidebar overflow-hidden p-1.5 sm:p-2 h-screen h-[100dvh]">
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Linear Header - Pinned at top */}
          <LinearHeader
            activeView={activeView}
            activeStatusFilter={activeStatusFilter}
            onRefresh={loadData}
            isRefreshing={isRefreshing}
            onOpenAddModal={() => handleOpenAddModal("applied")}
            totalCount={filteredApplications.length}
            onOpenAddWishlist={() => setIsWishlistAdding((prev) => !prev)}
            isWishlistAdding={isWishlistAdding}
            onOpenAddEvent={() => setCalendarAddEventTrigger((prev) => prev + 1)}
            triageFilter={triageFilter}
            onTriageFilterChange={setTriageFilter}
            pendingTriageCount={triageEmails.filter((e) => !e.is_approved).length}
            approvedTriageCount={triageEmails.filter((e) => e.is_approved).length}
            notifications={notifications}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onClearAllNotifications={handleClearAllNotifications}
            onSelectNotification={handleSelectNotification}
            onTestNotification={handleTestNotification}
          />

          {/* View Container */}
          {activeView === "board" && (
            <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden custom-scroll p-3 sm:p-4 bg-background">
              <KanbanBoard
                applications={filteredApplications}
                onStatusChange={handleStatusChange}
                onViewApplication={setSelectedApplication}
                onEditApplication={handleOpenEditModal}
                onDeleteApplication={handleDeleteApplication}
                onQuickAdd={handleOpenAddModal}
                onAddCard={handleFormSubmit}
              />
            </div>
          )}

          {activeView === "calendar" && (
            <div className="flex-1 min-h-0 w-full overflow-hidden bg-card">
              <InterviewCalendar
                events={interviewEvents}
                applications={applications}
                onViewApplication={setSelectedApplication}
                onAddEvent={handleAddInterviewEvent}
                openCreateTrigger={calendarAddEventTrigger}
                onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              />
            </div>
          )}


          {activeView === "analytics" && (
            <div className="flex-1 min-h-0 w-full overflow-hidden bg-card">
              <ApplicationAnalytics
                applications={applications}
                triageEmails={triageEmails}
                onQuickApply={() => {
                  setDefaultStatusForNew("applied");
                  setEditingApplication(null);
                  setIsFormModalOpen(true);
                }}
                onNavigateView={setActiveView}
              />
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Detail Modal */}
      <ApplicationDetailModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onEdit={(app) => {
          setSelectedApplication(null);
          handleOpenEditModal(app);
        }}
        onDelete={handleDeleteApplication}
        onStatusChange={handleStatusChange}
        onApplicationUpdate={(updatedApp) => {
          setSelectedApplication(updatedApp);
          setApplications((prev) =>
            prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
          );
        }}
      />

      {/* Form Modal (Add / Edit) */}
      <ApplicationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingApplication}
        defaultStatus={defaultStatusForNew}
      />

      {/* Auth & Security Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        isDemoMode={!isSupabaseConfigured}
        onRefreshUser={loadData}
      />

      {/* Settings & Integrations Modal */}
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        onSyncTriggered={loadData}
        onResetCleanState={handleResetCleanState}
        applications={applications}
        events={interviewEvents}
      />
    </SidebarProvider>
  );
}




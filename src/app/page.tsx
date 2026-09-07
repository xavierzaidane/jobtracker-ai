"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  JobApplication,
  ApplicationStatus,
  ActiveView,
  WishlistJob,
  InterviewEvent,
  TriageEmail,
} from "@/types/application";
import {
  INITIAL_MOCK_APPLICATIONS,
  INITIAL_WISHLIST_JOBS,
  INITIAL_INTERVIEW_EVENTS,
  INITIAL_TRIAGE_EMAILS,
} from "@/lib/mockData";
import {
  supabase,
  isSupabaseConfigured,
  fetchApplicationsFromSupabase,
  updateApplicationStatusInSupabase,
  upsertApplicationInSupabase,
  deleteApplicationFromSupabase,
} from "@/lib/supabase";
import { LinearSidebar } from "@/components/LinearSidebar";
import { LinearHeader } from "@/components/LinearHeader";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ApplicationDetailModal } from "@/components/ApplicationDetailModal";
import { ApplicationFormModal } from "@/components/ApplicationFormModal";
import { InterviewCalendar } from "@/components/views/InterviewCalendar";
import { JobWishlist } from "@/components/views/JobWishlist";
import { ApplicationAnalytics } from "@/components/views/ApplicationAnalytics";
import { AITriageInbox } from "@/components/views/AITriageInbox";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const LOCAL_STORAGE_KEY = "job_tracker_applications_v1";

export default function DashboardPage() {
  const [applications, setApplications] = useState<JobApplication[]>(INITIAL_MOCK_APPLICATIONS);
  const [activeView, setActiveView] = useState<ActiveView>("board");
  const [wishlistJobs, setWishlistJobs] = useState<WishlistJob[]>(INITIAL_WISHLIST_JOBS);
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>(INITIAL_INTERVIEW_EVENTS);
  const [triageEmails, setTriageEmails] = useState<TriageEmail[]>(INITIAL_TRIAGE_EMAILS);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<ApplicationStatus | "all">("all");

  // Modal states
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<ApplicationStatus>("applied");

  // View coordination states
  const [isWishlistAdding, setIsWishlistAdding] = useState(false);
  const [calendarAddEventTrigger, setCalendarAddEventTrigger] = useState(0);
  const [triageFilter, setTriageFilter] = useState<"pending" | "approved">("pending");

  // 1. Initial Load & Data Fetching with timeout safety
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured) {
        const fetchPromise = fetchApplicationsFromSupabase();
        const timeoutPromise = new Promise<JobApplication[]>((_, reject) =>
          setTimeout(() => reject(new Error("Supabase fetch timeout")), 4000)
        );
        const data = await Promise.race([fetchPromise, timeoutPromise]);
        if (data && data.length > 0) {
          setApplications(data);
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
            // Keep current mock data
          }
        }
      }
    } catch (err) {
      console.warn("Using current applications data:", err);
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Persist mock data changes to localStorage in demo mode
  useEffect(() => {
    if (!isSupabaseConfigured && isLoaded && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(applications));
    }
  }, [applications, isLoaded]);

  // 2. Setup Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        (payload) => {
          console.log("Realtime event received:", payload);
          if (payload.eventType === "INSERT") {
            const newApp = payload.new as JobApplication;
            setApplications((prev) => {
              if (prev.some((a) => a.id === newApp.id)) return prev;
              return [newApp, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedApp = payload.new as JobApplication;
            setApplications((prev) =>
              prev.map((app) => (app.id === updatedApp.id ? { ...app, ...updatedApp } : app))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setApplications((prev) => prev.filter((app) => app.id !== deletedId));
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

  // 8. Wishlist / Backlog Handlers
  const handleApplyAndMoveToBoard = (job: WishlistJob) => {
    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      company: job.company,
      role: job.role,
      status: "applied",
      applied_date: new Date().toISOString(),
      latest_update_date: new Date().toISOString(),
      summary: job.notes || `Applied via ${job.url || "direct posting"}. Target: ${job.salary_range || "Competitive"}`,
      history_log: [
        {
          date: new Date().toISOString(),
          status: "applied",
          summary: "Moved from Backlog Wishlist to Active Application.",
        },
      ],
    };
    handleFormSubmit(newApp);
    setWishlistJobs((prev) => prev.filter((w) => w.id !== job.id));
    setActiveView("board");
  };

  const handleAddWishlistJob = (jobData: Partial<WishlistJob>) => {
    const newWishlist: WishlistJob = {
      id: `wish-${Date.now()}`,
      company: jobData.company || "Untitled",
      role: jobData.role || "Role",
      location: jobData.location,
      salary_range: jobData.salary_range,
      url: jobData.url,
      notes: jobData.notes,
      date_added: new Date().toISOString(),
    };
    setWishlistJobs((prev) => [newWishlist, ...prev]);
  };

  const handleDeleteWishlistJob = (id: string) => {
    setWishlistJobs((prev) => prev.filter((w) => w.id !== id));
  };

  // 9. Interview Calendar Handlers
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
  const handleApproveTriageEmail = (email: TriageEmail, overrideStatus?: ApplicationStatus) => {
    const statusToUse = overrideStatus || email.detected_status;
    const existing = applications.find(
      (a) =>
        a.thread_id === email.thread_id ||
        (a.company.toLowerCase() === email.company.toLowerCase() &&
          a.role.toLowerCase() === email.role.toLowerCase())
    );

    if (existing) {
      handleStatusChange(existing.id, statusToUse);
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

    setTriageEmails((prev) =>
      prev.map((e) => (e.id === email.id ? { ...e, is_approved: true } : e))
    );
  };

  const handleDismissTriageEmail = (id: string) => {
    setTriageEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const handleBatchApproveTriageEmails = (emailsToApprove: TriageEmail[]) => {
    emailsToApprove.forEach((email) => {
      handleApproveTriageEmail(email);
    });
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
        wishlistCount={wishlistJobs.length}
        upcomingInterviewsCount={interviewEvents.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => handleOpenAddModal("applied")}
        isRealtimeConnected={isRealtimeConnected}
        isDemoMode={!isSupabaseConfigured}
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
          />

          {/* View Container */}
          {activeView === "board" && (
            <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden custom-scroll p-3 sm:p-4 bg-card">
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
              />
            </div>
          )}

          {activeView === "backlog" && (
            <div className="flex-1 min-h-0 w-full overflow-hidden bg-card">
              <JobWishlist
                wishlist={wishlistJobs}
                onApplyAndMoveToBoard={handleApplyAndMoveToBoard}
                onAddWishlistJob={handleAddWishlistJob}
                onDeleteWishlistJob={handleDeleteWishlistJob}
                isAdding={isWishlistAdding}
                setIsAdding={setIsWishlistAdding}
              />
            </div>
          )}

          {activeView === "analytics" && (
            <div className="flex-1 min-h-0 w-full overflow-hidden bg-card">
              <ApplicationAnalytics applications={applications} />
            </div>
          )}

          {activeView === "inbox" && (
            <div className="flex-1 min-h-0 w-full overflow-hidden bg-card">
              <AITriageInbox
                emails={triageEmails}
                onApproveEmail={handleApproveTriageEmail}
                onDismissEmail={handleDismissTriageEmail}
                onBatchApproveEmails={handleBatchApproveTriageEmails}
                filter={triageFilter}
                onFilterChange={setTriageFilter}
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
      />

      {/* Form Modal (Add / Edit) */}
      <ApplicationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingApplication}
        defaultStatus={defaultStatusForNew}
      />
    </SidebarProvider>
  );
}




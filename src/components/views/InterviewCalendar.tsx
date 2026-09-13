"use client"

import React, { useMemo } from "react"
import { EventManager, type Event } from "@/components/ui/event-manager"
import { InterviewEvent, JobApplication } from "@/types/application"

interface InterviewCalendarProps {
  events: InterviewEvent[]
  applications: JobApplication[]
  onViewApplication?: (application: JobApplication) => void
  onAddEvent?: (event: Partial<InterviewEvent>) => void
  openCreateTrigger?: number
}

function parseDateSafe(dateStr?: string | null, fallbackDate?: Date): Date {
  if (dateStr) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d
  }
  return fallbackDate || new Date()
}

export const InterviewCalendar: React.FC<InterviewCalendarProps> = ({
  events = [],
  applications = [],
  onViewApplication,
  onAddEvent,
  openCreateTrigger,
}) => {
  // Convert tracker interview events and Kanban applications into EventManager Event objects
  const initialEvents: Event[] = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // 1. Map existing explicit interview events
    const manualMapped: Event[] = events.map((ev, idx) => {
      let startTime: Date
      if (ev.date && ev.date.includes("-")) {
        const [y, m, d] = ev.date.split("-").map(Number)
        const [hh, mm] = (ev.time || "14:00").split(":").map(Number)
        startTime = new Date(y, m - 1, d, hh, mm)
      } else {
        startTime = new Date(currentYear, currentMonth, 15 + idx, 14, 0)
      }

      const durationMinutes = ev.duration ? parseInt(ev.duration) || 45 : 45
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

      const colorMap: Record<string, string> = {
        "Recruiter Screen": "orange",
        "Technical Phone": "blue",
        "System Design": "purple",
        "Coding Assessment": "green",
        "Behavioral": "pink",
        "Executive Round": "red",
      }

      return {
        id: ev.id || `manual-event-${idx}`,
        title: `${ev.company}: ${ev.round}`,
        description: `${ev.role}${ev.interviewer ? ` with ${ev.interviewer}` : ""}.${
          ev.meeting_url ? ` Video link: ${ev.meeting_url}` : ""
        }${ev.notes ? ` Notes: ${ev.notes}` : ""}`,
        startTime,
        endTime,
        color: colorMap[ev.round] || "blue",
        category: ev.round || "Interview",
        tags: [ev.company, ev.round, "Job Hunt"],
      }
    })

    // 2. Automatically generate smart multi-stage timeline events from Kanban applications
    const kanbanEvents: Event[] = []

    applications.forEach((app) => {
      const companyTag = app.company || "Unknown Company"
      const roleText = app.role || "Role"

      // A. Primary Status Events
      if (app.status === "interview") {
        const d = parseDateSafe(app.latest_update_date || app.applied_date)
        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 14, 0)
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 15, 0)
        kanbanEvents.push({
          id: `kanban-interview-${app.id}`,
          title: `${companyTag}: Technical Interview`,
          description:
            app.summary ||
            `Interview scheduled for ${roleText} at ${companyTag}. Check inbox for interview link and preparation notes.`,
          startTime,
          endTime,
          color: "blue",
          category: "Interview",
          tags: [companyTag, "Interview", "High Priority"],
        })
      } else if (app.status === "offer") {
        const d = parseDateSafe(app.latest_update_date || app.applied_date)
        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 11, 0)
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0)
        kanbanEvents.push({
          id: `kanban-offer-${app.id}`,
          title: `${companyTag}: Offer Received 🎉`,
          description:
            app.summary ||
            `Official job offer extended for ${roleText} at ${companyTag}. Review compensation and decision timeline.`,
          startTime,
          endTime,
          color: "green",
          category: "Offer Discussion",
          tags: [companyTag, "Offer", "High Priority"],
        })
      } else if (app.status === "reply") {
        const d = parseDateSafe(app.latest_update_date || app.applied_date)
        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0)
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 45)
        kanbanEvents.push({
          id: `kanban-reply-${app.id}`,
          title: `${companyTag}: Recruiter Screen`,
          description:
            app.summary ||
            `Recruiter reached out regarding ${roleText} application at ${companyTag}. Initial sync scheduled.`,
          startTime,
          endTime,
          color: "orange",
          category: "Recruiter Screen",
          tags: [companyTag, "Screening"],
        })
      } else if (app.status === "rejected") {
        const d = parseDateSafe(app.latest_update_date || app.applied_date)
        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 16, 0)
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 16, 30)
        kanbanEvents.push({
          id: `kanban-rejected-${app.id}`,
          title: `${companyTag}: Application Concluded`,
          description:
            app.summary ||
            `Application process for ${roleText} at ${companyTag} concluded.`,
          startTime,
          endTime,
          color: "red",
          category: "Not Selected",
          tags: [companyTag, "Archive"],
        })
      }

      // B. Application Submission Date Milestone
      if (app.applied_date) {
        const d = parseDateSafe(app.applied_date)
        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0)
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 30)
        kanbanEvents.push({
          id: `kanban-applied-${app.id}`,
          title: `${companyTag}: Application Submitted`,
          description: `Submitted application for ${roleText} at ${companyTag}.`,
          startTime,
          endTime,
          color: "purple",
          category: "Application",
          tags: [companyTag, "Application"],
        })
      }

      // C. Extract intermediate interview milestones from history_log if any
      if (Array.isArray(app.history_log) && app.history_log.length > 1) {
        app.history_log.forEach((entry, hIdx) => {
          if (entry.status === "interview" && entry.date !== app.latest_update_date) {
            const hd = parseDateSafe(entry.date)
            kanbanEvents.push({
              id: `kanban-hist-${app.id}-${hIdx}`,
              title: `${companyTag}: Previous Interview Round`,
              description: entry.summary || entry.subject || `Interview round recorded in history log.`,
              startTime: new Date(hd.getFullYear(), hd.getMonth(), hd.getDate(), 13, 0),
              endTime: new Date(hd.getFullYear(), hd.getMonth(), hd.getDate(), 14, 0),
              color: "blue",
              category: "Interview",
              tags: [companyTag, "Interview"],
            })
          }
        })
      }
    })

    // If applications list is completely empty, provide fallback demo milestones
    if (applications.length === 0 && manualMapped.length === 0) {
      const demoMilestones: Event[] = [
        {
          id: "demo-standup",
          title: "Google: System Design Prep",
          description: "Review distributed rate limiter and CDN caching strategies with peer group.",
          startTime: new Date(currentYear, currentMonth, Math.max(1, now.getDate() - 1), 10, 0),
          endTime: new Date(currentYear, currentMonth, Math.max(1, now.getDate() - 1), 11, 0),
          color: "purple",
          category: "System Design",
          tags: ["Google", "Urgent", "High Priority"],
        },
        {
          id: "demo-stripe",
          title: "Stripe: Offer & Equity Debrief",
          description: "Review compensation package, 4-year vesting schedule, and health benefits with HR.",
          startTime: new Date(currentYear, currentMonth, now.getDate(), 14, 30),
          endTime: new Date(currentYear, currentMonth, now.getDate(), 15, 30),
          color: "green",
          category: "Offer Discussion",
          tags: ["Stripe", "High Priority", "Offer"],
        },
        {
          id: "demo-anthropic",
          title: "Anthropic: AI Architecture Deep Dive",
          description: "Technical screen with Elena R. on LLM eval harnesses and streaming pipelines.",
          startTime: new Date(currentYear, currentMonth, now.getDate() + 2, 11, 0),
          endTime: new Date(currentYear, currentMonth, now.getDate() + 2, 12, 0),
          color: "blue",
          category: "Technical Phone",
          tags: ["Anthropic", "Urgent"],
        },
      ]
      return demoMilestones
    }

    return [...manualMapped, ...kanbanEvents]
  }, [events, applications])

  // Extract company tags dynamically from real applications
  const dynamicTags = useMemo(() => {
    const companies = applications.map((a) => a.company).filter(Boolean)
    const baseTags = ["High Priority", "Urgent", "Offer", "Interview", "Screening", "Application"]
    return Array.from(new Set([...companies, ...baseTags]))
  }, [applications])

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-card overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 sm:p-6">
        <EventManager
          events={initialEvents}
          categories={[
            "Interview",
            "Recruiter Screen",
            "Offer Discussion",
            "Application",
            "Technical Phone",
            "System Design",
            "Coding Assessment",
            "Take-Home Assessment",
            "Not Selected",
            "Personal",
          ]}
          colors={[
            { name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
            { name: "Green", value: "green", bg: "bg-green-500", text: "text-green-700" },
            { name: "Purple", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
            { name: "Orange", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
            { name: "Red", value: "red", bg: "bg-rose-500", text: "text-rose-700" },
            { name: "Pink", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
          ]}
          availableTags={dynamicTags}
          defaultView="month"
          openCreateTrigger={openCreateTrigger}
          onEventClick={(event) => {
            const matchedApp = applications.find(
              (app) =>
                event.id.includes(app.id) ||
                (event.tags && event.tags.some((tag) => tag.toLowerCase() === app.company.toLowerCase())) ||
                event.title.toLowerCase().startsWith(app.company.toLowerCase())
            )
            if (matchedApp && onViewApplication) {
              onViewApplication(matchedApp)
            }
          }}
          onEventCreate={(event) => {
            console.log("Interview event created:", event)
            onAddEvent?.({
              company: event.tags?.[0] || event.title,
              role: event.title,
              round: (event.category as any) || "Technical Phone",
              date: event.startTime.toISOString().split("T")[0],
            })
          }}
          onEventUpdate={(id, event) => console.log("Interview event updated:", id, event)}
          onEventDelete={(id) => console.log("Interview event deleted:", id)}
        />
      </div>
    </div>
  )
}

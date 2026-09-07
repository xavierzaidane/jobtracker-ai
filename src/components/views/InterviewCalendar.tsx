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

export const InterviewCalendar: React.FC<InterviewCalendarProps> = ({
  events = [],
  applications = [],
  openCreateTrigger,
}) => {
  // Convert tracker interview events into EventManager Event objects
  const initialEvents: Event[] = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // 1. Map existing job tracker interview events
    const mapped: Event[] = events.map((ev, idx) => {
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
        id: ev.id || `mapped-event-${idx}`,
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

    // 2. Add rich upcoming calendar milestones for current month demo
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
      {
        id: "demo-takehome",
        title: "Vercel: AI SDK Take-Home Deadline",
        description: "Submit GitHub repo with Next.js App Router and streaming generative UI prototype.",
        startTime: new Date(currentYear, currentMonth, now.getDate() + 4, 17, 0),
        endTime: new Date(currentYear, currentMonth, now.getDate() + 4, 18, 0),
        color: "orange",
        category: "Take-Home Assessment",
        tags: ["Vercel", "Deadline"],
      },
    ]

    return [...mapped, ...demoMilestones]
  }, [events])

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-card overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 sm:p-6">
        <EventManager
          events={initialEvents}
          categories={[
            "Recruiter Screen",
            "Technical Phone",
            "System Design",
            "Coding Assessment",
            "Offer Discussion",
            "Take-Home Assessment",
            "Personal",
          ]}
          availableTags={[
            "Google",
            "Stripe",
            "Anthropic",
            "Vercel",
            "OpenAI",
            "Urgent",
            "High Priority",
            "Offer",
            "Deadline",
            "Referral",
          ]}
          defaultView="month"
          openCreateTrigger={openCreateTrigger}
          onEventCreate={(event) => console.log("Interview event created:", event)}
          onEventUpdate={(id, event) => console.log("Interview event updated:", id, event)}
          onEventDelete={(id) => console.log("Interview event deleted:", id)}
        />
      </div>
    </div>
  )
}

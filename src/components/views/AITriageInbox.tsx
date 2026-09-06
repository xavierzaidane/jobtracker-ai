"use client";

import React, { useState } from "react";
import { TriageEmail, ApplicationStatus } from "@/types/application";
import {
  Inbox,
  Sparkles,
  Check,
  CheckCircle2,
  X,
  Mail,
  Building,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AITriageInboxProps {
  emails: TriageEmail[];
  onApproveEmail: (email: TriageEmail, overrideStatus?: ApplicationStatus) => void;
  onDismissEmail: (id: string) => void;
}

export const AITriageInbox: React.FC<AITriageInboxProps> = ({
  emails,
  onApproveEmail,
  onDismissEmail,
}) => {
  const [filter, setFilter] = useState<"pending" | "approved">("pending");

  const displayedEmails = emails.filter((em) =>
    filter === "pending" ? !em.is_approved : em.is_approved
  );

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "offer":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "interview":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "reply":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    }
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-card overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Gemini AI Email Triage Feed
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            <span>n8n Pipeline Live</span>
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setFilter("pending")}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              filter === "pending"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Review ({emails.filter((e) => !e.is_approved).length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              filter === "approved"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Processed ({emails.filter((e) => e.is_approved).length})
          </button>
        </div>
      </div>

      {/* Main Email Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 max-w-5xl mx-auto w-full space-y-3">
        {displayedEmails.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
            <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-foreground">Triage Inbox is completely caught up!</p>
            <p>New application emails detected by Gmail & n8n will automatically stream here.</p>
          </div>
        ) : (
          displayedEmails.map((email) => (
            <div
              key={email.id}
              className="p-4 rounded-xl border border-border bg-card shadow-xs hover:border-border/80 transition flex flex-col gap-3"
            >
              {/* Top info */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {email.company}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      · {email.role}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${getStatusBadge(
                        email.detected_status
                      )}`}
                    >
                      Detected: {email.detected_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium text-foreground truncate">{email.subject}</span>
                    <span>·</span>
                    <span className="shrink-0">{email.sender}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span>{Math.round(email.confidence_score * 100)}% Match</span>
                  </span>
                </div>
              </div>

              {/* AI Reasoning box */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-medium text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini Extraction Analysis:</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {email.ai_rationale}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                <span className="text-[10px] text-muted-foreground">
                  Received {new Date(email.date).toLocaleDateString()} at{" "}
                  {new Date(email.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>

                {!email.is_approved ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismissEmail(email.id)}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Dismiss</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1">
                          <span>Override Status</span>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(["applied", "reply", "interview", "offer", "rejected"] as ApplicationStatus[]).map(
                          (status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => onApproveEmail(email, status)}
                              className="capitalize cursor-pointer"
                            >
                              Move as {status}
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      size="sm"
                      onClick={() => onApproveEmail(email)}
                      className="h-7 text-xs px-3 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve to Board</span>
                    </Button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Added to Kanban Board</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


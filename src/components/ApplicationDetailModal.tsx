"use client";

import React from "react";
import { JobApplication, ApplicationStatus, COLUMNS } from "@/types/application";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Mail,
  Sparkles,
  Clock,
  Edit2,
  Trash2,
  History,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SenderAvatar } from "@/components/ui/sender-avatar";
import { getATSSourceBadge } from "@/lib/atsParsers";

interface ApplicationDetailModalProps {
  application: JobApplication | null;
  onClose: () => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!application) return null;

  const currentColumn = COLUMNS.find((c) => c.id === application.status);
  const historyEntries = application.history_log || [];

  return (
    <Dialog open={Boolean(application)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-xl bg-card border-border text-card-foreground">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border bg-muted/40 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <SenderAvatar
              sender={application.sender}
              company={application.company}
              size="lg"
            />
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {application.company}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{application.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 mr-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(application)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Edit Application"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onDelete(application.id);
                onClose();
              }}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete Application"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scroll">
          {/* Status Switcher */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">
                STATUS
              </span>
              <span className="text-xs font-semibold text-foreground">
                {currentColumn?.title || application.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Move to:</span>
              <div className="w-36">
                <Select
                  value={application.status}
                  onValueChange={(val) => onStatusChange(application.id, val as ApplicationStatus)}
                >
                  <SelectTrigger className="h-7 text-xs bg-background border-border text-foreground">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* AI Email Summary */}
          {application.summary && (
            <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Email Insight</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {application.summary}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3" />
                Date Applied
              </span>
              <p className="font-medium text-foreground">{formatDate(application.applied_date)}</p>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-0.5">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3" />
                Latest Update
              </span>
              <p className="font-medium text-foreground">{formatDate(application.latest_update_date)}</p>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1 col-span-2">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Mail className="w-3 h-3" />
                Contact / Sender
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <SenderAvatar
                  sender={application.sender}
                  company={application.company}
                  size="sm"
                />
                <p className="font-medium text-foreground truncate text-xs">{application.sender || "Manual entry"}</p>
              </div>
            </div>

            {/* ATS Source Platform info */}
            {application.ats_source && application.ats_source !== "generic" && (() => {
              const badge = getATSSourceBadge(application.ats_source);
              if (!badge) return null;
              return (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1.5 col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px] font-medium">
                      ATS Platform
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                      {badge.name}
                    </span>
                  </div>
                  {application.ats_metadata?.portal_url && (
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-muted-foreground text-[11px]">Candidate Portal</span>
                      <a
                        href={application.ats_metadata.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
                      >
                        Open Portal
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {application.ats_metadata?.job_req_id && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px]">Job Req ID</span>
                      <span className="font-mono text-muted-foreground text-[11px]">{application.ats_metadata.job_req_id}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <Separator />

          {/* History Timeline */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Timeline ({historyEntries.length})</span>
            </h3>

            {historyEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No history log recorded.</p>
            ) : (
              <div className="relative pl-4 border-l border-border space-y-3">
                {historyEntries.map((entry, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-muted-foreground/60 border-2 border-card" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                      <span className="font-medium text-foreground capitalize">{entry.status}</span>
                      <span>{formatDate(entry.date)}</span>
                    </div>
                    {entry.subject && (
                      <p className="text-xs font-medium text-foreground mb-0.5">{entry.subject}</p>
                    )}
                    {entry.summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{entry.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

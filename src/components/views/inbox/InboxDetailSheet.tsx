"use client";

import React, { useState, useEffect } from "react";
import { TriageEmail, ApplicationStatus } from "@/types/application";
import { Sparkles, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCompanyColor, getStatusBadgeClasses } from "./utils";

interface InboxDetailSheetProps {
  email: TriageEmail | null;
  onClose: () => void;
  onApproveEmail: (email: TriageEmail, overrideStatus?: ApplicationStatus) => void;
  onDismissEmail: (id: string) => void;
}

export const InboxDetailSheet: React.FC<InboxDetailSheetProps> = ({
  email,
  onClose,
  onApproveEmail,
  onDismissEmail,
}) => {
  const [overrideStatus, setOverrideStatus] = useState<ApplicationStatus | null>(null);

  useEffect(() => {
    if (email) {
      setOverrideStatus(email.detected_status);
    }
  }, [email]);

  if (!email) return null;

  return (
    <Sheet open={!!email} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-lg p-0 flex flex-col gap-0 overflow-hidden bg-card"
      >
        {/* Sheet Header */}
        <div className="p-5 border-b border-border bg-muted/20 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border ${getCompanyColor(
                email.company
              )}`}
            >
              {email.company.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                {email.company}
              </h3>
              <p className="text-xs text-muted-foreground">{email.role}</p>
            </div>
          </div>
        </div>

        {/* Sheet Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-4 text-xs">
          {/* Email Subject & Sender info */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>From: {email.sender}</span>
              <span>{new Date(email.date).toLocaleDateString()}</span>
            </div>
            <div className="font-semibold text-sm text-foreground">
              {email.subject}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
              <span>Thread: {email.thread_id}</span>
            </div>
          </div>

          {/* Gemini AI Extraction Analysis Card */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-primary text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Gemini 1.5 Flash Reasoning</span>
              </div>
              <Badge
                variant="outline"
                className="text-[11px] bg-card border-primary/25 text-primary font-semibold"
              >
                {Math.round(email.confidence_score * 100)}% Confidence
              </Badge>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              {email.ai_rationale}
            </p>

            <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Extracted Stage:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md border capitalize ${getStatusBadgeClasses(
                  email.detected_status
                )}`}
              >
                {email.detected_status}
              </span>
            </div>
          </div>

          {/* Action: Status Selection */}
          {!email.is_approved && (
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
              <label className="font-medium text-xs text-foreground block">
                Confirm Stage for Kanban Board:
              </label>
              <Select
                value={overrideStatus || email.detected_status}
                onValueChange={(v) => setOverrideStatus(v as ApplicationStatus)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select target stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Interview Round</SelectItem>
                  <SelectItem value="offer">Offer Extended</SelectItem>
                  <SelectItem value="reply">Recruiter Reply</SelectItem>
                  <SelectItem value="applied">Applied (Standard)</SelectItem>
                  <SelectItem value="rejected">Not Selected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Sheet Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>

          {!email.is_approved ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDismissEmail(email.id);
                  onClose();
                }}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onApproveEmail(email, overrideStatus || undefined);
                  onClose();
                }}
                className="text-xs font-semibold px-3 bg-primary text-primary-foreground hover:bg-primary/90 gap-1 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve to Board</span>
              </Button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-emerald-600 dark:text-emerald-400 gap-1 bg-emerald-500/10 border-emerald-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved & Synced to Board</span>
            </Badge>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};


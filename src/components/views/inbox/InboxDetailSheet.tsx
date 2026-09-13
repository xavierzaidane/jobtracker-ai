"use client";

import React, { useState, useEffect } from "react";
import { TriageEmail, ApplicationStatus } from "@/types/application";
import { Sparkles, Check, CheckCircle2, AlertTriangle } from "lucide-react";
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
import { getCompanyColor, getStatusBadgeConfig, getStatusBadgeClasses } from "./utils";
import { cn } from "@/lib/utils";
import { SenderAvatar } from "@/components/ui/sender-avatar";

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
  const [overrideStatus, setOverrideStatus] = useState<ApplicationStatus>("applied");

  useEffect(() => {
    if (email) {
      if (email.detected_status === "unparsed") {
        setOverrideStatus("applied");
      } else {
        setOverrideStatus(email.detected_status as ApplicationStatus);
      }
    }
  }, [email]);

  if (!email) return null;

  const statusBadge = getStatusBadgeConfig(email.detected_status);
  const isLowConfidence = email.confidence_score < 0.85 || email.detected_status === "unparsed";

  return (
    <Sheet open={!!email} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-lg p-0 flex flex-col gap-0 overflow-hidden bg-card"
      >
        {/* Sheet Header */}
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <SenderAvatar
                sender={email.sender}
                company={email.company}
                size="lg"
              />
              <div>
                <h3 className="font-semibold text-lg text-foreground leading-snug">
                  {email.company}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {email.role} · <span className="text-foreground/80">{email.sender}</span>
                </p>
              </div>
            </div>
            {email.is_approved && (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] gap-1 shrink-0">
                <Check className="w-3 h-3" />
                Synced to Board
              </Badge>
            )}
          </div>
        </div>

        {/* Sheet Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Email Subject & Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">
              {email.subject}
            </h4>
            <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground/90 font-mono leading-relaxed whitespace-pre-wrap">
              {email.raw_body || email.summary}
            </div>
          </div>

          {/* AI Analysis Box */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-primary text-xs">
                {isLowConfidence ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <Sparkles className="w-4 h-4" />}
                <span>Gemini Flash AI Analysis</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[11px] font-semibold ${
                  isLowConfidence
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
                    : "bg-card border-primary/25 text-primary"
                }`}
              >
                {Math.round(email.confidence_score * 100)}% Confidence
              </Badge>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              {email.ai_rationale || "Processed by Gemini AI extraction pipeline."}
            </p>

            <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Extracted Stage:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border border-border bg-card text-card-foreground shrink-0 shadow-2xs">
                <span
                  className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusBadge.dotBg)}
                />
                <span>{statusBadge.label}</span>
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
                value={overrideStatus}
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
                  onApproveEmail(email, overrideStatus);
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

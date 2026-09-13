"use client";

import React from "react";
import { TriageEmail, ApplicationStatus } from "@/types/application";
import {
  Sparkles,
  Clock,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Copy,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Gmail } from "@/components/icons/logos-google-gmail";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCompanyColor,
  getStatusBadgeConfig,
  getStatusBadgeClasses,
  formatRelativeTime,
} from "./utils";
import { cn } from "@/lib/utils";
import { SenderAvatar } from "@/components/ui/sender-avatar";

interface InboxRowProps {
  email: TriageEmail;
  isSelected: boolean;
  onToggleRow: (id: string, checked: boolean) => void;
  onInspect: (email: TriageEmail) => void;
  onApproveEmail: (email: TriageEmail, overrideStatus?: ApplicationStatus) => void;
  onDismissEmail: (id: string) => void;
}

export const InboxRow: React.FC<InboxRowProps> = ({
  email,
  isSelected,
  onToggleRow,
  onInspect,
  onApproveEmail,
  onDismissEmail,
}) => {
  const statusBadge = getStatusBadgeConfig(email.detected_status);
  const isLowConfidence = email.confidence_score < 0.85 || email.detected_status === "unparsed";

  return (
    <TableRow
      className={`border-b border-border/50 bg-input dark:bg-background transition-colors group cursor-pointer ${
        isSelected ? "bg-background" : "hover:bg-muted/30"
      }`}
      onClick={() => onInspect(email)}
    >
      {/* Checkbox */}
      <TableCell
        className="pl-5 pr-2 py-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onToggleRow(email.id, !!checked)}
          aria-label="Select row"
          className="border-border rounded-xs"
        />
      </TableCell>

      {/* Col 1: Role, Company & Recruiter Profile */}
      <TableCell className="py-3.5 ">
        <div className="flex items-center gap-3 min-w-0">
          <SenderAvatar
            sender={email.sender}
            company={email.company}
            size="md"
          />

          <div className="min-w-0">
            <div className="font-normal text-sm text-foreground truncate flex items-center gap-1.5">
              <span>{email.company}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {email.role} · <span className="opacity-80">{email.sender}</span>
            </p>
          </div>
        </div>
      </TableCell>

      {/* Col 2: AI Detection & Confidence (Dual Pills) */}
      <TableCell className="py-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pill 1: Detected Status Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border border-border bg-card text-card-foreground shrink-0 shadow-2xs">
            <span
              className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusBadge.dotBg)}
            />
            <span>{statusBadge.label}</span>
          </span>

          {/* Pill 2: Confidence Score */}
          {isLowConfidence ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 shrink-0"
              title={email.ai_rationale || "Confidence below auto-upsert threshold (<85%)"}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>{Math.round(email.confidence_score * 100)}% Review Needed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <Sparkles className="w-3 h-3" />
              <span>{Math.round(email.confidence_score * 100)}% Match</span>
            </span>
          )}
        </div>
      </TableCell>

      {/* Col 3: Source & Time (Dual Pills) */}
      <TableCell className="py-3.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pill 1: Gmail Channel */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-background text-secondary-foreground border border-border">
            <Gmail className="w-3.5 h-3.5 shrink-0" size={14} />
            <span>Gmail</span>
          </span>

          {/* Pill 2: Timestamp */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg text-muted-foreground bg-muted/40">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(email.date)}</span>
          </span>
        </div>
      </TableCell>

      {/* Col 4: Action Button & Kebab Menu */}
      <TableCell
        className="py-3.5 pr-6 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1.5">
          {/* Review & Approve Pill Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInspect(email)}
            className="h-7 text-xs px-2.5 font-medium text-primary hover:text-primary bg-background hover:bg-primary/10 border-primary/20 gap-1 rounded-lg "
          >
            <span>{email.is_approved ? "Inspect Log" : "Review & Approve"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          {/* Kebab Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              {!email.is_approved ? (
                <>
                  <DropdownMenuItem
                    onClick={() => onApproveEmail(email)}
                    className="cursor-pointer gap-2 font-medium text-primary"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Quick Approve to Board</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onApproveEmail(email, "interview")}
                    className="cursor-pointer gap-2"
                  >
                    Move as Interview
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onApproveEmail(email, "offer")}
                    className="cursor-pointer gap-2"
                  >
                    Move as Offer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onApproveEmail(email, "reply")}
                    className="cursor-pointer gap-2"
                  >
                    Move as Recruiter Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onApproveEmail(email, "applied")}
                    className="cursor-pointer gap-2"
                  >
                    Move as Applied
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDismissEmail(email.id)}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dismiss from Inbox</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard?.writeText(email.thread_id);
                      alert("Thread ID copied!");
                    }
                  }}
                  className="cursor-pointer gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Thread ID</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

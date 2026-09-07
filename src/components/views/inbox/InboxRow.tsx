"use client";

import React from "react";
import { TriageEmail, ApplicationStatus } from "@/types/application";
import {
  Sparkles,
  Mail,
  Clock,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Copy,
} from "lucide-react";
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
  getStatusBadgeClasses,
  formatRelativeTime,
} from "./utils";

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
  const initials = email.company.slice(0, 2).toUpperCase();

  return (
    <TableRow
      className={`border-b border-border/50 transition-colors group cursor-pointer ${
        isSelected ? "bg-muted/40" : "hover:bg-muted/30"
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
          aria-label={`Select ${email.company}`}
        />
      </TableCell>

      {/* Col 1: Company & Role */}
      <TableCell className="py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar circle bubble */}
          <div
            className={`h-9 w-9 rounded-full flex items-center justify-center font-normal text-xs shrink-0 border ${getCompanyColor(
              email.company
            )}`}
          >
            {initials}
          </div>

          {/* Text Info */}
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
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pill 1: Detected Status */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-normal px-2.5 py-1 rounded-lg border capitalize ${getStatusBadgeClasses(
              email.detected_status
            )}`}
          >
            <span className="capitalize">{email.detected_status}</span>
          </span>

          {/* Pill 2: Confidence Score */}
          <span className="inline-flex items-center gap-1 text-[11px] font-normal px-2.5 py-1  text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <span>{Math.round(email.confidence_score * 100)}% Match</span>
          </span>
        </div>
      </TableCell>

      {/* Col 3: Source & Time (Dual Pills) */}
      <TableCell className="py-3.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pill 1: Gmail Channel */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted text-secondary-foreground border border-border">
            <Mail className="w-3 h-3 text-primary" />
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
            className="h-7 text-xs px-2.5 font-medium text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 border-primary/20 gap-1 rounded-lg "
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


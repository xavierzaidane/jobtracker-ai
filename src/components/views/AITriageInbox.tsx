"use client";

import React, { useState, useMemo } from "react";
import { TriageEmail, ApplicationStatus } from "@/types/application";
import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { InboxToolbar } from "./inbox/InboxToolbar";
import { InboxGroupHeader } from "./inbox/InboxGroupHeader";
import { InboxRow } from "./inbox/InboxRow";
import { InboxDetailSheet } from "./inbox/InboxDetailSheet";

interface AITriageInboxProps {
  emails: TriageEmail[];
  onApproveEmail: (email: TriageEmail, overrideStatus?: ApplicationStatus) => void;
  onDismissEmail: (id: string) => void;
  onBatchApproveEmails?: (emails: TriageEmail[]) => void;
  filter?: "pending" | "approved";
  onFilterChange?: (filter: "pending" | "approved") => void;
}

export const AITriageInbox: React.FC<AITriageInboxProps> = ({
  emails,
  onApproveEmail,
  onDismissEmail,
  onBatchApproveEmails,
  filter: propFilter,
  onFilterChange: propOnFilterChange,
}) => {
  const [internalFilter, setInternalFilter] = useState<"pending" | "approved">("pending");
  const filter = propFilter !== undefined ? propFilter : internalFilter;
  const setFilter = propOnFilterChange || setInternalFilter;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectingEmail, setInspectingEmail] = useState<TriageEmail | null>(null);

  // Filter emails by active tab (pending vs approved)
  const tabEmails = useMemo(() => {
    return emails.filter((em) =>
      filter === "pending" ? !em.is_approved : em.is_approved
    );
  }, [emails, filter]);

  // Apply search filter
  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return tabEmails;
    const q = searchQuery.toLowerCase().trim();
    return tabEmails.filter(
      (em) =>
        em.company.toLowerCase().includes(q) ||
        em.role.toLowerCase().includes(q) ||
        em.sender.toLowerCase().includes(q) ||
        em.subject.toLowerCase().includes(q) ||
        em.detected_status.toLowerCase().includes(q)
    );
  }, [tabEmails, searchQuery]);

  // Group emails matching reference design sections
  const groups = useMemo(() => {
    const interviews = filteredEmails.filter(
      (e) => e.detected_status === "interview" || e.detected_status === "offer"
    );
    const replies = filteredEmails.filter((e) => e.detected_status === "reply");
    const others = filteredEmails.filter(
      (e) =>
        e.detected_status !== "interview" &&
        e.detected_status !== "offer" &&
        e.detected_status !== "reply"
    );

    return [
      {
        id: "interviews",
        title: "Interviews & Next Steps",
        emails: interviews,
        accent: "text-blue-600 dark:text-blue-400",
      },
      {
        id: "replies",
        title: "Recruiter Replies & Outreach",
        emails: replies,
        accent: "text-amber-600 dark:text-amber-400",
      },
      {
        id: "others",
        title: "Applications & Status Updates",
        emails: others,
        accent: "text-purple-600 dark:text-purple-400",
      },
    ].filter((g) => g.emails.length > 0);
  }, [filteredEmails]);

  // Selection handlers
  const isAllSelected =
    filteredEmails.length > 0 &&
    filteredEmails.every((e) => selectedIds.has(e.id));

  const isSomeSelected =
    filteredEmails.some((e) => selectedIds.has(e.id)) && !isAllSelected;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredEmails.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleGroup = (groupEmails: TriageEmail[], checked: boolean) => {
    const next = new Set(selectedIds);
    groupEmails.forEach((e) => {
      if (checked) {
        next.add(e.id);
      } else {
        next.delete(e.id);
      }
    });
    setSelectedIds(next);
  };

  const handleToggleRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  // Batch action trigger
  const handleBatchApprove = () => {
    const selectedList = filteredEmails.filter((e) => selectedIds.has(e.id));
    if (selectedList.length > 0) {
      if (onBatchApproveEmails) {
        onBatchApproveEmails(selectedList);
      } else {
        selectedList.forEach((e) => onApproveEmail(e));
      }
      setSelectedIds(new Set());
    } else {
      const highMatch = filteredEmails.filter((e) => e.confidence_score >= 0.9);
      if (highMatch.length > 0) {
        if (onBatchApproveEmails) {
          onBatchApproveEmails(highMatch);
        } else {
          highMatch.forEach((e) => onApproveEmail(e));
        }
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-card overflow-hidden">
      {/* Scrollable Container */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 sm:p-6 max-w-8xl mx-auto w-full space-y-4">
        {/* Main Card Wrapper matching reference design */}
        <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col">
          {/* Sub-component: Toolbar */}
          <InboxToolbar
            filter={filter}
            totalCount={filteredEmails.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCount={selectedIds.size}
            onBatchApprove={handleBatchApprove}
          />

          {/* Table Container */}
          {filteredEmails.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground border-dashed space-y-2">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-foreground text-sm">
                {searchQuery ? "No matching emails found" : "All caught up!"}
              </p>
              <p>
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "Incoming recruiter emails parsed by Gemini & n8n will automatically populate here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-input">
                  <TableRow className="border-b border-border/60 hover:bg-transparent text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    <TableHead className="w-12 pl-5 pr-2">
                      <Checkbox
                        checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                        onCheckedChange={handleToggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="min-w-[220px]">Company & Role</TableHead>
                    <TableHead className="min-w-[200px]">Detection & Match</TableHead>
                    <TableHead className="min-w-[190px]">Source & Time</TableHead>
                    <TableHead className="text-right pr-6 min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <React.Fragment key={group.id}>
                      {/* Sub-component: Group Section Divider */}
                      <InboxGroupHeader
                        title={group.title}
                        count={group.emails.length}
                        accent={group.accent}
                        emails={group.emails}
                        selectedIds={selectedIds}
                        onToggleGroup={handleToggleGroup}
                      />

                      {/* Sub-component: Data Rows */}
                      {group.emails.map((email) => (
                        <InboxRow
                          key={email.id}
                          email={email}
                          isSelected={selectedIds.has(email.id)}
                          onToggleRow={handleToggleRow}
                          onInspect={setInspectingEmail}
                          onApproveEmail={onApproveEmail}
                          onDismissEmail={onDismissEmail}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Sub-component: Slide-over Inspection Sheet (Drawer) */}
      <InboxDetailSheet
        email={inspectingEmail}
        onClose={() => setInspectingEmail(null)}
        onApproveEmail={onApproveEmail}
        onDismissEmail={onDismissEmail}
      />
    </div>
  );
};

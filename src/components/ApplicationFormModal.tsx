"use client";

import React, { useState, useEffect } from "react";
import { JobApplication, ApplicationStatus, COLUMNS } from "@/types/application";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (application: Partial<JobApplication>) => void;
  initialData?: JobApplication | null;
  defaultStatus?: ApplicationStatus;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultStatus = "applied",
}) => {
  const isEditing = Boolean(initialData);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>(defaultStatus);
  const [summary, setSummary] = useState("");
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [appliedDate, setAppliedDate] = useState("");

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || "");
      setRole(initialData.role || "");
      setStatus(initialData.status || defaultStatus);
      setSummary(initialData.summary || "");
      setSender(initialData.sender || "");
      setSubject(initialData.subject || "");
      setAppliedDate(
        initialData.applied_date
          ? new Date(initialData.applied_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
    } else {
      setCompany("");
      setRole("");
      setStatus(defaultStatus);
      setSummary("");
      setSender("");
      setSubject("");
      setAppliedDate(new Date().toISOString().split("T")[0]);
    }
  }, [initialData, defaultStatus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    onSubmit({
      ...(initialData?.id ? { id: initialData.id } : {}),
      company: company.trim(),
      role: role.trim(),
      status,
      summary: summary.trim(),
      sender: sender.trim() || undefined,
      subject: subject.trim() || undefined,
      applied_date: appliedDate ? new Date(appliedDate).toISOString() : new Date().toISOString(),
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-xl bg-card border-border text-card-foreground">
        <DialogHeader className="p-4 border-b border-border bg-muted/40">
          <DialogTitle className="text-sm font-semibold text-foreground">
            {isEditing ? "Edit Application" : "New Application"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Company <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Job Role <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>

          {/* Status & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as ApplicationStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
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

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Date
              </label>
              <Input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Sender */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Contact / Sender Email (Optional)
            </label>
            <Input
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. recruiter@company.com"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Notes / AI Summary
            </label>
            <Textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Add notes, salary, or link..."
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <DialogFooter className="pt-2 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              {isEditing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

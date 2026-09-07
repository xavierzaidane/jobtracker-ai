"use client";

import React, { useState } from "react";
import { WishlistJob } from "@/types/application";
import {
  Bookmark,
  Plus,
  ArrowRight,
  ExternalLink,
  MapPin,
  DollarSign,
  Trash2,
  Briefcase,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobWishlistProps {
  wishlist: WishlistJob[];
  onApplyAndMoveToBoard: (job: WishlistJob) => void;
  onAddWishlistJob: (job: Partial<WishlistJob>) => void;
  onDeleteWishlistJob: (id: string) => void;
  isAdding?: boolean;
  setIsAdding?: (val: boolean) => void;
}

export const JobWishlist: React.FC<JobWishlistProps> = ({
  wishlist,
  onApplyAndMoveToBoard,
  onAddWishlistJob,
  onDeleteWishlistJob,
  isAdding: propIsAdding,
  setIsAdding: propSetIsAdding,
}) => {
  const [internalIsAdding, setInternalIsAdding] = useState(false);
  const isAdding = propIsAdding !== undefined ? propIsAdding : internalIsAdding;
  const setIsAdding = propSetIsAdding || setInternalIsAdding;

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    onAddWishlistJob({
      company: company.trim(),
      role: role.trim(),
      location: location.trim() || undefined,
      salary_range: salaryRange.trim() || undefined,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsAdding(false);
    setCompany("");
    setRole("");
    setLocation("");
    setSalaryRange("");
    setUrl("");
    setNotes("");
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-card overflow-hidden">
      {/* Main Container */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 max-w-5xl mx-auto w-full space-y-4">
        {/* Quick Add Form */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span>Add Target Job Opportunity</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Will be saved to Backlog</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                  title="Close form"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Company (e.g. OpenAI)..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border text-foreground"
                required
              />
              <input
                type="text"
                placeholder="Role (e.g. Full Stack Engineer)..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border text-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Location / Remote (e.g. Remote US)..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border text-foreground"
              />
              <input
                type="text"
                placeholder="Target Compensation (e.g. $180k - $220k)..."
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border text-foreground"
              />
              <input
                type="url"
                placeholder="Job URL / Posting link..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border text-foreground"
              />
            </div>

            <textarea
              placeholder="Referral contacts, tech stack requirements, resume tailoring notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border text-foreground resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs">
                Save to Backlog
              </Button>
            </div>
          </form>
        )}

        {/* Wishlist Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wishlist.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No jobs in backlog. Save target roles you want to apply for.
            </div>
          ) : (
            wishlist.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-border bg-card shadow-xs hover:border-border/80 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground leading-snug">
                        {job.role}
                      </h4>
                      <span className="text-xs text-muted-foreground font-medium">
                        {job.company}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteWishlistJob(job.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition"
                      title="Remove from backlog"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-2">
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.salary_range && (
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-[11px]"
                      >
                        <span>Posting</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {job.notes && (
                    <div className="mt-2.5 p-2 rounded-md bg-muted/40 border border-border/40 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                      <FileText className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{job.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Added {new Date(job.date_added).toLocaleDateString()}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => onApplyAndMoveToBoard(job)}
                    className="h-7 text-xs px-2.5 font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <span>Apply & Move to Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


"use client";

import React, { useState, useEffect } from "react";
import { JobApplication, ApplicationStatus, COLUMNS } from "@/types/application";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  CalendarClock,
  Mail,
  Sparkles,
  Clock,
  Edit2,
  Trash2,
  History,
  ExternalLink,
  Send,
  FileText,
  FileCode,
  Copy,
  Check,
  Loader2,
  Zap,
  MessageSquare,
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
import { Textarea } from "@/components/ui/textarea";
import { getATSSourceBadge } from "@/lib/atsParsers";
import {
  sendRecruiterReply,
  getPresetReply,
  generateAIReply,
} from "@/lib/replyApi";
import { toast } from "sonner";

interface ApplicationDetailModalProps {
  application: JobApplication | null;
  onClose: () => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onApplicationUpdate?: (application: JobApplication) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onApplicationUpdate,
}) => {
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [activeTone, setActiveTone] = useState<
    "accept_time" | "reschedule" | "skill_test" | "clarify"
  >("accept_time");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Helper to extract first name or clean recruiter name from sender string
  const extractRecruiterName = (sender?: string | null): string | undefined => {
    if (!sender) return undefined;
    const match = sender.match(/^([^<@]+)/);
    if (match) {
      const raw = match[1].trim().replace(/["']/g, "");
      if (
        raw &&
        !raw.includes("@") &&
        !/recruiting|careers|talent|team|hr|no-reply|notifications|support/i.test(
          raw
        )
      ) {
        return raw.split(" ")[0];
      }
    }
    return undefined;
  };

  // Helper to cleanly extract email address
  const extractEmail = (sender?: string | null): string => {
    if (!sender) return "recruiter@example.com";
    const match = sender.match(/<([^>]+)>/);
    if (match && match[1]) return match[1].trim();
    if (sender.includes("@")) return sender.trim();
    return sender;
  };

  useEffect(() => {
    if (!application) return;

    const initialSuggested =
      application.suggested_reply ||
      application.ats_metadata?.suggested_reply;

    if (initialSuggested?.body) {
      setReplySubject(
        initialSuggested.subject ||
          `Re: Interview for ${application.role} at ${application.company}`
      );
      setReplyBody(initialSuggested.body);
      if (initialSuggested.intent === "interview_accept")
        setActiveTone("accept_time");
      else if (initialSuggested.intent === "interview_reschedule")
        setActiveTone("reschedule");
      else if (initialSuggested.intent === "skill_test_acknowledge")
        setActiveTone("skill_test");
      else if (initialSuggested.intent === "interview_clarify")
        setActiveTone("clarify");
      else setActiveTone("accept_time");
    } else {
      const defaultPreset =
        application.status === "reply" ? "skill_test" : "accept_time";
      const recruiterName = extractRecruiterName(application.sender);
      const preset = getPresetReply(
        defaultPreset,
        application.company,
        application.role,
        recruiterName
      );
      setReplySubject(preset.subject);
      setReplyBody(preset.body);
      setActiveTone(defaultPreset);
    }
    setCustomInstructions("");
    setIsGeneratingAI(false);
    setIsSending(false);
    setIsDrafting(false);
    setIsCopied(false);
  }, [
    application?.id,
    application?.status,
    application?.suggested_reply,
    application?.ats_metadata?.suggested_reply,
    application?.company,
    application?.role,
    application?.sender,
  ]);

  if (!application) return null;

  const currentColumn = COLUMNS.find((c) => c.id === application.status);
  const historyEntries = application.history_log || [];
  const hasReplyAssistant = Boolean(
    application.status === "interview" ||
    application.status === "reply" ||
    application.suggested_reply ||
    application.ats_metadata?.suggested_reply
  );

  const handleSelectTone = (
    tone: "accept_time" | "reschedule" | "skill_test" | "clarify"
  ) => {
    if (!application) return;
    setActiveTone(tone);
    const recruiterName = extractRecruiterName(application.sender);
    const preset = getPresetReply(
      tone,
      application.company,
      application.role,
      recruiterName
    );
    setReplySubject(preset.subject);
    setReplyBody(preset.body);
  };

  const handleGenerateWithAI = async (
    toneToUse?: "accept_time" | "reschedule" | "skill_test" | "clarify"
  ) => {
    if (!application) return;
    const tone = toneToUse || activeTone;
    setIsGeneratingAI(true);
    try {
      const hrContent =
        application.summary || application.ats_metadata?.snippet || "";
      const res = await generateAIReply({
        company: application.company,
        role: application.role,
        sender: application.sender,
        emailSubject: application.subject,
        emailContent: hrContent,
        tone: tone,
        customInstructions: customInstructions.trim() || undefined,
        candidateName: "Xavier",
      });

      if (res.success && res.body) {
        setReplySubject(res.subject);
        setReplyBody(res.body);
        setActiveTone(tone);
        toast.success("Tailored response generated with Gemini AI!");
      } else {
        toast.error(res.error || "Failed to generate reply with Gemini AI", {
          duration: 7000,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate reply with AI", {
        duration: 7000,
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCopy = async () => {
    if (!replyBody) return;
    try {
      await navigator.clipboard.writeText(replyBody);
      setIsCopied(true);
      toast.success("Draft copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSendOrDraft = async (action: "send" | "draft") => {
    if (!application) return;
    if (!replyBody.trim()) {
      toast.error("Please enter a reply message before sending.");
      return;
    }

    if (action === "send") setIsSending(true);
    else setIsDrafting(true);

    try {
      const recipientEmail = extractEmail(application.sender);
      const res = await sendRecruiterReply({
        applicationId: application.id,
        threadId: application.thread_id,
        toEmail: recipientEmail,
        subject:
          replySubject ||
          `Re: Interview for ${application.role} at ${application.company}`,
        replyBody: replyBody,
        action: action,
        company: application.company,
        role: application.role,
      });

      if (res.success) {
        toast.success(res.message);
        if (onApplicationUpdate) {
          const updatedApp: JobApplication = {
            ...application,
            history_log: [...(application.history_log || []), res.logEntry],
            latest_update_date: res.logEntry.date,
          };
          onApplicationUpdate(updatedApp);
        }
      } else {
        toast.error(res.message || "Failed to process reply.");
      }
    } catch (err: any) {
      console.error("Error executing reply:", err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsSending(false);
      setIsDrafting(false);
    }
  };

  // Reusable Timeline Component
  const renderTimeline = () => (
    <div className="space-y-3">
      <h3 className="text-xs font-normal text-foreground flex items-center gap-1.5 uppercase tracking-wider">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Timeline ({historyEntries.length})</span>
      </h3>

      {historyEntries.length === 0 ? (
        <p className="text-xs font-normal text-muted-foreground italic">No history log recorded.</p>
      ) : (
        <div className="relative pl-4 border-l border-border space-y-3">
          {historyEntries.map((entry, idx) => (
            <div key={idx} className="relative">
              <div
                className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-card ${
                  entry.status === "reply_sent"
                    ? "bg-primary ring-2 ring-primary/20"
                    : "bg-muted-foreground/60"
                }`}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                <span
                  className={`font-normal capitalize flex items-center gap-1 ${
                    entry.status === "reply_sent"
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {entry.status === "reply_sent" && <Mail className="w-3 h-3 text-primary" />}
                  {entry.status === "reply_sent"
                    ? entry.action === "draft"
                      ? "Gmail Draft Created"
                      : "Reply Sent via Gmail"
                    : entry.status}
                </span>
                <span className="font-normal">{formatDate(entry.date)}</span>
              </div>
              {entry.subject && (
                <p className="text-xs font-normal text-foreground mb-0.5">{entry.subject}</p>
              )}
              {entry.summary && (
                <p className="text-xs font-normal text-muted-foreground leading-relaxed">{entry.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Reusable Application Overview / Metadata
  const renderOverview = () => (
    <div className="space-y-4">
      {/* Status Switcher */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
        <div>
          <span className="text-[10px] text-muted-foreground block font-normal uppercase tracking-wider">
            STATUS
          </span>
          <span className="text-xs font-normal text-foreground">
            {currentColumn?.title || application.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-normal text-muted-foreground">Move to:</span>
          <div className="w-36">
            <Select
              value={application.status}
              onValueChange={(val) => onStatusChange(application.id, val as ApplicationStatus)}
            >
              <SelectTrigger className="h-7 text-xs font-normal bg-background border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {COLUMNS.map((col) => (
                  <SelectItem key={col.id} value={col.id} className="text-xs font-normal">
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* AI Email Insight */}
      {application.summary && (
        <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-normal text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Email Insight</span>
          </div>
          <p className="text-xs font-normal text-foreground leading-relaxed">
            {application.summary}
          </p>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-0.5">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-normal">
            <Calendar className="w-3 h-3" />
            Date Applied
          </span>
          <p className="font-normal text-foreground">{formatDate(application.applied_date)}</p>
        </div>

        <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-0.5">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-normal">
            <Clock className="w-3 h-3" />
            Latest Update
          </span>
          <p className="font-normal text-foreground">{formatDate(application.latest_update_date)}</p>
        </div>

        <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1 col-span-2">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-normal">
            <Mail className="w-3 h-3" />
            Contact / Sender
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <SenderAvatar
              sender={application.sender}
              company={application.company}
              size="sm"
            />
            <p className="font-normal text-foreground truncate text-xs">{application.sender || "Manual entry"}</p>
          </div>
        </div>

        {/* ATS Source Platform info */}
        {application.ats_source && application.ats_source !== "generic" && (() => {
          const badge = getATSSourceBadge(application.ats_source);
          if (!badge) return null;
          return (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] font-normal">
                  ATS Platform
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-normal border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                  {badge.name}
                </span>
              </div>
              {application.ats_metadata?.portal_url && (
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-muted-foreground text-[11px] font-normal">Candidate Portal</span>
                  <a
                    href={application.ats_metadata.portal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-normal"
                  >
                    Open Portal
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {application.ats_metadata?.job_req_id && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px] font-normal">Job Req ID</span>
                  <span className="font-mono text-muted-foreground text-[11px] font-normal">{application.ats_metadata.job_req_id}</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );

  return (
    <Dialog open={Boolean(application)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[88vh] flex flex-col p-0 overflow-hidden sm:rounded-xl bg-card border-border text-card-foreground font-normal">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border bg-muted/40 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <SenderAvatar
              sender={application.sender}
              company={application.company}
              size="lg"
            />
            <div>
              <DialogTitle className="text-base font-normal text-foreground">
                {application.company}
              </DialogTitle>
              <p className="text-xs font-normal text-muted-foreground">{application.role}</p>
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
        <div className="flex-1 overflow-y-auto p-5 custom-scroll">
          {hasReplyAssistant ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Overview & Timeline */}
              <div className="lg:col-span-5 space-y-5">
                {renderOverview()}
                <Separator />
                {renderTimeline()}
              </div>

              {/* Right Column: AI Recruiter Reply Assistant */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-normal text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Recruiter Reply Assistant</span>
                    </div>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-primary" />
                      <span>Gmail Node Ready</span>
                    </span>
                  </div>

                  {/* Recruiter Message Preview Card */}
                  <div className="p-3 rounded-lg bg-background/70 border border-border/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-normal text-foreground flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-primary" />
                        <span>From: {application.sender || "Recruiter"}</span>
                      </span>
                      <span className="font-normal">{formatDate(application.latest_update_date || application.applied_date)}</span>
                    </div>
                    {application.subject && (
                      <p className="text-xs font-normal text-foreground truncate">
                        Subject: {application.subject}
                      </p>
                    )}
                    <div className="text-xs font-normal text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border/60 border-l-2 border-l-primary leading-relaxed italic">
                      &ldquo;{application.summary || application.ats_metadata?.snippet || "Recruiter update received."}&rdquo;
                    </div>
                  </div>

                  {/* Quick Tone & Action Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block">
                      1. Select Response Tone & Goal
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectTone("accept_time")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-normal transition-all flex items-center gap-1.5 border ${
                          activeTone === "accept_time"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span>Accept Time</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTone("reschedule")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-normal transition-all flex items-center gap-1.5 border ${
                          activeTone === "reschedule"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                        <span>Propose Alternatives</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTone("skill_test")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-normal transition-all flex items-center gap-1.5 border ${
                          activeTone === "skill_test"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 shrink-0" />
                        <span>Acknowledge Test</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTone("clarify")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-normal transition-all flex items-center gap-1.5 border ${
                          activeTone === "clarify"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>Ask Questions</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Instructions / Availability & Generate with Gemini */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block">
                      2. Custom Instructions / Availability (Optional)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g. 'I am free Thursday 2-5pm', 'Ask if interview allows Python'..."
                        className="flex-1 text-xs font-normal px-2.5 py-1.5 rounded-md border border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleGenerateWithAI();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isGeneratingAI}
                        onClick={() => handleGenerateWithAI()}
                        className="h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-normal shrink-0 shadow-xs"
                        title="Analyze HR message and generate response using Gemini AI"
                      >
                        {isGeneratingAI ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isGeneratingAI ? "Generating..." : "Generate with Gemini"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Editable Subject & Body */}
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    <div className="space-y-1">
                      <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="w-full text-xs font-normal px-2.5 py-1.5 rounded-md border border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Email subject..."
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                          Draft Body
                        </label>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {replyBody.length} chars
                        </span>
                      </div>
                      <Textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        rows={6}
                        className="text-xs font-normal leading-relaxed bg-background/80 resize-y min-h-[120px] border-border focus-visible:ring-primary font-sans"
                        placeholder="Write or customize your response to the recruiter..."
                      />
                    </div>
                  </div>

                  {/* Actions: Send via Gmail, Create Draft, Copy */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 text-xs font-normal gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isDrafting || isSending || !replyBody.trim()}
                        onClick={() => handleSendOrDraft("draft")}
                        className="h-8 text-xs font-normal gap-1.5"
                        title="Create draft in Gmail thread"
                      >
                        {isDrafting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>Create Draft</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isSending || isDrafting || !replyBody.trim()}
                        onClick={() => handleSendOrDraft("send")}
                        className="h-8 text-xs font-normal gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                        title="Send directly in Gmail conversation thread"
                      >
                        {isSending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>Send via Gmail</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Overview */}
              <div>
                {renderOverview()}
              </div>

              {/* Right Column: Timeline */}
              <div>
                {renderTimeline()}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

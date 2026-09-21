import { JobApplication, HistoryLogEntry } from "@/types/application";
import { supabase } from "@/lib/supabase";

export interface SendRecruiterReplyParams {
  applicationId: string;
  threadId?: string | null;
  toEmail: string;
  subject: string;
  replyBody: string;
  action: "send" | "draft";
  company: string;
  role: string;
}

export interface SendRecruiterReplyResult {
  success: boolean;
  message: string;
  action: "send" | "draft";
  logEntry: HistoryLogEntry;
}

const DEFAULT_N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_REPLY_WEBHOOK_URL ||
  "http://localhost:5678/webhook/send-recruiter-reply";

/**
 * Sends a reply or creates a draft via the n8n Gmail webhook.
 * Also persists the action to the application's timeline history in Supabase.
 */
export async function sendRecruiterReply(
  params: SendRecruiterReplyParams
): Promise<SendRecruiterReplyResult> {
  const logEntry: HistoryLogEntry = {
    date: new Date().toISOString(),
    status: "reply_sent",
    subject: params.subject,
    sender: "Me (CareerOps)",
    summary:
      params.action === "send"
        ? `Sent email reply to recruiter: "${params.replyBody.slice(0, 100)}..."`
        : `Created Gmail draft: "${params.replyBody.slice(0, 100)}..."`,
    action: params.action,
  };

  let webhookSuccess = false;
  let responseMessage = "";

  try {
    const targetUrl =
      typeof window !== "undefined" ? "/api/reply" : DEFAULT_N8N_WEBHOOK_URL;
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        application_id: params.applicationId,
        thread_id: params.threadId || undefined,
        to_email: params.toEmail,
        subject: params.subject,
        reply_body: params.replyBody,
        action: params.action,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      webhookSuccess = true;
      responseMessage =
        data.message ||
        (params.action === "send"
          ? "Reply sent to recruiter via Gmail."
          : "Draft created in Gmail.");
    } else {
      throw new Error(`n8n webhook returned status ${res.status}`);
    }
  } catch (err: any) {
    console.warn("n8n Gmail webhook call failed or offline, using fallback:", err);
    // Graceful fallback for demo or when n8n webhook isn't actively running
    responseMessage =
      params.action === "send"
        ? "Reply simulated and recorded to application timeline."
        : "Draft simulated and recorded to application timeline.";
    webhookSuccess = true;
  }

  // Persist the timeline update to Supabase applications table if Supabase is active
  if (supabase && params.applicationId && !params.applicationId.startsWith("app-") && !params.applicationId.startsWith("demo-")) {
    try {
      // Fetch current history log
      const { data: currentApp } = await supabase
        .from("applications")
        .select("history_log")
        .eq("id", params.applicationId)
        .single();

      const existingLog = (currentApp?.history_log || []) as HistoryLogEntry[];
      const updatedLog = [...existingLog, logEntry];

      await supabase
        .from("applications")
        .update({
          history_log: updatedLog,
          latest_update_date: new Date().toISOString(),
        })
        .eq("id", params.applicationId);
    } catch (err) {
      console.warn("Could not sync timeline update to Supabase:", err);
    }
  }

  return {
    success: webhookSuccess,
    message: responseMessage,
    action: params.action,
    logEntry,
  };
}

export interface GenerateAIReplyParams {
  company: string;
  role: string;
  sender?: string | null;
  emailSubject?: string | null;
  emailContent?: string | null;
  tone: "accept_time" | "reschedule" | "skill_test" | "clarify";
  customInstructions?: string;
  candidateName?: string;
}

export interface GenerateAIReplyResult {
  success: boolean;
  subject: string;
  body: string;
  intent: string;
  isAIGenerated: boolean;
  error?: string;
}

/**
 * On-demand AI reply generator powered by Gemini via /api/generate-reply.
 * Returns explicit error details if Gemini fails or is blocked.
 */
export async function generateAIReply(
  params: GenerateAIReplyParams
): Promise<GenerateAIReplyResult> {
  try {
    const res = await fetch("/api/generate-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Server responded with status ${res.status}`,
        subject: "",
        body: "",
        intent: params.tone,
        isAIGenerated: false,
      };
    }

    return {
      success: true,
      subject: data.subject,
      body: data.body,
      intent: data.intent || params.tone,
      isAIGenerated: Boolean(data.isAIGenerated),
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error: ${err.message}`,
      subject: "",
      body: "",
      intent: params.tone,
      isAIGenerated: false,
    };
  }
}

/**
 * Pre-defined reply templates based on quick action presets.
 */
export function getPresetReply(
  type: "accept_time" | "reschedule" | "skill_test" | "clarify",
  company: string,
  role: string,
  recruiterName?: string
): { subject: string; body: string } {
  const salutation = recruiterName ? `Hi ${recruiterName},` : "Hello,";

  switch (type) {
    case "accept_time":
      return {
        subject: `Re: Interview for ${role} at ${company}`,
        body: `${salutation}\n\nThank you for inviting me to interview for the ${role} position at ${company}! I would be thrilled to connect.\n\nThe proposed time works perfectly for me. Please feel free to send over the calendar invite and meeting details.\n\nLooking forward to speaking with the team!\n\nBest regards,\nXavier`,
      };

    case "reschedule":
      return {
        subject: `Re: Interview Scheduling: ${role} at ${company}`,
        body: `${salutation}\n\nThank you so much for the invitation to interview for the ${role} role at ${company}!\n\nUnfortunately, I have a prior commitment at the proposed time. Would it be possible to schedule our conversation during any of these alternative windows?\n\n- Tomorrow between 1:00 PM – 4:00 PM\n- Friday between 10:00 AM – 2:00 PM\n\nPlease let me know if either of these times work on your end. Looking forward to our conversation!\n\nBest regards,\nXavier`,
      };

    case "skill_test":
      return {
        subject: `Re: Skill Assessment Confirmation: ${role} at ${company}`,
        body: `${salutation}\n\nThank you for sharing the assessment details for the ${role} position at ${company}.\n\nI have successfully received all materials and instructions. I will begin working on the assignment and plan to submit my completed project within 48 hours.\n\nPlease don't hesitate to let me know if there are any additional guidelines I should keep in mind.\n\nBest regards,\nXavier`,
      };

    case "clarify":
      return {
        subject: `Re: Follow-up on ${role} at ${company}`,
        body: `${salutation}\n\nThank you for reaching out regarding the ${role} position at ${company}.\n\nBefore confirming, could you kindly provide a bit more context regarding the format of the conversation and who I will be speaking with?\n\nThank you so much, and I look forward to connecting!\n\nBest regards,\nXavier`,
      };
  }
}

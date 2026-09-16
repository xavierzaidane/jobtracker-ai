import type { ApplicationStatus } from '@/types/application';
import type { EmailInput } from './detector';
import type { ATSParsedResult } from './greenhouse';

/**
 * Deterministic template parser for Lever ATS emails.
 */
export function parseLeverEmail(email: EmailInput): ATSParsedResult | null {
  const sender = (email.sender || '').trim();
  const subject = (email.subject || '').trim();
  const body = `${email.snippet || ''} ${email.body_cleaned || ''} ${email.raw_body || ''}`.replace(/\s+/g, ' ');

  let company = '';
  let role = '';
  let status: ApplicationStatus = 'applied';

  // --------------------------------------------------------------------------
  // 1. Company Name Extraction
  // --------------------------------------------------------------------------
  // A. From Subject:
  // "Thank you for applying to Netflix"
  // "Notion - Full Stack Engineer - Application Received"
  // "Interview with Figma - Product Designer"
  const subMatch1 = subject.match(/(?:thank you for applying to|application to)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:!|\s*[-|:]|$)/i);
  const subMatch2 = subject.match(/^([A-Z0-9][A-Za-z0-9&.\s'-]+?)\s*[-|:]\s*(?:.+?)\s*[-|:]\s*application/i);
  const subMatch3 = subject.match(/interview with\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:\s+[-|:]|$)/i);
  const subMatch4 = subject.match(/at\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:!|\s*[-|:]|$)/i);

  if (subMatch1 && subMatch1[1] && subMatch1[1].trim().length < 40) {
    company = subMatch1[1].trim();
  } else if (subMatch2 && subMatch2[1] && subMatch2[1].trim().length < 40) {
    company = subMatch2[1].trim();
  } else if (subMatch3 && subMatch3[1] && subMatch3[1].trim().length < 40) {
    company = subMatch3[1].trim();
  } else if (subMatch4 && subMatch4[1] && subMatch4[1].trim().length < 40) {
    company = subMatch4[1].trim();
  }

  // B. From Body:
  // "interest in Netflix and for applying"
  // "applying to Notion!"
  if (!company) {
    const bodyMatch1 = body.match(/(?:interest in|applying to)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:!|\s+and|\s+for|\.|\,)/i);
    const bodyMatch2 = body.match(/(?:at|with)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:\s+team|\s+has received|\s+we have received)/i);
    if (bodyMatch1 && bodyMatch1[1] && bodyMatch1[1].trim().length < 40) {
      company = bodyMatch1[1].trim();
    } else if (bodyMatch2 && bodyMatch2[1] && bodyMatch2[1].trim().length < 40) {
      company = bodyMatch2[1].trim();
    }
  }

  // C. From Sender Name:
  if (!company && sender) {
    const senderNameMatch = sender.match(/^"?'?([A-Za-z0-9&.\s'-]+?)(?:\s+recruiting|\s+talent|\s+team|\s+careers|\s+at\s+lever)?(?:"|')?\s*</i);
    if (senderNameMatch && senderNameMatch[1]) {
      const cleanSender = senderNameMatch[1].trim();
      if (!cleanSender.toLowerCase().includes('lever') && cleanSender.length < 35) {
        company = cleanSender;
      }
    }
  }

  if (company) {
    company = company.replace(/\s+(Team|Recruiting|Careers|Talent|Hiring)$/i, '').trim();
  }

  // --------------------------------------------------------------------------
  // 2. Role Extraction
  // --------------------------------------------------------------------------
  // A. From Subject:
  // "Notion - Senior Frontend Engineer - Application Received"
  // "Interview with Figma - Product Designer"
  const roleSubMatch1 = subject.match(/^[A-Za-z0-9&.\s'-]+?\s*[-|:]\s*([A-Za-z0-9\s/.,#+-]+?)\s*[-|:]\s*application/i);
  const roleSubMatch2 = subject.match(/interview with\s+[A-Za-z0-9&.\s'-]+?\s*[-|:]\s*([A-Za-z0-9\s/.,#+-]+?)$/i);

  if (roleSubMatch1 && roleSubMatch1[1] && roleSubMatch1[1].trim().length < 60) {
    role = roleSubMatch1[1].trim();
  } else if (roleSubMatch2 && roleSubMatch2[1] && roleSubMatch2[1].trim().length < 60) {
    role = roleSubMatch2[1].trim();
  }

  // B. From Body:
  // "applying for the [Role] position"
  // "application for our [Role] opening"
  if (!role) {
    const roleBodyMatch1 = body.match(/(?:for the|application for our|application for the)\s+([A-Za-z0-9\s/.,#+-]+?)\s+(?:position|role|opening|job)/i);
    const roleBodyMatch2 = body.match(/(?:role of|position of|position as|role as)\s+([A-Za-z0-9\s/.,#+-]+?)(?:\s+at|\s+with|\.|\!|\,)/i);
    if (roleBodyMatch1 && roleBodyMatch1[1] && roleBodyMatch1[1].trim().length < 60) {
      role = roleBodyMatch1[1].trim();
    } else if (roleBodyMatch2 && roleBodyMatch2[1] && roleBodyMatch2[1].trim().length < 60) {
      role = roleBodyMatch2[1].trim();
    }
  }

  if (!role) {
    role = 'Software Engineer';
  }

  // --------------------------------------------------------------------------
  // 3. Status Classification
  // --------------------------------------------------------------------------
  const bodyLower = body.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // Rejection
  if (
    bodyLower.includes('not moving forward') ||
    bodyLower.includes('decided not to move forward') ||
    bodyLower.includes('decided to move forward with another') ||
    bodyLower.includes('pursue other candidates') ||
    bodyLower.includes('will not be moving forward') ||
    bodyLower.includes('not selected for an interview') ||
    bodyLower.includes('unable to offer you an interview')
  ) {
    status = 'rejected';
  }
  // Offer
  else if (
    bodyLower.includes('offer of employment') ||
    bodyLower.includes('pleased to offer you') ||
    bodyLower.includes('offer letter')
  ) {
    status = 'offer';
  }
  // Interview
  else if (
    bodyLower.includes('invite you for an interview') ||
    bodyLower.includes('schedule an interview') ||
    bodyLower.includes('schedule a call') ||
    bodyLower.includes('phone screen') ||
    bodyLower.includes('schedule your next round') ||
    subjectLower.includes('interview with') ||
    subjectLower.includes('invitation to interview')
  ) {
    status = 'interview';
  }
  // Recruiter Reply
  else if (
    bodyLower.includes('quick question regarding your application') ||
    bodyLower.includes('follow up on your application') ||
    bodyLower.includes('additional questions')
  ) {
    status = 'reply';
  }
  // Applied / Confirmation
  else {
    status = 'applied';
  }

  // --------------------------------------------------------------------------
  // 4. Metadata (Posting URL / Lever Job ID)
  // --------------------------------------------------------------------------
  const leverUrlMatch = body.match(/https:\/\/jobs\.lever\.co\/[A-Za-z0-9_-]+\/([a-f0-9-]+)/i) ||
                        body.match(/https:\/\/jobs\.lever\.co\/[^\s"<>]+/i);
  const portalUrl = leverUrlMatch ? leverUrlMatch[0] : undefined;
  const jobReqId = leverUrlMatch && leverUrlMatch[1] ? leverUrlMatch[1] : undefined;

  if (!company || company.toLowerCase() === 'unknown' || company.length < 2) {
    return null;
  }

  const statusSummaryMap: Record<ApplicationStatus, string> = {
    applied: `Application received by ${company} for ${role} (via Lever).`,
    interview: `${company} invited candidate to an interview for ${role}.`,
    reply: `Recruiter message from ${company} regarding ${role}.`,
    offer: `Formal offer extended by ${company} for ${role}.`,
    rejected: `Application to ${company} for ${role} concluded (not moving forward).`,
  };

  return {
    company,
    role,
    status,
    confidence_score: 0.98,
    ai_rationale: `Parsed deterministically with high accuracy using Lever ATS template pattern (${status}).`,
    summary: statusSummaryMap[status] || `Lever update: ${status}`,
    ats_source: 'lever',
    ats_metadata: {
      ats_source: 'lever',
      candidate_id: undefined,
      job_req_id: jobReqId,
      portal_url: portalUrl,
      matched_signature: 'lever-mail.com / Lever Template',
      extracted_by: 'ats_template',
    },
  };
}

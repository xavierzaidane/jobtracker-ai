import type { ApplicationStatus, ATSMetadata } from '@/types/application';
import type { EmailInput } from './detector';

export interface ATSParsedResult {
  company: string;
  role: string;
  status: ApplicationStatus;
  confidence_score: number;
  ai_rationale: string;
  summary: string;
  ats_source: 'greenhouse' | 'lever';
  ats_metadata: ATSMetadata;
}

/**
 * Deterministic template parser for Greenhouse ATS emails.
 */
export function parseGreenhouseEmail(email: EmailInput): ATSParsedResult | null {
  const sender = (email.sender || '').trim();
  const subject = (email.subject || '').trim();
  const body = `${email.snippet || ''} ${email.body_cleaned || ''} ${email.raw_body || ''}`.replace(/\s+/g, ' ');

  let company = '';
  let role = '';
  let status: ApplicationStatus = 'applied';

  // --------------------------------------------------------------------------
  // 1. Company Name Extraction
  // --------------------------------------------------------------------------
  // A. From Subject Patterns:
  // "Thank you for applying to Stripe!"
  // "Application received: Software Engineer at Vercel"
  // "Figma - Application Received"
  const subMatch1 = subject.match(/(?:thank you for applying to|application received[:\s]+.*?\sat|application received at)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:!|\s*[-|:]|$)/i);
  const subMatch2 = subject.match(/^([A-Z0-9][A-Za-z0-9&.\s'-]+?)\s*[-|:]\s*(?:application|interview|next steps|update|status)/i);
  const subMatch3 = subject.match(/at\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:!|\s*[-|:]|$)/i);

  if (subMatch1 && subMatch1[1] && subMatch1[1].trim().length < 40) {
    company = subMatch1[1].trim();
  } else if (subMatch2 && subMatch2[1] && subMatch2[1].trim().length < 40) {
    company = subMatch2[1].trim();
  } else if (subMatch3 && subMatch3[1] && subMatch3[1].trim().length < 40) {
    company = subMatch3[1].trim();
  }

  // B. From Body Patterns:
  // "interest in the Senior Backend Engineer position at Stripe"
  // "thank you for applying to Figma for the"
  if (!company) {
    const bodyMatch1 = body.match(/(?:position|role|opening|job)\s+at\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:\.|,|\s+for|\s+and|\s+has|\s+is|\n|$)/i);
    const bodyMatch2 = body.match(/(?:applying to|interest in)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:\.|,|\s+for|\s+and|\n|$)/i);
    if (bodyMatch1 && bodyMatch1[1] && bodyMatch1[1].trim().length < 40) {
      company = bodyMatch1[1].trim();
    } else if (bodyMatch2 && bodyMatch2[1] && bodyMatch2[1].trim().length < 40) {
      company = bodyMatch2[1].trim();
    }
  }

  // C. From Sender Display Name:
  // "Stripe Recruiting <no-reply@greenhouse.io>" -> "Stripe"
  if (!company && sender) {
    const senderNameMatch = sender.match(/^"?'?([A-Za-z0-9&.\s'-]+?)(?:\s+recruiting|\s+talent|\s+careers|\s+team|\s+hiring|\s+hr)?(?:"|')?\s*</i);
    if (senderNameMatch && senderNameMatch[1]) {
      const cleanSender = senderNameMatch[1].trim();
      if (!cleanSender.toLowerCase().includes('greenhouse') && cleanSender.length < 35) {
        company = cleanSender;
      }
    }
  }

  // Clean company name
  if (company) {
    company = company.replace(/\s+(Team|Recruiting|Careers|Talent|HR)$/i, '').trim();
  }

  // --------------------------------------------------------------------------
  // 2. Role / Job Title Extraction
  // --------------------------------------------------------------------------
  // A. From Subject:
  // "Application received: Senior Software Engineer at Stripe"
  // "Your application for Product Designer at Figma"
  const roleSubMatch1 = subject.match(/(?:application received[:\s]+|application for\s+)(.+?)\s+at\s+/i);
  const roleSubMatch2 = subject.match(/interview invitation[:\s]+(.+?)(?:\s+at\s+|$)/i);

  if (roleSubMatch1 && roleSubMatch1[1] && roleSubMatch1[1].trim().length < 60) {
    role = roleSubMatch1[1].trim();
  } else if (roleSubMatch2 && roleSubMatch2[1] && roleSubMatch2[1].trim().length < 60) {
    role = roleSubMatch2[1].trim();
  }

  // B. From Body:
  // "interest in the [Role] position at"
  // "applying for the [Role] role"
  // "application for the [Role] position"
  if (!role) {
    const roleBodyMatch1 = body.match(/(?:for the|interest in the|application for the)\s+([A-Za-z0-9\s/.,#+-]+?)\s+(?:position|role|opening|job)\s+(?:at|with)\s+/i);
    const roleBodyMatch2 = body.match(/(?:role of|position of|position as|role as)\s+([A-Za-z0-9\s/.,#+-]+?)(?:\s+at|\s+with|\.|\!|\,)/i);
    if (roleBodyMatch1 && roleBodyMatch1[1] && roleBodyMatch1[1].trim().length < 60) {
      role = roleBodyMatch1[1].trim();
    } else if (roleBodyMatch2 && roleBodyMatch2[1] && roleBodyMatch2[1].trim().length < 60) {
      role = roleBodyMatch2[1].trim();
    }
  }

  // Fallback role default
  if (!role) {
    role = 'Software Engineer';
  }

  // --------------------------------------------------------------------------
  // 3. Status Classification
  // --------------------------------------------------------------------------
  const bodyLower = body.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // Rejection signals
  if (
    bodyLower.includes('not moving forward') ||
    bodyLower.includes('decided to move forward with other candidates') ||
    bodyLower.includes('decided to pursue other candidates') ||
    bodyLower.includes('pursue other applicants') ||
    bodyLower.includes('will not be moving forward') ||
    bodyLower.includes('unable to offer you an interview') ||
    bodyLower.includes('not selected') ||
    bodyLower.includes('position has been filled') ||
    bodyLower.includes('decided not to proceed')
  ) {
    status = 'rejected';
  }
  // Offer signals
  else if (
    bodyLower.includes('pleased to offer you') ||
    bodyLower.includes('formal offer') ||
    bodyLower.includes('congratulations on your offer') ||
    bodyLower.includes('offer letter')
  ) {
    status = 'offer';
  }
  // Interview signals
  else if (
    bodyLower.includes('invite you to an interview') ||
    bodyLower.includes('schedule an interview') ||
    bodyLower.includes('schedule a time to chat') ||
    bodyLower.includes('schedule your interview') ||
    bodyLower.includes('invitation to interview') ||
    bodyLower.includes('next steps in our interview process') ||
    subjectLower.includes('interview invitation') ||
    subjectLower.includes('invitation: interview')
  ) {
    status = 'interview';
  }
  // Recruiter Reply signals
  else if (
    bodyLower.includes('take a brief questionnaire') ||
    bodyLower.includes('complete this assessment') ||
    bodyLower.includes('submit your portfolio') ||
    subjectLower.includes('recruiter reply')
  ) {
    status = 'reply';
  }
  // Confirmation / Applied signals
  else {
    status = 'applied';
  }

  // --------------------------------------------------------------------------
  // 4. Metadata Extraction (Candidate Link, Job ID)
  // --------------------------------------------------------------------------
  const portalUrlMatch = body.match(/https:\/\/boards\.greenhouse\.io\/[A-Za-z0-9_-]+\/jobs\/(\d+)/i) ||
                         body.match(/https:\/\/[A-Za-z0-9_-]+\.greenhouse\.io\/[^\s"<>]+/i);
  const portalUrl = portalUrlMatch ? portalUrlMatch[0] : undefined;
  const jobReqId = portalUrlMatch && portalUrlMatch[1] ? portalUrlMatch[1] : undefined;

  // Validation: If company couldn't be extracted, return null to allow LLM fallback
  if (!company || company.toLowerCase() === 'unknown' || company.length < 2) {
    return null;
  }

  const statusSummaryMap: Record<ApplicationStatus, string> = {
    applied: `Application received by ${company} for ${role} (via Greenhouse).`,
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
    ai_rationale: `Parsed deterministically with high accuracy using Greenhouse ATS template pattern (${status}).`,
    summary: statusSummaryMap[status] || `Greenhouse update: ${status}`,
    ats_source: 'greenhouse',
    ats_metadata: {
      ats_source: 'greenhouse',
      candidate_id: undefined,
      job_req_id: jobReqId,
      portal_url: portalUrl,
      matched_signature: 'gh-mail.io / Greenhouse Template',
      extracted_by: 'ats_template',
    },
  };
}

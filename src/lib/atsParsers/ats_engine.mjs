/**
 * ATS Template Parser Engine
 * Shared between Next.js frontend, Node.js automated tests, and n8n pipeline node.
 */

/**
 * Detects whether an email originated from a known Applicant Tracking System (ATS).
 */
export function detectATSSource(email) {
  if (!email) return 'generic';

  const sender = (email.sender || '').toLowerCase().trim();
  const subject = (email.subject || '').toLowerCase();
  const body = `${email.snippet || ''} ${email.body_cleaned || ''} ${email.raw_body || ''}`.toLowerCase();
  const headers = email.headers || {};

  const headersString = Object.entries(headers)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ')
    .toLowerCase();

  // 1. Greenhouse Detection
  const isGreenhouseSender =
    sender.includes('@gh-mail.io') ||
    sender.includes('@greenhouse.io') ||
    sender.includes('@greenhouse-mail.io') ||
    sender.includes('greenhouse-mail') ||
    sender.includes('no-reply@greenhouse.io');

  const isGreenhouseHeader =
    headersString.includes('gh-mail.io') ||
    headersString.includes('greenhouse.io') ||
    headersString.includes('x-greenhouse');

  const isGreenhouseBody =
    body.includes('boards.greenhouse.io') ||
    body.includes('greenhouse.io/candidate') ||
    body.includes('powered by greenhouse') ||
    body.includes('greenhouse software, inc') ||
    body.includes('greenhouse privacy policy') ||
    body.includes('candidate portal powered by greenhouse');

  if (isGreenhouseSender || isGreenhouseHeader || isGreenhouseBody) {
    return 'greenhouse';
  }

  // 2. Lever Detection
  const isLeverSender =
    sender.includes('@lever-mail.com') ||
    sender.includes('@lever.co') ||
    sender.includes('no-reply@lever.co') ||
    sender.includes('lever-mail');

  const isLeverHeader =
    headersString.includes('lever-mail.com') ||
    headersString.includes('lever.co') ||
    headersString.includes('x-lever');

  const isLeverBody =
    body.includes('jobs.lever.co') ||
    body.includes('powered by lever') ||
    body.includes('lever.co/candidate') ||
    body.includes('lever privacy policy') ||
    body.includes('sent via lever');

  if (isLeverSender || isLeverHeader || isLeverBody) {
    return 'lever';
  }

  // 3. Workday Detection
  if (
    sender.includes('@myworkday.com') ||
    sender.includes('workday.com') ||
    body.includes('myworkdayjobs.com') ||
    body.includes('powered by workday')
  ) {
    return 'workday';
  }

  // 4. iCIMS Detection
  if (
    sender.includes('@icims.com') ||
    sender.includes('icims.com') ||
    body.includes('icims.com') ||
    body.includes('powered by icims')
  ) {
    return 'icims';
  }

  // 5. Ashby Detection
  if (
    sender.includes('@ashbyhq.com') ||
    sender.includes('ashby.io') ||
    body.includes('jobs.ashbyhq.com') ||
    body.includes('powered by ashby')
  ) {
    return 'ashby';
  }

  // 6. SmartRecruiters Detection
  if (
    sender.includes('@smartrecruiters.com') ||
    body.includes('smartrecruiters.com') ||
    body.includes('powered by smartrecruiters')
  ) {
    return 'smartrecruiters';
  }

  return 'generic';
}

/**
 * Deterministic template parser for Greenhouse ATS emails.
 */
export function parseGreenhouseEmail(email) {
  if (!email) return null;

  const sender = (email.sender || '').trim();
  const subject = (email.subject || '').trim();
  const body = `${email.snippet || ''} ${email.body_cleaned || ''} ${email.raw_body || ''}`.replace(/\s+/g, ' ');

  let company = '';
  let role = '';
  let status = 'applied';

  // 1. Company Extraction
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

  if (!company) {
    const bodyMatch1 = body.match(/(?:position|role|opening|job)\s+at\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:\.|,|\s+for|\s+and|\s+has|\s+is|\n|$)/i);
    const bodyMatch2 = body.match(/(?:applying to|interest in)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:\.|,|\s+for|\s+and|\n|$)/i);
    if (bodyMatch1 && bodyMatch1[1] && bodyMatch1[1].trim().length < 40) {
      company = bodyMatch1[1].trim();
    } else if (bodyMatch2 && bodyMatch2[1] && bodyMatch2[1].trim().length < 40) {
      company = bodyMatch2[1].trim();
    }
  }

  const GENERIC_SENDER_NAMES = new Set([
    'anonymous',
    'no-reply',
    'noreply',
    'notification',
    'notifications',
    'recruiting',
    'recruitment',
    'careers',
    'talent',
    'hiring',
    'team',
    'greenhouse',
    'greenhouse mail',
    'lever',
    'lever mail',
  ]);

  if (!company && sender) {
    const senderNameMatch = sender.match(/^"?'?([A-Za-z0-9&.\s'-]+?)(?:\s+recruiting|\s+talent|\s+careers|\s+team|\s+hiring|\s+hr)?(?:"|')?\s*</i);
    if (senderNameMatch && senderNameMatch[1]) {
      const cleanSender = senderNameMatch[1].trim();
      const lower = cleanSender.toLowerCase();
      if (!lower.includes('greenhouse') && !GENERIC_SENDER_NAMES.has(lower) && cleanSender.length < 35 && cleanSender.length > 1) {
        company = cleanSender;
      }
    }
  }

  if (company) {
    company = company.replace(/\s+(Team|Recruiting|Careers|Talent|HR)$/i, '').trim();
    if (GENERIC_SENDER_NAMES.has(company.toLowerCase())) {
      company = '';
    }
  }

  // 2. Role Extraction
  const roleSubMatch1 = subject.match(/(?:application received[:\s]+|application for\s+)(.+?)\s+at\s+/i);
  const roleSubMatch2 = subject.match(/interview invitation[:\s]+(.+?)(?:\s+at\s+|$)/i);

  if (roleSubMatch1 && roleSubMatch1[1] && roleSubMatch1[1].trim().length < 60) {
    role = roleSubMatch1[1].trim();
  } else if (roleSubMatch2 && roleSubMatch2[1] && roleSubMatch2[1].trim().length < 60) {
    role = roleSubMatch2[1].trim();
  }

  if (!role) {
    const roleBodyMatch1 = body.match(/(?:for the|interest in the|application for the)\s+([A-Za-z0-9\s/.,#+-]+?)\s+(?:position|role|opening|job)\s+(?:at|with)\s+/i);
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

  // 3. Status Classification
  const bodyLower = body.toLowerCase();
  const subjectLower = subject.toLowerCase();

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
  } else if (
    bodyLower.includes('pleased to offer you') ||
    bodyLower.includes('formal offer') ||
    bodyLower.includes('congratulations on your offer') ||
    bodyLower.includes('offer letter')
  ) {
    status = 'offer';
  } else if (
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
  } else if (
    bodyLower.includes('take a brief questionnaire') ||
    bodyLower.includes('complete this assessment') ||
    bodyLower.includes('submit your portfolio') ||
    subjectLower.includes('recruiter reply')
  ) {
    status = 'reply';
  } else {
    status = 'applied';
  }

  // 4. Metadata Extraction
  const portalUrlMatch = body.match(/https:\/\/boards\.greenhouse\.io\/[A-Za-z0-9_-]+\/jobs\/(\d+)/i) ||
                         body.match(/https:\/\/[A-Za-z0-9_-]+\.greenhouse\.io\/[^\s"<>]+/i);
  const portalUrl = portalUrlMatch ? portalUrlMatch[0] : undefined;
  const jobReqId = portalUrlMatch && portalUrlMatch[1] ? portalUrlMatch[1] : undefined;

  if (!company || company.toLowerCase() === 'unknown' || company.length < 2) {
    return null;
  }

  const statusSummaryMap = {
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
      job_req_id: jobReqId,
      portal_url: portalUrl,
      matched_signature: 'gh-mail.io / Greenhouse Template',
      extracted_by: 'ats_template',
    },
  };
}

/**
 * Deterministic template parser for Lever ATS emails.
 */
export function parseLeverEmail(email) {
  if (!email) return null;

  const sender = (email.sender || '').trim();
  const subject = (email.subject || '').trim();
  const body = `${email.snippet || ''} ${email.body_cleaned || ''} ${email.raw_body || ''}`.replace(/\s+/g, ' ');

  let company = '';
  let role = '';
  let status = 'applied';

  // 1. Company Extraction
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

  if (!company) {
    const bodyMatch1 = body.match(/(?:interest in|applying to)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:!|\s+and|\s+for|\.|\,)/i);
    const bodyMatch2 = body.match(/(?:at|with)\s+([A-Z0-9][A-Za-z0-9&.\s'-]+?)(?:\s+team|\s+has received|\s+we have received)/i);
    if (bodyMatch1 && bodyMatch1[1] && bodyMatch1[1].trim().length < 40) {
      company = bodyMatch1[1].trim();
    } else if (bodyMatch2 && bodyMatch2[1] && bodyMatch2[1].trim().length < 40) {
      company = bodyMatch2[1].trim();
    }
  }

  const GENERIC_LEVER_SENDER_NAMES = new Set([
    'anonymous',
    'no-reply',
    'noreply',
    'notification',
    'notifications',
    'recruiting',
    'recruitment',
    'careers',
    'talent',
    'hiring',
    'team',
    'lever',
    'lever mail',
  ]);

  if (!company && sender) {
    const senderNameMatch = sender.match(/^"?'?([A-Za-z0-9&.\s'-]+?)(?:\s+recruiting|\s+talent|\s+team|\s+careers|\s+at\s+lever)?(?:"|')?\s*</i);
    if (senderNameMatch && senderNameMatch[1]) {
      const cleanSender = senderNameMatch[1].trim();
      const lower = cleanSender.toLowerCase();
      if (!lower.includes('lever') && !GENERIC_LEVER_SENDER_NAMES.has(lower) && cleanSender.length < 35 && cleanSender.length > 1) {
        company = cleanSender;
      }
    }
  }

  if (company) {
    company = company.replace(/\s+(Team|Recruiting|Careers|Talent|Hiring)$/i, '').trim();
    if (GENERIC_LEVER_SENDER_NAMES.has(company.toLowerCase())) {
      company = '';
    }
  }

  // 2. Role Extraction
  const roleSubMatch1 = subject.match(/^[A-Za-z0-9&.\s'-]+?\s*[-|:]\s*([A-Za-z0-9\s/.,#+-]+?)\s*[-|:]\s*application/i);
  const roleSubMatch2 = subject.match(/interview with\s+[A-Za-z0-9&.\s'-]+?\s*[-|:]\s*([A-Za-z0-9\s/.,#+-]+?)$/i);

  if (roleSubMatch1 && roleSubMatch1[1] && roleSubMatch1[1].trim().length < 60) {
    role = roleSubMatch1[1].trim();
  } else if (roleSubMatch2 && roleSubMatch2[1] && roleSubMatch2[1].trim().length < 60) {
    role = roleSubMatch2[1].trim();
  }

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

  // 3. Status Classification
  const bodyLower = body.toLowerCase();
  const subjectLower = subject.toLowerCase();

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
  } else if (
    bodyLower.includes('offer of employment') ||
    bodyLower.includes('pleased to offer you') ||
    bodyLower.includes('offer letter')
  ) {
    status = 'offer';
  } else if (
    bodyLower.includes('invite you for an interview') ||
    bodyLower.includes('schedule an interview') ||
    bodyLower.includes('schedule a call') ||
    bodyLower.includes('phone screen') ||
    bodyLower.includes('schedule your next round') ||
    subjectLower.includes('interview with') ||
    subjectLower.includes('invitation to interview')
  ) {
    status = 'interview';
  } else if (
    bodyLower.includes('quick question regarding your application') ||
    bodyLower.includes('follow up on your application') ||
    bodyLower.includes('additional questions')
  ) {
    status = 'reply';
  } else {
    status = 'applied';
  }

  // 4. Metadata
  const leverUrlMatch = body.match(/https:\/\/jobs\.lever\.co\/[A-Za-z0-9_-]+\/([a-f0-9-]+)/i) ||
                        body.match(/https:\/\/jobs\.lever\.co\/[^\s"<>]+/i);
  const portalUrl = leverUrlMatch ? leverUrlMatch[0] : undefined;
  const jobReqId = leverUrlMatch && leverUrlMatch[1] ? leverUrlMatch[1] : undefined;

  if (!company || company.toLowerCase() === 'unknown' || company.length < 2) {
    return null;
  }

  const statusSummaryMap = {
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
      job_req_id: jobReqId,
      portal_url: portalUrl,
      matched_signature: 'lever-mail.com / Lever Template',
      extracted_by: 'ats_template',
    },
  };
}

/**
 * Unified parser router
 */
export function parseATSEmail(email) {
  const source = detectATSSource(email);

  if (source === 'greenhouse') {
    const res = parseGreenhouseEmail(email);
    if (res) return res;
  } else if (source === 'lever') {
    const res = parseLeverEmail(email);
    if (res) return res;
  }

  return null;
}

/**
 * Returns badge styling for ATS sources
 */
export function getATSSourceBadge(source) {
  if (!source || source === 'generic' || source === 'manual') {
    return null;
  }

  switch (source) {
    case 'greenhouse':
      return {
        label: 'Greenhouse',
        name: 'Greenhouse',
        color: 'text-emerald-700 dark:text-emerald-300',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
      };
    case 'lever':
      return {
        label: 'Lever',
        name: 'Lever',
        color: 'text-blue-700 dark:text-blue-300',
        textClass: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-500/10 border-blue-500/20',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20',
      };
    case 'workday':
      return {
        label: 'Workday',
        name: 'Workday',
        color: 'text-orange-700 dark:text-orange-300',
        textClass: 'text-orange-700 dark:text-orange-300',
        bg: 'bg-orange-500/10 border-orange-500/20',
        bgClass: 'bg-orange-500/10',
        borderClass: 'border-orange-500/20',
      };
    case 'icims':
      return {
        label: 'iCIMS',
        name: 'iCIMS',
        color: 'text-purple-700 dark:text-purple-300',
        textClass: 'text-purple-700 dark:text-purple-300',
        bg: 'bg-purple-500/10 border-purple-500/20',
        bgClass: 'bg-purple-500/10',
        borderClass: 'border-purple-500/20',
      };
    case 'ashby':
      return {
        label: 'Ashby',
        name: 'Ashby',
        color: 'text-amber-700 dark:text-amber-300',
        textClass: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-500/10 border-amber-500/20',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
      };
    case 'smartrecruiters':
      return {
        label: 'SmartRecruiters',
        name: 'SmartRecruiters',
        color: 'text-sky-700 dark:text-sky-300',
        textClass: 'text-sky-700 dark:text-sky-300',
        bg: 'bg-sky-500/10 border-sky-500/20',
        bgClass: 'bg-sky-500/10',
        borderClass: 'border-sky-500/20',
      };
    default:
      return null;
  }
}

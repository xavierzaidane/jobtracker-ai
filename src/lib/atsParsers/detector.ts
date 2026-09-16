import type { ATSSource } from '@/types/application';

export interface EmailInput {
  sender?: string | null;
  subject?: string | null;
  snippet?: string | null;
  body_cleaned?: string | null;
  raw_body?: string | null;
  headers?: Record<string, string> | null;
}

/**
 * Detects whether an email originated from a known Applicant Tracking System (ATS).
 * Inspects sender domains, headers, Message-ID signatures, and footer tokens.
 */
export function detectATSSource(email: EmailInput): ATSSource {
  const sender = (email.sender || '').toLowerCase().trim();
  const subject = (email.subject || '').toLowerCase();
  const body = `${email.snippet || ''} ${email.body_cleaned || ''} ${email.raw_body || ''}`.toLowerCase();
  const headers = email.headers || {};

  const headersString = Object.entries(headers)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ')
    .toLowerCase();

  // 1. Greenhouse Detection
  // Sender domains, reply-to, message-id or footer branding
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
  // Sender domains, message-id or footer branding
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

  // 3. Workday Detection (for future expansion / detection)
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

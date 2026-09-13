import { describe, it } from 'node:test';
import assert from 'node:assert';

// ==============================================================================
// Triage Pipeline, Retry & Confidence-Gating Test Suite (PRD 3.2 & 3.3)
// ==============================================================================

const CONFIDENCE_THRESHOLD = 0.85;

/**
 * Simulates n8n Workflow Merge Metadata & Pipeline Router logic
 */
function processPipelineEmail(rawEmail, geminiResponseOrError) {
  let isUnparsed = false;
  let parsed = null;

  // Handle Gemini parsing failure (PRD 3.2)
  if (!geminiResponseOrError || geminiResponseOrError instanceof Error || !geminiResponseOrError.status) {
    isUnparsed = true;
  } else {
    parsed = geminiResponseOrError;
  }

  // Extract company
  let company = (parsed?.company || '').trim();
  if (!company) {
    const subMatch = (rawEmail.subject || '').match(/at\s+([A-Z][A-Za-z0-9&.\s]+?)(?:!|\s*[-|:]|$)/i);
    if (subMatch && subMatch[1]) {
      company = subMatch[1].trim();
    } else {
      company = 'Unknown Company';
    }
  }

  const role = parsed?.role || 'Unspecified Role';
  const status = isUnparsed ? 'unparsed' : (parsed.status || 'applied').toLowerCase().trim();
  const confidence = isUnparsed ? 0.0 : (typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.90);
  const rationale = isUnparsed
    ? 'Gemini AI parsing failed or timed out. Raw email captured for manual triage.'
    : (parsed.ai_rationale || 'Classified by Gemini AI.');

  const item = {
    thread_id: rawEmail.thread_id,
    message_id: rawEmail.message_id,
    sender: rawEmail.sender,
    subject: rawEmail.subject,
    email_date: rawEmail.email_date || new Date().toISOString().split('T')[0],
    status,
    confidence_score: confidence,
    ai_rationale: rationale,
    company,
    role,
    summary: parsed?.summary || rawEmail.snippet || 'Email update captured.',
    is_unparsed: isUnparsed,
  };

  // Pipeline Routing (PRD 3.3)
  if (item.status === 'ignore') {
    return { route: 'ignored', item };
  }

  if (item.confidence_score >= CONFIDENCE_THRESHOLD && !item.is_unparsed) {
    return {
      route: 'auto_upsert_applications',
      item: { ...item, is_approved: true },
      notification: {
        title: item.status === 'offer' ? '🎉 Job Offer Received!' : '🎯 Application Update',
        priority: 'standard',
      },
    };
  } else {
    return {
      route: 'triage_inbox_pending',
      item: { ...item, is_approved: false },
      notification: {
        title: item.is_unparsed ? '⚠️ Unparsed Email Alert' : '⚠️ Low-Confidence Triage Item',
        priority: 'action_required',
      },
    };
  }
}

describe('CareerOps Pipeline Reliability & Confidence Gating (3.2 & 3.3)', () => {
  it('auto-upserts high-confidence AI classifications (>= 0.85) directly to Kanban board', () => {
    const rawEmail = {
      thread_id: 'th_001',
      sender: 'talent@stripe.com',
      subject: 'Formal Offer: Staff Frontend Engineer at Stripe!',
      snippet: 'We are thrilled to extend an offer...',
    };
    const geminiOutput = {
      status: 'offer',
      company: 'Stripe',
      role: 'Staff Frontend Engineer',
      confidence_score: 0.98,
      ai_rationale: 'Email explicitly contains formal compensation numbers and employment offer.',
      summary: 'Formal offer extended with base salary and equity package.',
    };

    const result = processPipelineEmail(rawEmail, geminiOutput);

    assert.strictEqual(result.route, 'auto_upsert_applications');
    assert.strictEqual(result.item.is_approved, true);
    assert.strictEqual(result.item.status, 'offer');
    assert.strictEqual(result.item.confidence_score, 0.98);
    assert.strictEqual(result.notification.priority, 'standard');
  });

  it('gates low-confidence classifications (< 0.85) to Triage Inbox for manual review', () => {
    const rawEmail = {
      thread_id: 'th_002',
      sender: 'dan@startup.io',
      subject: 'Quick chat regarding your profile',
      snippet: 'Saw your GitHub profile and wanted to connect about potential roles.',
    };
    const geminiOutput = {
      status: 'reply',
      company: 'Startup.io',
      role: 'Founding Engineer',
      confidence_score: 0.72, // Below 0.85 threshold!
      ai_rationale: 'Uncertain whether this is a formal candidate outreach or casual prospecting networking.',
      summary: 'Recruiter reached out for a casual conversation.',
    };

    const result = processPipelineEmail(rawEmail, geminiOutput);

    assert.strictEqual(result.route, 'triage_inbox_pending', 'Low confidence must NOT auto-upsert');
    assert.strictEqual(result.item.is_approved, false);
    assert.strictEqual(result.item.confidence_score, 0.72);
    assert.strictEqual(result.notification.priority, 'action_required');
  });

  it('safely captures unparsed / timed-out Gemini errors to Triage Inbox without dropping emails (3.2)', () => {
    const rawEmail = {
      thread_id: 'th_003',
      sender: 'recruiting@apple.com',
      subject: 'Interview Schedule at Apple',
      snippet: 'Please select a slot for your onsite loop.',
    };

    // Simulated API timeout / error
    const geminiError = new Error('Gemini API 504 Gateway Timeout after 3 retries');

    const result = processPipelineEmail(rawEmail, geminiError);

    assert.strictEqual(result.route, 'triage_inbox_pending');
    assert.strictEqual(result.item.is_unparsed, true);
    assert.strictEqual(result.item.status, 'unparsed');
    assert.strictEqual(result.item.confidence_score, 0.0);
    assert.strictEqual(result.item.company, 'Apple', 'Should extract company from subject fallback');
    assert.strictEqual(result.item.is_approved, false);
    assert.strictEqual(result.notification.title, '⚠️ Unparsed Email Alert');
  });

  it('correctly drops noise and marketing emails classified as ignore', () => {
    const rawEmail = {
      thread_id: 'th_004',
      sender: 'newsletter@jobalerts.com',
      subject: 'Top 10 Tech Jobs This Week',
      snippet: 'Check out the latest openings...',
    };
    const geminiOutput = {
      status: 'ignore',
      company: 'JobAlerts',
      role: 'Various',
      confidence_score: 0.99,
      ai_rationale: 'Bulk automated newsletter digest.',
      summary: 'Weekly job digest newsletter.',
    };

    const result = processPipelineEmail(rawEmail, geminiOutput);

    assert.strictEqual(result.route, 'ignored');
  });
});

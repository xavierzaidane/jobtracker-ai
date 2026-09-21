import test from 'node:test';
import assert from 'node:assert/strict';

// Core logic functions corresponding to frontend/src/lib/replyApi.ts
function getPresetReply(type, company, role, recruiterName) {
  const salutation = recruiterName ? `Hi ${recruiterName},` : 'Hello,';

  switch (type) {
    case 'accept_time':
      return {
        subject: `Re: Interview for ${role} at ${company}`,
        body: `${salutation}\n\nThank you for inviting me to interview for the ${role} position at ${company}! I would be thrilled to connect.\n\nThe proposed time works perfectly for me. Please feel free to send over the calendar invite and meeting details.\n\nLooking forward to speaking with the team!\n\nBest regards,\nXavier`,
      };

    case 'reschedule':
      return {
        subject: `Re: Interview Scheduling: ${role} at ${company}`,
        body: `${salutation}\n\nThank you so much for the invitation to interview for the ${role} role at ${company}!\n\nUnfortunately, I have a prior commitment at the proposed time. Would it be possible to schedule our conversation during any of these alternative windows?\n\n- Tomorrow between 1:00 PM – 4:00 PM\n- Friday between 10:00 AM – 2:00 PM\n\nPlease let me know if either of these times work on your end. Looking forward to our conversation!\n\nBest regards,\nXavier`,
      };

    case 'skill_test':
      return {
        subject: `Re: Skill Assessment Confirmation: ${role} at ${company}`,
        body: `${salutation}\n\nThank you for sharing the assessment details for the ${role} position at ${company}.\n\nI have successfully received all materials and instructions. I will begin working on the assignment and plan to submit my completed project within 48 hours.\n\nPlease don't hesitate to let me know if there are any additional guidelines I should keep in mind.\n\nBest regards,\nXavier`,
      };
    case 'clarify':
      return {
        subject: `Re: Follow-up on ${role} at ${company}`,
        body: `${salutation}\n\nThank you for reaching out regarding the ${role} position at ${company}.\n\nBefore confirming, could you kindly provide a bit more context regarding the format of the conversation and who I will be speaking with?\n\nThank you so much, and I look forward to connecting!\n\nBest regards,\nXavier`,
      };
    default:
      throw new Error(`Unknown preset type: ${type}`);
  }
}

function generateFallbackAIReply(params) {
  const salutation = params.recruiterName ? `Hi ${params.recruiterName},` : 'Hello,';
  const custom = params.customInstructions ? `\n\n${params.customInstructions}` : '';
  let body = '';

  if (params.tone === 'clarify') {
    body = `${salutation}\n\nThank you for getting in touch regarding the ${params.role} opportunity at ${params.company}!${custom || '\n\nCould you kindly share a few details about the format of the upcoming conversation?'}\n\nBest regards,\n${params.candidateName || 'Xavier'}`;
  } else if (params.tone === 'reschedule') {
    body = `${salutation}\n\nThank you for the invitation for the ${params.role} role at ${params.company}! Unfortunately, I have a conflict. ${custom || 'Would tomorrow afternoon work instead?'}\n\nBest regards,\n${params.candidateName || 'Xavier'}`;
  } else {
    body = `${salutation}\n\nThank you for reaching out! ${custom}\n\nBest regards,\n${params.candidateName || 'Xavier'}`;
  }

  return {
    subject: `Re: ${params.role} at ${params.company}`,
    body,
    intent: params.tone,
    isAIGenerated: false,
  };
}

function buildReplyLogEntry(params) {
  return {
    date: new Date().toISOString(),
    status: 'reply_sent',
    subject: params.subject,
    sender: 'Me (CareerOps)',
    summary:
      params.action === 'send'
        ? `Sent email reply to recruiter: "${params.replyBody.slice(0, 100)}..."`
        : `Created Gmail draft: "${params.replyBody.slice(0, 100)}..."`,
    action: params.action,
  };
}

test('AI Recruiter Reply Assistant - Presets & Templates', async (t) => {
  await t.test('generates Accept Time reply with role and company', () => {
    const reply = getPresetReply('accept_time', 'Stripe', 'Senior Full Stack Engineer');
    assert.equal(reply.subject, 'Re: Interview for Senior Full Stack Engineer at Stripe');
    assert.ok(reply.body.includes('Senior Full Stack Engineer position at Stripe'));
    assert.ok(reply.body.includes('The proposed time works perfectly for me'));
    assert.ok(reply.body.startsWith('Hello,'));
  });

  await t.test('includes recruiter personal name when provided', () => {
    const reply = getPresetReply('accept_time', 'Google', 'Staff Engineer', 'Alice');
    assert.ok(reply.body.startsWith('Hi Alice,'));
  });

  await t.test('generates Reschedule reply offering alternate windows', () => {
    const reply = getPresetReply('reschedule', 'Datadog', 'Backend Engineer');
    assert.equal(reply.subject, 'Re: Interview Scheduling: Backend Engineer at Datadog');
    assert.ok(reply.body.includes('Unfortunately, I have a prior commitment'));
    assert.ok(reply.body.includes('Tomorrow between 1:00 PM – 4:00 PM'));
  });

  await t.test('generates Skill Test Acknowledgment reply with commitment timeline', () => {
    const reply = getPresetReply('skill_test', 'Vercel', 'Solutions Architect');
    assert.equal(reply.subject, 'Re: Skill Assessment Confirmation: Solutions Architect at Vercel');
    assert.ok(reply.body.includes('successfully received all materials and instructions'));
    assert.ok(reply.body.includes('within 48 hours'));
  });

  await t.test('generates Clarify / Questions reply politely inquiring on format', () => {
    const reply = getPresetReply('clarify', 'Airbnb', 'Senior Product Engineer');
    assert.equal(reply.subject, 'Re: Follow-up on Senior Product Engineer at Airbnb');
    assert.ok(reply.body.includes('regarding the Senior Product Engineer position at Airbnb'));
    assert.ok(reply.body.includes('format of the conversation'));
  });
});

test('AI Recruiter Reply Assistant - Dynamic Contextual AI Engine', async (t) => {
  await t.test('incorporates candidate custom availability into reschedule draft', () => {
    const aiDraft = generateFallbackAIReply({
      company: 'Linear',
      role: 'Staff Engineer',
      recruiterName: 'Karri',
      tone: 'reschedule',
      customInstructions: 'I am only available on Mondays after 3 PM EST.',
    });

    assert.equal(aiDraft.intent, 'reschedule');
    assert.ok(aiDraft.body.includes('Hi Karri,'));
    assert.ok(aiDraft.body.includes('I am only available on Mondays after 3 PM EST.'));
  });

  await t.test('incorporates custom technical questions into clarify draft', () => {
    const aiDraft = generateFallbackAIReply({
      company: 'OpenAI',
      role: 'Research Engineer',
      recruiterName: 'Sam',
      tone: 'clarify',
      customInstructions: 'Could you share if the interview involves live coding in Python?',
    });

    assert.equal(aiDraft.intent, 'clarify');
    assert.ok(aiDraft.body.includes('Hi Sam,'));
    assert.ok(aiDraft.body.includes('Could you share if the interview involves live coding in Python?'));
  });
});

test('AI Recruiter Reply Assistant - Timeline & Audit Logging', async (t) => {
  await t.test('creates formatted history log entry for send action', () => {
    const log = buildReplyLogEntry({
      subject: 'Re: Interview for SWE at Figma',
      replyBody: 'Thank you for the invite! The time works well.',
      action: 'send',
    });

    assert.equal(log.status, 'reply_sent');
    assert.equal(log.action, 'send');
    assert.equal(log.sender, 'Me (CareerOps)');
    assert.ok(log.summary.startsWith('Sent email reply to recruiter:'));
    assert.ok(log.date);
  });

  await t.test('creates formatted history log entry for draft action', () => {
    const log = buildReplyLogEntry({
      subject: 'Re: Interview for SWE at Figma',
      replyBody: 'Drafting alternative dates.',
      action: 'draft',
    });

    assert.equal(log.status, 'reply_sent');
    assert.equal(log.action, 'draft');
    assert.equal(log.sender, 'Me (CareerOps)');
    assert.ok(log.summary.startsWith('Created Gmail draft:'));
  });
});

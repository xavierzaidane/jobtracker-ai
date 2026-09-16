import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectATSSource,
  parseGreenhouseEmail,
  parseLeverEmail,
  parseATSEmail,
  getATSSourceBadge
} from '../src/lib/atsParsers/ats_engine.mjs';

test('ATS Signature Detector', async (t) => {
  await t.test('detects Greenhouse from sender address', () => {
    const source = detectATSSource({
      sender: 'Stripe Recruiting <no-reply@greenhouse.io>',
      subject: 'Thank you for applying to Stripe!',
      body_cleaned: 'Thank you for applying for the Software Engineer role.'
    });
    assert.equal(source, 'greenhouse');
  });

  await t.test('detects Greenhouse from gh-mail.io sender', () => {
    const source = detectATSSource({
      sender: 'Airbnb Talent <no-reply@gh-mail.io>',
      subject: 'Application received',
      body_cleaned: 'We have received your application.'
    });
    assert.equal(source, 'greenhouse');
  });

  await t.test('detects Greenhouse from custom domain with body link', () => {
    const source = detectATSSource({
      sender: 'careers@figma.com',
      subject: 'Thank you for applying to Figma!',
      body_cleaned: 'To view your status visit https://boards.greenhouse.io/figma/jobs/12345'
    });
    assert.equal(source, 'greenhouse');
  });

  await t.test('detects Lever from sender domain', () => {
    const source = detectATSSource({
      sender: 'Notion Hiring <no-reply@lever.co>',
      subject: 'Thank you for applying to Notion',
      body_cleaned: 'Thanks for your interest in Notion.'
    });
    assert.equal(source, 'lever');
  });

  await t.test('detects Lever from jobs.lever.co link in body', () => {
    const source = detectATSSource({
      sender: 'recruiting@netflix.com',
      subject: 'Application to Netflix',
      body_cleaned: 'You applied via https://jobs.lever.co/netflix/98765-abcd Powered by Lever'
    });
    assert.equal(source, 'lever');
  });

  await t.test('returns generic for non-ATS personal email', () => {
    const source = detectATSSource({
      sender: 'john.recruiter@gmail.com',
      subject: 'Quick chat about your resume',
      body_cleaned: 'Hey, I came across your LinkedIn profile.'
    });
    assert.equal(source, 'generic');
  });
});

test('Greenhouse Deterministic Template Parser', async (t) => {
  await t.test('accurately parses application receipt with 0.98 confidence', () => {
    const parsed = parseGreenhouseEmail({
      sender: 'Stripe Recruiting <no-reply@greenhouse.io>',
      subject: 'Thank you for applying to Stripe!',
      body_cleaned: 'Thank you for your interest in the Staff Backend Engineer position at Stripe. We have received your application and our team is reviewing it.'
    });

    assert.ok(parsed);
    assert.equal(parsed.company, 'Stripe');
    assert.equal(parsed.role, 'Staff Backend Engineer');
    assert.equal(parsed.status, 'applied');
    assert.equal(parsed.confidence_score, 0.98);
    assert.equal(parsed.ats_source, 'greenhouse');
  });

  await t.test('accurately parses interview invitation with 0.98 confidence', () => {
    const parsed = parseGreenhouseEmail({
      sender: 'Datadog Careers <no-reply@gh-mail.io>',
      subject: 'Datadog - Interview Invitation: Senior DevOps Engineer',
      body_cleaned: 'We were impressed with your background and would like to invite you to an interview for the Senior DevOps Engineer position at Datadog.'
    });

    assert.ok(parsed);
    assert.equal(parsed.company, 'Datadog');
    assert.equal(parsed.role, 'Senior DevOps Engineer');
    assert.equal(parsed.status, 'interview');
    assert.equal(parsed.confidence_score, 0.98);
  });

  await t.test('accurately parses rejection letter with 0.98 confidence', () => {
    const parsed = parseGreenhouseEmail({
      sender: 'Vercel Talent <no-reply@greenhouse-mail.io>',
      subject: 'Update on your application to Vercel',
      body_cleaned: 'Thank you for taking the time to apply for the Frontend Architect role at Vercel. After careful consideration, we have decided to move forward with other candidates at this time.'
    });

    assert.ok(parsed);
    assert.equal(parsed.company, 'Vercel');
    assert.equal(parsed.role, 'Frontend Architect');
    assert.equal(parsed.status, 'rejected');
    assert.equal(parsed.confidence_score, 0.98);
  });

  await t.test('falls back gracefully (returns null) if company cannot be resolved', () => {
    const parsed = parseGreenhouseEmail({
      sender: 'anonymous <no-reply@gh-mail.io>',
      subject: 'Application received',
      body_cleaned: 'Your application was received for software engineer.'
    });
    // Should return null so Gemini AI fallback will take over
    assert.equal(parsed, null);
  });
});

test('Lever Deterministic Template Parser', async (t) => {
  await t.test('accurately parses application receipt with 0.98 confidence', () => {
    const parsed = parseLeverEmail({
      sender: 'Figma Team <no-reply@lever.co>',
      subject: 'Thank you for applying to Figma',
      body_cleaned: 'Thank you for your interest in Figma and for applying for the Product Designer position. We appreciate your interest in our company.'
    });

    assert.ok(parsed);
    assert.equal(parsed.company, 'Figma');
    assert.equal(parsed.role, 'Product Designer');
    assert.equal(parsed.status, 'applied');
    assert.equal(parsed.confidence_score, 0.98);
    assert.equal(parsed.ats_source, 'lever');
  });

  await t.test('accurately parses interview phone screen with 0.98 confidence', () => {
    const parsed = parseLeverEmail({
      sender: 'Notion Careers <jobs@lever-mail.com>',
      subject: 'Interview with Notion - Full Stack Engineer',
      body_cleaned: 'We loved your application and would like to invite you for an interview with our engineering manager next week.'
    });

    assert.ok(parsed);
    assert.equal(parsed.company, 'Notion');
    assert.equal(parsed.role, 'Full Stack Engineer');
    assert.equal(parsed.status, 'interview');
    assert.equal(parsed.confidence_score, 0.98);
  });

  await t.test('accurately parses rejection with 0.98 confidence', () => {
    const parsed = parseLeverEmail({
      sender: 'Postman Recruiting <jobs@lever-mail.com>',
      subject: 'Your application to Postman',
      body_cleaned: 'Thank you for applying for the Developer Advocate position at Postman. Unfortunately, we have decided not to move forward with your application at this time.'
    });

    assert.ok(parsed);
    assert.equal(parsed.company, 'Postman');
    assert.equal(parsed.role, 'Developer Advocate');
    assert.equal(parsed.status, 'rejected');
    assert.equal(parsed.confidence_score, 0.98);
  });
});

test('Unified ATS Parser & Fallback Safety', async (t) => {
  await t.test('routes Greenhouse email to Greenhouse parser', () => {
    const res = parseATSEmail({
      sender: 'no-reply@greenhouse.io',
      subject: 'Thank you for applying to Canva!',
      body_cleaned: 'Interest in the iOS Engineer role at Canva.'
    });
    assert.ok(res);
    assert.equal(res.company, 'Canva');
    assert.equal(res.ats_source, 'greenhouse');
  });

  await t.test('routes Lever email to Lever parser', () => {
    const res = parseATSEmail({
      sender: 'no-reply@lever.co',
      subject: 'Thank you for applying to Linear',
      body_cleaned: 'Interest in Linear and for applying for the Growth Engineer position.'
    });
    assert.ok(res);
    assert.equal(res.company, 'Linear');
    assert.equal(res.ats_source, 'lever');
  });

  await t.test('returns null for generic email allowing seamless fallback to Gemini AI', () => {
    const res = parseATSEmail({
      sender: 'recruiter@randomstartup.io',
      subject: 'Let us chat',
      body_cleaned: 'Hey, I liked your portfolio.'
    });
    assert.equal(res, null);
  });

  await t.test('getATSSourceBadge returns correct styling and colors', () => {
    const ghBadge = getATSSourceBadge('greenhouse');
    assert.ok(ghBadge);
    assert.equal(ghBadge.label, 'Greenhouse');

    const leverBadge = getATSSourceBadge('lever');
    assert.ok(leverBadge);
    assert.equal(leverBadge.label, 'Lever');

    assert.equal(getATSSourceBadge('generic'), null);
    assert.equal(getATSSourceBadge(null), null);
  });
});

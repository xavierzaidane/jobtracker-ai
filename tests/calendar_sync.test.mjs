import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatInterviewTitle,
  computeEventTiming,
  buildReminderOverrides,
  buildGoogleCalendarEventPayload,
  generateGoogleAuthUrl,
  resolveSyncConflicts,
  handleApplicationCancellation,
  DEFAULT_CALENDAR_SETTINGS,
} from '../src/lib/googleCalendar/calendar_engine.mjs';

describe('Google Calendar 2-Way Synchronization Engine', () => {
  describe('1. Default Schedule & Reminder Logic (PRD 4.1 & User Decisions)', () => {
    it('uses neutral 10:00 AM default time when email mentions date without specific hour', () => {
      const timing = computeEventTiming('2026-09-20', undefined, '10:00', 45);

      assert.strictEqual(timing.effectiveTime, '10:00');
      assert.strictEqual(timing.isConfirmedTime, false, 'Time must be marked unconfirmed');
      assert.ok(timing.startDateTime.includes('T10:00:00.000Z'), 'Must start at 10:00 UTC');
    });

    it('prepends "[Time TBD]" to title when interview hour is estimated/unconfirmed', () => {
      const title = formatInterviewTitle('Spotify', 'Recruiter Screen', false);
      assert.strictEqual(title, '[Time TBD] Interview - Spotify');
    });

    it('uses standard company and round format when interview hour is confirmed', () => {
      const title = formatInterviewTitle('Spotify', 'Technical Phone', true);
      assert.strictEqual(title, 'Spotify: Technical Phone');
    });

    it('maps configurable reminder minutes into Google Calendar popup overrides', () => {
      const reminders = [15, 30, 1440]; // 15m, 30m, 1d
      const overridesConfig = buildReminderOverrides(reminders);

      assert.strictEqual(overridesConfig.useDefault, false);
      assert.strictEqual(overridesConfig.overrides.length, 3);
      assert.deepStrictEqual(overridesConfig.overrides[0], { method: 'popup', minutes: 15 });
      assert.deepStrictEqual(overridesConfig.overrides[1], { method: 'popup', minutes: 30 });
      assert.deepStrictEqual(overridesConfig.overrides[2], { method: 'popup', minutes: 1440 });
    });

    it('falls back to useDefault: true when reminders list is empty', () => {
      const overridesConfig = buildReminderOverrides([]);
      assert.strictEqual(overridesConfig.useDefault, true);
    });
  });

  describe('2. Event Payload Generation', () => {
    it('builds complete Google Calendar Event resource with warning note for estimated time', () => {
      const rawInterview = {
        company: 'Figma',
        role: 'Senior Frontend Engineer',
        date: '2026-09-22',
        // time is omitted to test fallback!
        interviewer: 'Sarah Connor',
        meeting_url: 'https://meet.google.com/abc-defg-hij',
      };

      const result = buildGoogleCalendarEventPayload(rawInterview, DEFAULT_CALENDAR_SETTINGS);

      assert.strictEqual(result.title, '[Time TBD] Interview - Figma');
      assert.strictEqual(result.payload.summary, '[Time TBD] Interview - Figma');
      assert.ok(result.payload.description.includes('⚠️ This interview time is a default estimate (10:00)'));
      assert.ok(result.payload.description.includes('Sarah Connor'));
      assert.strictEqual(result.payload.location, 'https://meet.google.com/abc-defg-hij');
      assert.strictEqual(result.payload.reminders.overrides.length, 2); // 30m and 1440m
    });

    it('builds confirmed event resource when time is explicitly provided', () => {
      const rawInterview = {
        company: 'Stripe',
        role: 'Staff Infrastructure Engineer',
        date: '2026-09-25',
        time: '15:30',
        round: 'System Design',
      };

      const result = buildGoogleCalendarEventPayload(rawInterview, DEFAULT_CALENDAR_SETTINGS);

      assert.strictEqual(result.title, 'Stripe: System Design');
      assert.strictEqual(result.timing.isConfirmedTime, true);
      assert.ok(result.payload.start.dateTime.includes('T15:30:00.000Z'));
    });
  });

  describe('3. OAuth 2.0 URL Generation', () => {
    it('generates valid Google OAuth URL with calendar.events and offline access type', () => {
      const urlString = generateGoogleAuthUrl(
        'mock-client-id.apps.googleusercontent.com',
        'http://localhost:3000/api/integrations/google-calendar/callback',
        'test_state_123'
      );

      const url = new URL(urlString);
      assert.strictEqual(url.origin, 'https://accounts.google.com');
      assert.strictEqual(url.searchParams.get('client_id'), 'mock-client-id.apps.googleusercontent.com');
      assert.strictEqual(url.searchParams.get('access_type'), 'offline');
      assert.strictEqual(url.searchParams.get('prompt'), 'consent');
      assert.ok(url.searchParams.get('scope').includes('calendar.events'));
      assert.strictEqual(url.searchParams.get('state'), 'test_state_123');
    });
  });

  describe('4. 2-Way Synchronization & Conflict Resolution', () => {
    it('detects external rescheduling on Google Calendar and triggers PULL_FROM_REMOTE', () => {
      const localEvent = {
        id: 'ev-1',
        title: 'Netflix: Coding Assessment',
        date: '2026-09-20',
        time: '14:00',
        last_synced_at: '2026-09-15T10:00:00.000Z',
      };

      // Remote event was modified on Google Calendar 2 hours later
      const remoteGoogleEvent = {
        id: 'gcal_netflix_01',
        summary: 'Netflix: Coding Assessment (Rescheduled)',
        updated: '2026-09-15T12:00:00.000Z', // Newer than localSynced!
        start: {
          dateTime: '2026-09-21T16:00:00.000Z',
        },
      };

      const resolution = resolveSyncConflicts(localEvent, remoteGoogleEvent);

      assert.strictEqual(resolution.action, 'PULL_FROM_REMOTE');
      assert.strictEqual(resolution.updatedFields.date, '2026-09-21');
      assert.strictEqual(resolution.updatedFields.time, '16:00');
    });

    it('triggers DELETE_FROM_REMOTE when application is rejected or cancelled', () => {
      const localEvent = {
        id: 'ev-2',
        google_event_id: 'gcal_airbnb_99',
        company: 'Airbnb',
      };

      const cancellation = handleApplicationCancellation(localEvent);

      assert.strictEqual(cancellation.action, 'DELETE_FROM_REMOTE');
      assert.strictEqual(cancellation.google_event_id, 'gcal_airbnb_99');
    });

    it('returns NO_OP if cancelled event has no Google Calendar link', () => {
      const localEvent = {
        id: 'ev-3',
        google_event_id: null,
      };

      const cancellation = handleApplicationCancellation(localEvent);
      assert.strictEqual(cancellation.action, 'NO_OP');
    });
  });
});


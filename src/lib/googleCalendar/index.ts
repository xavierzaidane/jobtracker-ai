import {
  DEFAULT_CALENDAR_SETTINGS,
  formatInterviewTitle,
  computeEventTiming,
  buildReminderOverrides,
  buildGoogleCalendarEventPayload,
  generateGoogleAuthUrl,
  resolveSyncConflicts,
  handleApplicationCancellation,
} from './calendar_engine.mjs';
import type { CalendarSettings, InterviewEvent, UserIntegration } from '@/types/application';

export {
  DEFAULT_CALENDAR_SETTINGS,
  formatInterviewTitle,
  computeEventTiming,
  buildReminderOverrides,
  buildGoogleCalendarEventPayload,
  generateGoogleAuthUrl,
  resolveSyncConflicts,
  handleApplicationCancellation,
};

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Exchanges authorization code for access & refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Refreshes expired access token using stored refresh_token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Creates an event on Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  payload: any
): Promise<any> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar create event failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Updates an event on Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  payload: any
): Promise<any> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar update event failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Deletes an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (res.status === 404) {
    return true; // Already deleted
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar delete event failed: ${res.status} ${errorText}`);
  }

  return true;
}

/**
 * Lists upcoming events from Google Calendar
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin?: string
): Promise<any[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set('timeMin', timeMin || new Date().toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar list events failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.items || [];
}


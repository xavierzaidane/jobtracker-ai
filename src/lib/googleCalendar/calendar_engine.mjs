/**
 * Google Calendar Sync Engine
 * Shared between Next.js API routes, UI components, and Node.js test runner.
 */

export const DEFAULT_CALENDAR_SETTINGS = {
  default_time: '10:00',
  reminders: [30, 1440], // 30 mins and 1 day (1440 mins) before
  auto_sync: true,
};

/**
 * Formats event title according to confirmation requirement:
 * If time was unspecified, prepend "[Time TBD] Interview - [Company]"
 */
export function formatInterviewTitle(company, round = 'Interview', isConfirmedTime = true) {
  const cleanCompany = (company || 'Company').trim();
  const cleanRound = (round || 'Interview').trim();

  if (!isConfirmedTime) {
    return `[Time TBD] Interview - ${cleanCompany}`;
  }

  return `${cleanCompany}: ${cleanRound}`;
}

/**
 * Computes event start and end Date objects and confirmation status.
 * If time is unspecified, defaults to 10:00 AM local time and marks is_confirmed_time = false.
 */
export function computeEventTiming(dateStr, timeStr, defaultTime = '10:00', durationMinutes = 45) {
  let isConfirmed = true;
  let effectiveTime = timeStr;

  if (!effectiveTime || !effectiveTime.includes(':')) {
    effectiveTime = defaultTime || '10:00';
    isConfirmed = false;
  }

  // Parse YYYY-MM-DD
  const cleanDate = (dateStr || new Date().toISOString().split('T')[0]).split('T')[0];
  const [y, m, d] = cleanDate.split('-').map(Number);
  const [hh, mm] = effectiveTime.split(':').map(Number);

  const startDate = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    isConfirmedTime: isConfirmed,
    effectiveTime,
  };
}

/**
 * Maps minutes array (e.g. [30, 1440]) to Google Calendar reminder overrides
 */
export function buildReminderOverrides(reminders = [30, 1440]) {
  if (!Array.isArray(reminders) || reminders.length === 0) {
    return {
      useDefault: true,
    };
  }

  const overrides = reminders
    .filter((min) => typeof min === 'number' && min > 0)
    .map((minutes) => ({
      method: 'popup',
      minutes,
    }));

  return {
    useDefault: false,
    overrides,
  };
}

/**
 * Builds Google Calendar v3 Event resource payload
 */
export function buildGoogleCalendarEventPayload(interviewEvent, settings = DEFAULT_CALENDAR_SETTINGS) {
  const timing = computeEventTiming(
    interviewEvent.date,
    interviewEvent.time,
    settings.default_time,
    interviewEvent.duration ? parseInt(interviewEvent.duration, 10) || 45 : 45
  );

  const title = formatInterviewTitle(
    interviewEvent.company,
    interviewEvent.round,
    interviewEvent.is_confirmed_time !== undefined ? interviewEvent.is_confirmed_time : timing.isConfirmedTime
  );

  const descriptionLines = [
    `Role: ${interviewEvent.role || 'Unspecified'}`,
    interviewEvent.round ? `Round: ${interviewEvent.round}` : null,
    interviewEvent.interviewer ? `Interviewer: ${interviewEvent.interviewer}` : null,
    interviewEvent.meeting_url ? `Meeting Link: ${interviewEvent.meeting_url}` : null,
    interviewEvent.notes ? `Notes: ${interviewEvent.notes}` : null,
    !timing.isConfirmedTime ? `\n⚠️ This interview time is a default estimate (${timing.effectiveTime}) and needs confirmation from recruiter.` : null,
    '\nSynced autonomously by CareerOps',
  ].filter(Boolean);

  const remindersConfig = buildReminderOverrides(settings.reminders);

  const payload = {
    summary: title,
    description: descriptionLines.join('\n'),
    start: {
      dateTime: timing.startDateTime,
      timeZone: 'UTC',
    },
    end: {
      dateTime: timing.endDateTime,
      timeZone: 'UTC',
    },
    reminders: remindersConfig,
  };

  if (interviewEvent.location || interviewEvent.meeting_url) {
    payload.location = interviewEvent.location || interviewEvent.meeting_url;
  }

  return {
    payload,
    timing,
    title,
  };
}

/**
 * Generates Google OAuth 2.0 Authorization URL
 */
export function generateGoogleAuthUrl(clientId, redirectUri, state) {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ].join(' '),
    state: state || '',
  };

  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

/**
 * Resolves 2-way sync conflict between local CareerOps event and Google Calendar remote event
 */
export function resolveSyncConflicts(localEvent, remoteGoogleEvent) {
  if (!remoteGoogleEvent) {
    return {
      action: 'PUSH_TO_REMOTE',
      reason: 'Event does not exist on Google Calendar yet.',
    };
  }

  if (remoteGoogleEvent.status === 'cancelled') {
    return {
      action: 'MARK_DELETED_LOCAL',
      reason: 'Event was cancelled or deleted directly on Google Calendar.',
    };
  }

  const remoteUpdated = new Date(remoteGoogleEvent.updated || 0).getTime();
  const localSynced = new Date(localEvent.last_synced_at || localEvent.updated_at || 0).getTime();

  // If remote was modified more recently than last local sync (with 2s tolerance buffer)
  if (remoteUpdated > localSynced + 2000) {
    // Google Calendar was updated by user externally
    const startObj = remoteGoogleEvent.start || {};
    const remoteDateTime = startObj.dateTime || startObj.date;

    let updatedTime = localEvent.time;
    let updatedDate = localEvent.date;

    if (remoteDateTime && remoteDateTime.includes('T')) {
      const [dPart, tPart] = remoteDateTime.split('T');
      updatedDate = dPart;
      updatedTime = tPart.slice(0, 5); // "HH:MM"
    } else if (remoteDateTime) {
      updatedDate = remoteDateTime;
    }

    return {
      action: 'PULL_FROM_REMOTE',
      reason: 'Google Calendar event was rescheduled externally.',
      updatedFields: {
        date: updatedDate,
        time: updatedTime,
        title: remoteGoogleEvent.summary || localEvent.title,
        notes: remoteGoogleEvent.description || localEvent.notes,
        location: remoteGoogleEvent.location || localEvent.location,
        is_confirmed_time: true, // If explicitly set on Google Calendar, consider confirmed
      },
    };
  }

  return {
    action: 'PUSH_TO_REMOTE',
    reason: 'Local changes are newer or already up to date.',
  };
}

/**
 * Determines sync action when an application is rejected or deleted
 */
export function handleApplicationCancellation(localEvent) {
  if (!localEvent || !localEvent.google_event_id) {
    return { action: 'NO_OP', reason: 'No Google Calendar event was linked.' };
  }

  return {
    action: 'DELETE_FROM_REMOTE',
    google_event_id: localEvent.google_event_id,
    reason: 'Application was archived, rejected, or deleted from board.',
  };
}


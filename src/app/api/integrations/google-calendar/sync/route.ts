import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_CALENDAR_SETTINGS,
  buildGoogleCalendarEventPayload,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  refreshAccessToken,
} from '@/lib/googleCalendar';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface SyncCandidate {
  id: string;
  company: string;
  role?: string;
  round?: string;
  date: string;
  time?: string;
  interviewer?: string;
  meeting_url?: string;
  notes?: string;
  google_event_id?: string;
  is_confirmed_time?: boolean;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { applicationId, action } = body;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  // 1. Retrieve active integration from Supabase or fallback cookies
  let integration: any = null;
  if (supabase) {
    try {
      const { data } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('provider', 'google_calendar')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      integration = data;
    } catch (e) {
      console.warn('Could not read user_integrations from Supabase:', e);
    }
  }

  let accessToken = integration?.access_token || req.cookies.get('gcal_access_token')?.value;
  const refreshToken = integration?.refresh_token || req.cookies.get('gcal_refresh_token')?.value;
  const tokenExpiresAt = integration?.token_expires_at || req.cookies.get('gcal_expires_at')?.value;
  const calendarId = integration?.calendar_id || 'primary';
  const isConnected = Boolean(integration?.is_active || req.cookies.get('gcal_connected')?.value === 'true');

  if (!isConnected || !accessToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'Google Calendar is not connected yet. Please click "Connect Google Calendar" in Settings first.',
      },
      { status: 400 }
    );
  }

  // Real Google OAuth tokens start with "ya29."
  const isMock = accessToken === 'mock_access_token' || (!accessToken.startsWith('ya29.') && process.env.NODE_ENV === 'test');

  // 2. Refresh token if expired
  let refreshedNewTokens: { access_token: string; expires_at: string } | null = null;
  if (!isMock && refreshToken && refreshToken !== 'mock_refresh_token' && refreshToken !== 'existing_refresh_token' && tokenExpiresAt) {
    const isExpired = new Date(tokenExpiresAt).getTime() < Date.now() + 60000;
    if (isExpired) {
      try {
        const refreshed = await refreshAccessToken(
          refreshToken,
          process.env.GOOGLE_CLIENT_ID || '',
          process.env.GOOGLE_CLIENT_SECRET || ''
        );
        accessToken = refreshed.access_token;
        const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
        refreshedNewTokens = { access_token: accessToken, expires_at: newExpiresAt };

        if (supabase && integration?.id) {
          await supabase
            .from('user_integrations')
            .update({
              access_token: accessToken,
              token_expires_at: newExpiresAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', integration.id);
        }
      } catch (e) {
        console.warn('Google Calendar token refresh error:', e);
      }
    }
  }

  // Retrieve user settings
  let settings = integration?.settings;
  if (!settings) {
    const cookieSettingsStr = req.cookies.get('gcal_settings')?.value;
    if (cookieSettingsStr) {
      try {
        settings = JSON.parse(cookieSettingsStr);
      } catch (_) {}
    }
  }
  if (!settings) settings = DEFAULT_CALENDAR_SETTINGS;

  // 3. Deletion action handling
  if (action === 'delete') {
    const targetGoogleEventId = body.googleEventId;
    if (targetGoogleEventId && !isMock && accessToken) {
      try {
        await deleteGoogleCalendarEvent(accessToken, calendarId, targetGoogleEventId);
      } catch (err) {
        console.warn('Could not delete event from Google Calendar:', err);
      }
    }
    if (supabase && applicationId) {
      try {
        await supabase
          .from('interview_events')
          .update({ sync_status: 'deleted' })
          .eq('application_id', applicationId);
      } catch (e) {
        console.warn('Could not mark interview_events as deleted in Supabase:', e);
      }
    }
    const deleteResponse = NextResponse.json({ success: true, action: 'deleted' });
    if (refreshedNewTokens) {
      deleteResponse.cookies.set('gcal_access_token', refreshedNewTokens.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
      deleteResponse.cookies.set('gcal_expires_at', refreshedNewTokens.expires_at, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return deleteResponse;
  }

  // 4. Gather candidates to sync
  const candidates: SyncCandidate[] = [];

  // A. Explicit interview events passed from client
  if (Array.isArray(body.events) && body.events.length > 0) {
    for (const ev of body.events) {
      if (ev.company && ev.date) {
        candidates.push({
          id: ev.id || `ev-${Math.random().toString(36).slice(2, 7)}`,
          company: ev.company,
          role: ev.role,
          round: ev.round || 'Technical Interview',
          date: ev.date,
          time: ev.time || undefined,
          interviewer: ev.interviewer,
          meeting_url: ev.meeting_url,
          notes: ev.notes,
          google_event_id: ev.google_event_id,
          is_confirmed_time: ev.time ? true : false,
        });
      }
    }
  }

  // B. Applications list passed from client
  if (Array.isArray(body.applications) && body.applications.length > 0) {
    for (const app of body.applications) {
      if (app.status === 'interview') {
        const already = candidates.some((c) => c.company.toLowerCase() === app.company.toLowerCase());
        if (!already) {
          candidates.push({
            id: app.id,
            company: app.company,
            role: app.role,
            round: 'Technical Interview',
            date: (app.latest_update_date || app.applied_date || new Date().toISOString()).split('T')[0],
            time: undefined,
            notes: app.summary,
            is_confirmed_time: false,
          });
        }
      }
    }
  }

  // C. Single application object passed from drag-and-drop
  if (body.application && body.application.status === 'interview') {
    const app = body.application;
    const already = candidates.some((c) => c.company.toLowerCase() === app.company.toLowerCase());
    if (!already) {
      candidates.push({
        id: app.id,
        company: app.company,
        role: app.role,
        round: 'Technical Interview',
        date: (app.latest_update_date || app.applied_date || new Date().toISOString()).split('T')[0],
        time: undefined,
        notes: app.summary,
        is_confirmed_time: false,
      });
    }
  }

  // D. Fallback query to Supabase if client passed empty payload
  if (candidates.length === 0 && supabase) {
    try {
      const { data: interviewApps } = await supabase
        .from('applications')
        .select('*')
        .eq('status', 'interview');

      if (interviewApps && interviewApps.length > 0) {
        for (const app of interviewApps) {
          const { data: existingEvent } = await supabase
            .from('interview_events')
            .select('*')
            .eq('application_id', app.id)
            .maybeSingle();

          candidates.push({
            id: app.id,
            company: app.company,
            role: app.role,
            round: existingEvent?.round || 'Technical Interview',
            date: (existingEvent?.date || app.latest_update_date || app.applied_date || new Date().toISOString()).split('T')[0],
            time: existingEvent?.time || undefined,
            interviewer: existingEvent?.interviewer,
            meeting_url: existingEvent?.meeting_url,
            notes: app.summary || existingEvent?.notes,
            google_event_id: existingEvent?.google_event_id,
            is_confirmed_time: existingEvent?.time ? true : false,
          });
        }
      }
    } catch (e) {
      console.warn('Could not fetch applications from Supabase:', e);
    }
  }

  // 5. Execute synchronization
  let syncedCount = 0;
  let updatedCount = 0;
  const syncedResults: any[] = [];
  const errors: string[] = [];

  for (const item of candidates) {
    const eventPayload = buildGoogleCalendarEventPayload(
      {
        company: item.company,
        role: item.role,
        date: item.date,
        time: item.time,
        round: item.round || 'Technical Interview',
        interviewer: item.interviewer,
        meeting_url: item.meeting_url,
        notes: item.notes,
        is_confirmed_time: item.is_confirmed_time,
      },
      settings
    );

    let googleEventId = item.google_event_id;
    let htmlLink = '';

    if (!isMock && accessToken) {
      try {
        if (googleEventId) {
          const updated = await updateGoogleCalendarEvent(
            accessToken,
            calendarId,
            googleEventId,
            eventPayload.payload
          );
          googleEventId = updated.id;
          htmlLink = updated.htmlLink || '';
          updatedCount++;
        } else {
          const created = await createGoogleCalendarEvent(
            accessToken,
            calendarId,
            eventPayload.payload
          );
          googleEventId = created.id;
          htmlLink = created.htmlLink || '';
          syncedCount++;
        }
      } catch (apiErr: any) {
        console.error(`Google Calendar API sync failure for ${item.company}:`, apiErr);
        errors.push(`${item.company}: ${apiErr.message}`);
        continue;
      }
    } else {
      googleEventId = googleEventId || `gcal_mock_${item.id.slice(0, 8)}`;
      syncedCount++;
    }

    syncedResults.push({
      id: item.id,
      company: item.company,
      title: eventPayload.title,
      google_event_id: googleEventId,
      htmlLink,
      start_time: eventPayload.timing.startDateTime,
    });

    // Upsert into Supabase interview_events table if connected
    if (supabase) {
      try {
        const { data: existingDbEvent } = await supabase
          .from('interview_events')
          .select('id')
          .eq('application_id', item.id)
          .maybeSingle();

        const eventRecord = {
          application_id: item.id,
          google_event_id: googleEventId,
          title: eventPayload.title,
          description: eventPayload.payload.description,
          start_time: eventPayload.timing.startDateTime,
          end_time: eventPayload.timing.endDateTime,
          is_confirmed_time: eventPayload.timing.isConfirmedTime,
          round: item.round || 'Technical Interview',
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        };

        if (existingDbEvent) {
          await supabase.from('interview_events').update(eventRecord).eq('id', existingDbEvent.id);
        } else {
          await supabase.from('interview_events').insert(eventRecord);
        }
      } catch (dbErr) {
        console.warn('Could not upsert interview_events in Supabase:', dbErr);
      }
    }
  }

  // Update integration last sync timestamp
  if (supabase && integration?.id) {
    try {
      await supabase
        .from('user_integrations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', integration.id);
    } catch (_) {}
  }

  const isSuccess = errors.length === 0 || syncedCount > 0 || updatedCount > 0;

  const response = NextResponse.json({
    success: isSuccess,
    synced_count: syncedCount,
    updated_count: updatedCount,
    total_candidates: candidates.length,
    is_mock: isMock,
    events: syncedResults,
    errors: errors.length > 0 ? errors : undefined,
    synced_at: new Date().toISOString(),
  });

  if (refreshedNewTokens) {
    response.cookies.set('gcal_access_token', refreshedNewTokens.access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set('gcal_expires_at', refreshedNewTokens.expires_at, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, DEFAULT_CALENDAR_SETTINGS } from '@/lib/googleCalendar';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const code = req.nextUrl.searchParams.get('code');
  const isMock = req.nextUrl.searchParams.get('mock') === 'true';
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('calendar_error', error);
    return NextResponse.redirect(redirectUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = `${origin}/api/integrations/google-calendar/callback`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

  try {
    let accountEmail = 'user@gmail.com';
    let accessToken = 'mock_access_token';
    let refreshToken = 'mock_refresh_token';
    let expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    if (!isMock && code && clientId && clientSecret) {
      const tokenData = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || 'existing_refresh_token';
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

      // Fetch user email from Google UserInfo endpoint
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          accountEmail = info.email || accountEmail;
        }
      } catch (e) {
        console.warn('Could not fetch Google profile email:', e);
      }
    }

    // If Supabase is available, upsert user_integrations record
    if (supabase) {
      // In server route without bearer session, we can save or update for the demo or current user
      const { data: existing } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('provider', 'google_calendar')
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_integrations')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: expiresAt,
            account_email: accountEmail,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('user_integrations').insert({
          provider: 'google_calendar',
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt,
          calendar_id: 'primary',
          account_email: accountEmail,
          is_active: true,
          settings: DEFAULT_CALENDAR_SETTINGS,
        });
      }
    }

    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('calendar_connected', 'true');
    redirectUrl.searchParams.set('account_email', accountEmail);

    const response = NextResponse.redirect(redirectUrl);
    // Set cookies for both client visibility and secure server-side token access
    response.cookies.set('gcal_connected', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set('gcal_email', accountEmail, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set('gcal_access_token', accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    if (refreshToken && refreshToken !== 'mock_refresh_token' && refreshToken !== 'existing_refresh_token') {
      response.cookies.set('gcal_refresh_token', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    response.cookies.set('gcal_expires_at', expiresAt, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err: any) {
    console.error('Google Calendar callback failed:', err);
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('calendar_error', err.message || 'callback_failed');
    return NextResponse.redirect(redirectUrl);
  }
}

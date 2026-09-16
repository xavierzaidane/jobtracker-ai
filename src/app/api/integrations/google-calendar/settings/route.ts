import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CALENDAR_SETTINGS } from '@/lib/googleCalendar';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  const cookieConnected = req.cookies.get('gcal_connected')?.value === 'true';
  const cookieEmail = req.cookies.get('gcal_email')?.value || 'user@gmail.com';
  let cookieSettings = DEFAULT_CALENDAR_SETTINGS;
  const cookieSettingsStr = req.cookies.get('gcal_settings')?.value;
  if (cookieSettingsStr) {
    try {
      cookieSettings = JSON.parse(cookieSettingsStr);
    } catch (_) {}
  }

  if (!supabase) {
    return NextResponse.json({
      is_connected: cookieConnected,
      account_email: cookieConnected ? cookieEmail : null,
      settings: cookieSettings,
      last_synced_at: null,
    });
  }

  try {
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('provider', 'google_calendar')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!integration) {
      return NextResponse.json({
        is_connected: cookieConnected,
        account_email: cookieConnected ? cookieEmail : null,
        settings: cookieSettings,
        last_synced_at: null,
      });
    }

    return NextResponse.json({
      is_connected: true,
      account_email: integration.account_email || cookieEmail,
      settings: integration.settings || cookieSettings,
      last_synced_at: integration.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({
      is_connected: cookieConnected,
      account_email: cookieConnected ? cookieEmail : null,
      settings: cookieSettings,
      error: err.message,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action, settings } = body;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  const response = NextResponse.json({ success: true, settings });

  if (action === 'disconnect') {
    if (supabase) {
      await supabase
        .from('user_integrations')
        .update({
          is_active: false,
          access_token: null,
          refresh_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('provider', 'google_calendar');
    }
    response.cookies.delete('gcal_connected');
    response.cookies.delete('gcal_email');
    response.cookies.delete('gcal_access_token');
    response.cookies.delete('gcal_refresh_token');
    response.cookies.delete('gcal_expires_at');
    response.cookies.delete('gcal_settings');
    return response;
  }

  if (settings) {
    response.cookies.set('gcal_settings', JSON.stringify(settings), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    if (supabase) {
      await supabase
        .from('user_integrations')
        .update({
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('provider', 'google_calendar');
    }
  }

  return response;
}


import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleAuthUrl } from '@/lib/googleCalendar';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${origin}/api/integrations/google-calendar/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  const demoMode = req.nextUrl.searchParams.get('demo') === 'true';

  // If no GOOGLE_CLIENT_ID is provided in environment or explicitly demo, allow instant mock connection
  if (!clientId || demoMode) {
    const callbackUrl = new URL('/api/integrations/google-calendar/callback', origin);
    callbackUrl.searchParams.set('mock', 'true');
    callbackUrl.searchParams.set('state', req.nextUrl.searchParams.get('state') || 'mock_state');
    return NextResponse.redirect(callbackUrl);
  }

  const state = req.nextUrl.searchParams.get('state') || crypto.randomUUID();
  const authUrl = generateGoogleAuthUrl(clientId, redirectUri, state);

  return NextResponse.redirect(authUrl);
}


import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { JobApplication, TriageEmail, ApplicationStatus, AppNotification, TriageStatus } from '@/types/application';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project.supabase.co')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ==============================================================================
// 1. Supabase Authentication Helpers
// ==============================================================================

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}

// ==============================================================================
// 2. Applications Table CRUD Operations
// ==============================================================================

export async function fetchApplicationsFromSupabase(): Promise<JobApplication[]> {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('latest_update_date', { ascending: false });

  if (error) {
    console.error('Error fetching applications from Supabase:', error);
    throw error;
  }

  return (data || []) as JobApplication[];
}

export async function updateApplicationStatusInSupabase(
  id: string,
  newStatus: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('applications')
    .update({ 
      status: newStatus,
      latest_update_date: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
}

export async function upsertApplicationInSupabase(
  application: Partial<JobApplication>
): Promise<JobApplication | null> {
  if (!supabase) return null;

  if (application.id && !application.id.startsWith('app-') && !application.id.startsWith('demo-')) {
    // Update existing
    const { data, error } = await supabase
      .from('applications')
      .update({
        company: application.company,
        role: application.role,
        status: application.status,
        summary: application.summary,
        sender: application.sender,
        subject: application.subject,
        latest_update_date: new Date().toISOString(),
      })
      .eq('id', application.id)
      .select()
      .single();

    if (error) throw error;
    return data as JobApplication;
  } else {
    // Insert new application
    const { data, error } = await supabase
      .from('applications')
      .insert({
        company: application.company,
        role: application.role,
        status: application.status || 'applied',
        applied_date: application.applied_date || new Date().toISOString(),
        latest_update_date: new Date().toISOString(),
        summary: application.summary || 'Manually added application.',
        sender: application.sender || null,
        subject: application.subject || null,
        history_log: [
          {
            date: new Date().toISOString(),
            status: application.status || 'applied',
            summary: application.summary || 'Application created in dashboard.',
          },
        ],
      })
      .select()
      .single();

    if (error) throw error;
    return data as JobApplication;
  }
}

export async function deleteApplicationFromSupabase(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting application:', error);
    throw error;
  }
}

// ==============================================================================
// 3. AI Triage Inbox Operations
// ==============================================================================

export async function fetchTriageEmailsFromSupabase(): Promise<TriageEmail[]> {
  if (!supabase) return [];

  try {
    // 1. Primary: Try fetching from dedicated triage_inbox table
    const { data: triageData, error: triageError } = await supabase
      .from('triage_inbox')
      .select('*')
      .order('email_date', { ascending: false });

    if (!triageError && triageData && triageData.length > 0) {
      return triageData.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        thread_id: row.thread_id || '',
        message_id: row.message_id || '',
        company: row.company || 'Unknown Company',
        role: row.role || 'Unspecified Role',
        sender: row.sender || 'Unknown Sender',
        subject: row.subject || 'Application Update',
        date: row.email_date || row.created_at || new Date().toISOString(),
        snippet: row.snippet || '',
        raw_body: row.raw_body || '',
        detected_status: (row.detected_status || 'applied') as TriageStatus,
        confidence_score: Number(row.confidence_score) || 0.95,
        ai_rationale: row.ai_rationale || 'Processed by Gemini AI.',
        summary: row.summary || row.snippet || 'Email received.',
        is_approved: Boolean(row.is_approved),
        status: row.status || (row.is_approved ? 'approved' : 'pending'),
      }));
    }

    // 2. Fallback: query application_updates if triage_inbox has not received items yet
    const { data: appsData } = await supabase
      .from('applications')
      .select('*')
      .order('latest_update_date', { ascending: false });

    const applications = (appsData || []) as JobApplication[];
    const appMap = new Map<string, JobApplication>();
    applications.forEach((app) => appMap.set(app.id, app));

    const { data: updatesData } = await supabase
      .from('application_updates')
      .select('*')
      .order('email_date', { ascending: false });

    const triageEmails: TriageEmail[] = [];
    if (updatesData && updatesData.length > 0) {
      for (const update of updatesData) {
        const parentApp = update.application_id ? appMap.get(update.application_id) : undefined;
        triageEmails.push({
          id: update.id,
          application_id: update.application_id || undefined,
          thread_id: update.thread_id || parentApp?.thread_id || '',
          company: parentApp?.company || 'Unknown Company',
          role: parentApp?.role || 'Job Position',
          sender: update.sender || parentApp?.sender || 'Unknown Sender',
          subject: update.subject || parentApp?.subject || 'Application Update',
          date: update.email_date || update.created_at || new Date().toISOString(),
          detected_status: (update.status || parentApp?.status || 'applied') as TriageStatus,
          confidence_score: 0.96,
          ai_rationale: update.summary ? `Gemini AI: "${update.summary}"` : 'Classified by Gemini AI.',
          summary: update.summary || parentApp?.summary || 'Email update received.',
          is_approved: false,
          status: 'pending',
        });
      }
    }

    return triageEmails;
  } catch (err) {
    console.error('Failed to fetch triage emails from Supabase:', err);
    return [];
  }
}

export async function approveTriageEmailInSupabase(
  email: TriageEmail,
  overrideStatus?: ApplicationStatus
): Promise<JobApplication | null> {
  if (!supabase) return null;

  const targetStatus = overrideStatus || (email.detected_status === 'unparsed' ? 'applied' : (email.detected_status as ApplicationStatus));

  // 1. Upsert into applications table
  const app = await upsertApplicationInSupabase({
    company: email.company,
    role: email.role,
    status: targetStatus,
    summary: email.summary,
    sender: email.sender,
    subject: email.subject,
    thread_id: email.thread_id,
  });

  // 2. Mark triage_inbox record as approved
  try {
    await supabase
      .from('triage_inbox')
      .update({
        is_approved: true,
        status: 'approved',
        detected_status: targetStatus,
      })
      .eq('id', email.id);
  } catch (err) {
    console.warn('Could not update triage_inbox status:', err);
  }

  return app;
}

export async function dismissTriageEmailInSupabase(id: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('triage_inbox')
      .update({
        status: 'dismissed',
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Could not dismiss triage_inbox item:', err);
  }
}

// ==============================================================================
// 4. Notifications Operations
// ==============================================================================

export async function fetchNotificationsFromSupabase(): Promise<AppNotification[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications from Supabase:', error);
    return [];
  }

  return (data || []) as AppNotification[];
}

export async function markNotificationAsReadInSupabase(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function markAllNotificationsAsReadInSupabase(): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { JobApplication } from '@/types/application';

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
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Database helper functions
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

  if (application.id && !application.id.startsWith('app-')) {
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
            summary: application.summary || 'Application manually created in dashboard.',
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


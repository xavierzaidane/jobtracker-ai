export type ApplicationStatus = 'applied' | 'reply' | 'interview' | 'offer' | 'rejected';

export type TriageStatus = ApplicationStatus | 'unparsed';

export type ActiveView = 'board' | 'calendar' | 'analytics' | 'inbox';

export type ATSSource =
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'icims'
  | 'ashby'
  | 'smartrecruiters'
  | 'generic'
  | 'manual';

export interface ATSMetadata {
  ats_source?: ATSSource;
  candidate_id?: string;
  job_req_id?: string;
  portal_url?: string;
  matched_signature?: string;
  extracted_by?: 'ats_template' | 'gemini_llm' | 'manual';
  [key: string]: any;
}

export interface CalendarSettings {
  default_time: string; // e.g. "10:00"
  reminders: number[]; // minutes before event, e.g. [30, 1440]
  auto_sync: boolean;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  provider: 'google_calendar' | 'discord' | 'telegram';
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  calendar_id: string;
  account_email?: string | null;
  is_active: boolean;
  settings: CalendarSettings;
  created_at?: string;
  updated_at?: string;
}

export interface InterviewEvent {
  id: string;
  user_id?: string;
  application_id?: string;
  google_event_id?: string | null;
  company: string;
  role: string;
  round: 'Recruiter Screen' | 'Technical Phone' | 'System Design' | 'Coding Assessment' | 'Behavioral' | 'Executive Round' | string;
  date: string; // ISO string or YYYY-MM-DD
  time?: string; // e.g. "14:00"
  duration?: string; // e.g. "45m"
  is_confirmed_time?: boolean;
  interviewer?: string;
  meeting_url?: string;
  location?: string;
  notes?: string;
  sync_status?: 'synced' | 'pending' | 'failed' | 'deleted';
  last_synced_at?: string;
}

export interface TriageEmail {
  id: string;
  user_id?: string;
  application_id?: string;
  thread_id: string;
  message_id?: string;
  company: string;
  role: string;
  sender: string;
  subject: string;
  date: string;
  snippet?: string;
  raw_body?: string;
  detected_status: TriageStatus;
  confidence_score: number; // e.g. 0.96
  ai_rationale: string;
  summary: string;
  is_approved: boolean;
  status?: 'pending' | 'approved' | 'dismissed';
  ats_source?: ATSSource;
  ats_metadata?: ATSMetadata;
}

export interface AppNotification {
  id: string;
  user_id?: string;
  application_id?: string | null;
  title: string;
  message: string;
  status: ApplicationStatus;
  company: string;
  role: string;
  sender?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface HistoryLogEntry {
  date: string;
  status: ApplicationStatus;
  summary?: string;
  subject?: string;
  sender?: string;
}

export interface JobApplication {
  id: string;
  user_id?: string;
  thread_id?: string | null;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date: string;
  latest_update_date: string;
  sender?: string | null;
  subject?: string | null;
  summary?: string | null;
  history_log?: HistoryLogEntry[] | null;
  ats_source?: ATSSource;
  ats_metadata?: ATSMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface ColumnDefinition {
  id: ApplicationStatus;
  title: string;
  color: string;
  bgLight: string;
  borderLight: string;
  darkBg: string;
  darkBorder: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}

export const COLUMNS: ColumnDefinition[] = [
  {
    id: 'applied',
    title: 'Applied',
    color: '#9333ea',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    darkBg: 'dark:bg-purple-950/20',
    darkBorder: 'dark:border-purple-900/40',
    badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    badgeText: 'text-purple-700 dark:text-purple-300',
    icon: 'FileText',
  },
  {
    id: 'reply',
    title: 'Recruiter Reply',
    color: '#eab308',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    darkBg: 'dark:bg-amber-950/20',
    darkBorder: 'dark:border-amber-900/40',
    badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    badgeText: 'text-amber-700 dark:text-amber-300',
    icon: 'MessageSquare',
  },
  {
    id: 'interview',
    title: 'Interview',
    color: '#3b82f6',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    darkBg: 'dark:bg-blue-950/20',
    darkBorder: 'dark:border-blue-900/40',
    badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    badgeText: 'text-blue-700 dark:text-blue-300',
    icon: 'Calendar',
  },
  {
    id: 'offer',
    title: 'Offer Received',
    color: '#22c55e',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-950/20',
    darkBorder: 'dark:border-emerald-900/40',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    icon: 'Award',
  },
  {
    id: 'rejected',
    title: 'Not Selected',
    color: '#ef4444',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    darkBg: 'dark:bg-rose-950/20',
    darkBorder: 'dark:border-rose-900/40',
    badgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    badgeText: 'text-rose-700 dark:text-rose-300',
    icon: 'XCircle',
  },
];

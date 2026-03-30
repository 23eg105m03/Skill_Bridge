import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ttzfuorzjumllxiidavm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0emZ1b3J6anVtbGx4aWlkYXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTQxMDQsImV4cCI6MjA5MDE3MDEwNH0.ZlIH1GhZeKfCXmooRLrR9BHs6_gHsxW26wWzevPmto8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Database = {
  profiles: {
    id: string;
    name: string;
    bio: string;
    account_type: 'student' | 'admin';
    rating: number;
    status: 'active' | 'suspended';
    created_at: string;
  };
  skills: {
    id: string;
    user_id: string;
    name: string;
    type: 'offer' | 'want';
    created_at: string;
  };
  swap_requests: {
    id: string;
    sender_id: string;
    receiver_id: string;
    skill_wanted: string;
    skill_offered: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
  };
  notes: {
    id: string;
    owner_id: string;
    title: string;
    file_type: string;
    file_path: string | null;
    shared_with: string[];
    created_at: string;
  };
  voice_messages: {
    id: string;
    sender_id: string;
    receiver_id: string | null;
    file_path: string;
    duration: number;
    created_at: string;
  };
};

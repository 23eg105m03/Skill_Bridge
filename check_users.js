import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ttzfuorzjumllxiidavm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0emZ1b3J6anVtbGx4aWlkYXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTQxMDQsImV4cCI6MjA5MDE3MDEwNH0.ZlIH1GhZeKfCXmooRLrR9BHs6_gHsxW26wWzevPmto8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUsers() {
  const { data, error } = await supabase.from('profiles').select('id, name').limit(5);
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('Test Users:', data);
}

checkUsers();

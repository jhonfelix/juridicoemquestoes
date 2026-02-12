import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://deifqjfoggneqsffwrpp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaWZxamZvZ2duZXFzZmZ3cnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTM5NDUsImV4cCI6MjA4NTg4OTk0NX0.zqes44BuDpH9WXo-m4AXJhzEZ45cfF6PB-BWhUVAcC0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
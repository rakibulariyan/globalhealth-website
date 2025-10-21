// Supabase Configuration
const SUPABASE_URL = "https://thafuidnlhguimzcvhgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWZ1aWRubGhndWltemN2aGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTQ4NTUsImV4cCI6MjA3NjQ3MDg1NX0.TOXskJVU5dsg37pUeHcOKzL0TjasS_zZ594glfmUYbk";

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase initialized');
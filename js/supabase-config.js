// ✅ Supabase Configuration with Auth Persistence
const SUPABASE_URL = "https://thafuidnlhguimzcvhgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWZ1aWRubGhndWltemN2aGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTQ4NTUsImV4cCI6MjA3NjQ3MDg1NX0.TOXskJVU5dsg37pUeHcOKzL0TjasS_zZ594glfmUYbk";

// ✅ Initialize Supabase client with persisted session
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage // ensures the login state stays after refresh
  }
});

// ✅ Expose globally
window.supabase = supabase;

console.log("Supabase initialized with Auth session support");

// ✅ Keep session refreshed & active
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event);
  if (session) {
    console.log("Authenticated as:", session.user.email);
  }
});

// Supabase Configuration
// TODO: Replace with your actual Supabase project credentials
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // 예: https://xxxxxxxxxxxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Supabase 프로젝트의 anon public key
};

// Initialize Supabase client
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

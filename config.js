// Supabase Configuration
// TODO: Replace with your actual Supabase project credentials
const SUPABASE_CONFIG = {
    url: 'https://iswwjhrmswcxbpctgzyj.supabase.co', // 예: https://xxxxxxxxxxxxx.supabase.co
    anonKey: 'sb_publishable_m5c_aT_bw-HECc__kgkeqQ_V0-MOtLH' // Supabase 프로젝트의 anon public key
};

// Initialize Supabase client
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

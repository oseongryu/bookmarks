// Export the Supabase client instance as initialized primarily by config.js
// config.js ensures the client is created and assigned to window.supabaseClient AND window.supabase.

if (!window.supabaseClient && !window.supabase) {
    console.error('Supabase client not initialized. Ensure config.js is loaded correctly.');
}

export const supabase = window.supabaseClient || window.supabase;

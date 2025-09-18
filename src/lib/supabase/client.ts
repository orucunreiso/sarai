// Supabase client wrapper for database operations
import { createSupabaseClient } from '@/lib/supabase';

// Export the createClient function that's expected by other modules
export const createClient = createSupabaseClient;

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(
  config.supabaseUrl || 'https://unconfigured.supabase.co',
  config.supabaseKey || 'unconfigured',
  { auth: {
    storage: AsyncStorage, autoRefreshToken: true, persistSession: true,
    detectSessionInUrl: false, flowType: 'pkce', lock: processLock,
  } },
);

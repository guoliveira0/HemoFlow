import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const supabaseUrl = 'https://qoczucgjlvppdtimkhog.supabase.co'
const supabaseAnonKey = 'sb_publishable_u4u9hlWEmnQ2nlif-a92pQ_xJuGRd_x'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
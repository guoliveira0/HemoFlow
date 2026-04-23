import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const supabaseUrl = 'https://qoczucgjlvppdtimkhog.supabase.co'
const supabaseAnonKey = 'sb_publishable_u4u9hlWEmnQ2nlif-a92pQ_xJuGRd_x'

// Adapter para salvar a sessão do usuário com segurança
const ExpoSecureStoreAdapter = {
  getItem: (key) => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.getItem(key));
    return SecureStore.getItemAsync(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.setItem(key, value));
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === 'web') return Promise.resolve(localStorage.removeItem(key));
    return SecureStore.deleteItemAsync(key);
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
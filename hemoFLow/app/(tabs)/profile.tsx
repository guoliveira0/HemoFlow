import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      checkAdminStatus();
    }
  }, [session]);

  async function checkAdminStatus() {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session?.user?.id)
      .single();
      
    if (!error && data) {
      setIsAdmin(data.is_admin);
    }
    setLoadingProfile(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loadingProfile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>
      <Text style={styles.info}>Conectado como: {session?.user?.email}</Text>
      
      {isAdmin && (
        <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/(admin)/index')}>
          <Text style={styles.adminButtonText}>Acessar Painel Admin</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  adminButton: {
    backgroundColor: '#0056b3',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D32F2F',
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  }
});

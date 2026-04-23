import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Erro no login', error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HemoFlow</Text>
      <Text style={styles.subtitle}>Faça login para continuar</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@endereco.com"
          autoCapitalize={'none'}
        />
        <TextInput
          style={styles.input}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Sua senha"
          autoCapitalize={'none'}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, { opacity: loading ? 0.7 : 1 }]} 
        disabled={loading} 
        onPress={signInWithEmail}
      >
        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#D32F2F', textAlign: 'center', marginTop: 10 }
});

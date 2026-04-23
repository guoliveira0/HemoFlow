import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, Text, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [sexo, setSexo] = useState('');
  const [cidade, setCidade] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  async function signUpWithEmail() {
    if (!nome || !tipoSanguineo || !sexo || !cidade) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos do perfil.');
      return;
    }

    setLoading(true);
    
    // 1. Criar o usuário Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      Alert.alert('Erro no cadastro', authError.message);
      setLoading(false);
      return;
    }

    // 2. Inserir o perfil na tabela `profiles`
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          nome,
          tipo_sanguineo: tipoSanguineo,
          sexo,
          cidade
        }
      ]);

      if (profileError) {
        Alert.alert('Erro ao criar perfil', profileError.message);
      } else {
        Alert.alert('Sucesso', 'Cadastro realizado com sucesso! Faça login.');
        router.back();
      }
    }
    
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastre-se</Text>
      
      <TextInput style={styles.input} onChangeText={setEmail} value={email} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} onChangeText={setPassword} value={password} secureTextEntry placeholder="Senha" autoCapitalize="none" />
      <TextInput style={styles.input} onChangeText={setNome} value={nome} placeholder="Nome Completo" />
      <TextInput style={styles.input} onChangeText={setTipoSanguineo} value={tipoSanguineo} placeholder="Tipo Sanguíneo (ex: O-, A+)" />
      <TextInput style={styles.input} onChangeText={setSexo} value={sexo} placeholder="Sexo (ex: devidamente preenchido)" />
      <TextInput style={styles.input} onChangeText={setCidade} value={cidade} placeholder="Cidade onde reside" />
      
      <TouchableOpacity style={[styles.button, { opacity: loading ? 0.7 : 1 }]} disabled={loading} onPress={signUpWithEmail}>
        <Text style={styles.buttonText}>{loading ? 'Cadastrando...' : 'Criar Conta'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Já tem conta? Voltar ao Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 30 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#666', textAlign: 'center', marginTop: 20 }
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function CreateAlertScreen() {
  const router = useRouter();
  const [hemocentro, setHemocentro] = useState('');
  const [cidade, setCidade] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [nivel, setNivel] = useState('urgente');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!hemocentro || !cidade || !tipoSanguineo) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios (Hemocentro, Cidade e Tipo Sanguíneo).');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('alertas').insert([
      {
        hemocentro,
        cidade,
        tipo_sanguineo: tipoSanguineo,
        nivel_critico: nivel,
        ativo: true
      }
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível criar o alerta: ' + error.message);
    } else {
      Alert.alert('Sucesso', 'Alerta criado com sucesso!');
      router.back();
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nome do Hemocentro *</Text>
      <TextInput style={styles.input} onChangeText={setHemocentro} value={hemocentro} placeholder="Ex: Hemocentro de São Paulo" />

      <Text style={styles.label}>Cidade *</Text>
      <TextInput style={styles.input} onChangeText={setCidade} value={cidade} placeholder="Ex: São Paulo" />

      <Text style={styles.label}>Tipo Sanguíneo Necessário *</Text>
      <TextInput style={styles.input} onChangeText={setTipoSanguineo} value={tipoSanguineo} placeholder="Ex: O-, A+, Todos" />

      <Text style={styles.label}>Nível Crítico</Text>
      <TextInput style={styles.input} onChangeText={setNivel} value={nivel} placeholder="urgente, alerta, ou normal" />

      <TouchableOpacity style={[styles.button, { opacity: loading ? 0.7 : 1 }]} disabled={loading} onPress={handleCreate}>
        <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Criar Alerta'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 20 },
  button: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [sexo, setSexo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      loadProfileData();
    }
  }, [session]);

  async function loadProfileData() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, tipo_sanguineo, sexo, cidade, telefone')
        .eq('id', session?.user?.id)
        .single();
        
      if (data) {
        setNome(data.nome || '');
        setTipoSanguineo(data.tipo_sanguineo || '');
        setSexo(data.sexo || '');
        setCidade(data.cidade || '');
        setTelefone(data.telefone || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!nome) {
      Alert.alert('Atenção', 'O nome não pode ficar vazio.');
      return;
    }

    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        nome,
        tipo_sanguineo: tipoSanguineo,
        sexo,
        cidade,
        telefone,
      })
      .eq('id', session?.user?.id);

    setSaving(false);

    if (error) {
      Alert.alert('Erro ao atualizar', error.message);
    } else {
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          
          <View style={styles.formCard}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput 
                style={styles.input} 
                value={nome} 
                onChangeText={setNome} 
                placeholder="Seu nome completo"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput 
                style={styles.input} 
                value={cidade} 
                onChangeText={setCidade} 
                placeholder="Ex: São Paulo"
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput 
                style={styles.input} 
                value={telefone} 
                onChangeText={setTelefone} 
                placeholder="Ex: (11) 99999-9999"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo Sanguíneo</Text>
              <TextInput 
                style={styles.input} 
                value={tipoSanguineo} 
                onChangeText={setTipoSanguineo} 
                placeholder="Ex: O+, A-, AB+"
                placeholderTextColor="#888"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sexo</Text>
              <TextInput 
                style={styles.input} 
                value={sexo} 
                onChangeText={setSexo} 
                placeholder="Ex: Masculino, Feminino"
                placeholderTextColor="#888"
              />
            </View>

          </View>

          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#1E1E1E', 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: { 
    backgroundColor: '#B71C1C', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 20 
  },
  backBtn: {
    width: 40,
  },
  headerTitle: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  container: { 
    flex: 1, 
  },
  formCard: { 
    backgroundColor: '#2A2A2A', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 20 
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: { 
    color: '#AAA', 
    fontSize: 14, 
    marginBottom: 8,
    fontWeight: 'bold'
  },
  input: { 
    height: 50, 
    backgroundColor: '#333', 
    borderColor: '#444', 
    borderWidth: 1, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    color: '#FFF',
    fontSize: 16
  },
  saveButton: { 
    backgroundColor: '#D32F2F', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    marginVertical: 10
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});
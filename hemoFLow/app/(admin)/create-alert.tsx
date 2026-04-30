import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function CreateAlertScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [hemocentro, setHemocentro] = useState('');
  const [cidade, setCidade] = useState('Montes Claros'); // Pode ser pego do perfil
  const [tipoSanguineo, setTipoSanguineo] = useState('O-');
  const [nivel, setNivel] = useState('Urgente');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Busca a cidade do usuário logado para preencher a notificação do footer
    async function loadCity() {
      if (session?.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('cidade')
          .eq('id', session.user.id)
          .single();
        if (data?.cidade) {
          setCidade(data.cidade);
        }
      }
    }
    loadCity();
  }, [session]);

  async function handleCreate() {
    if (!hemocentro || !tipoSanguineo) {
      Alert.alert('Erro', 'Preencha o Tipo Sanguíneo e o Hemocentro.');
      return;
    }

    setLoading(true);
    // Insere o alerta na base de dados
    const { error } = await supabase.from('alertas').insert([
      {
        criado_por: session?.user?.id,
        hospital: hemocentro,
        cidade: cidade || 'Local desconhecido',
        tipo_sanguineo: tipoSanguineo,
        urgencia: nivel,
        mensagem: mensagem,
        ativo: true
      }
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível publicar o alerta: ' + error.message);
    } else {
      router.back();
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.redBackground}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alertas</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Título do Card */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Criar alerta de urgência</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Seleção do Tipo Sanguíneo */}
          <Text style={styles.label}>Tipo sanguíneo necessário</Text>
          <View style={styles.bloodTypeGrid}>
            {bloodTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeButton,
                  tipoSanguineo === type && styles.bloodTypeButtonActive
                ]}
                onPress={() => setTipoSanguineo(type)}
              >
                <Text style={[
                  styles.bloodTypeText,
                  tipoSanguineo === type && styles.bloodTypeTextActive
                ]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hospital / Hemocentro */}
          <Text style={styles.label}>Hospital / hemocentro</Text>
          <TextInput 
            style={styles.input} 
            onChangeText={setHemocentro} 
            value={hemocentro} 
            placeholder="Ex: Santa Casa de Montes Claros" 
            placeholderTextColor="#888"
          />

          {/* Nível de Urgência */}
          <Text style={styles.label}>Urgência</Text>
          <View style={styles.urgencyRow}>
            <TouchableOpacity 
              style={[styles.urgencyButton, nivel === 'Urgente' && styles.urgencyButtonActive]}
              onPress={() => setNivel('Urgente')}
            >
              <Text style={[styles.urgencyText, nivel === 'Urgente' && styles.urgencyTextActive]}>Urgente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.urgencyButton, nivel === 'Moderado' && styles.urgencyButtonActive]}
              onPress={() => setNivel('Moderado')}
            >
              <Text style={[styles.urgencyText, nivel === 'Moderado' && styles.urgencyTextActive]}>Moderado</Text>
            </TouchableOpacity>
          </View>

          {/* Mensagem Opcional */}
          <Text style={styles.label}>Mensagem (opcional)</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            onChangeText={setMensagem} 
            value={mensagem} 
            placeholder="Conte um pouco sobre a situação para sensibilizar os doadores..." 
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Botão Salvar */}
          <TouchableOpacity 
            style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]} 
            disabled={loading} 
            onPress={handleCreate}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Publicando...' : 'Publicar alerta ↗'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Doadores de {tipoSanguineo} em {cidade} serão notificados
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  redBackground: {
    backgroundColor: '#B71C1C',
    height: 140, // Espaço simulado do topo vermelho para a sobreposição
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 80, // Dá a ilusão de estar subindo na faixa vermelha
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  label: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  bloodTypeButton: {
    width: '48%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  bloodTypeButtonActive: {
    backgroundColor: '#FDECEA',
    borderColor: '#C62828',
  },
  bloodTypeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bloodTypeTextActive: {
    color: '#C62828',
  },
  input: {
    backgroundColor: 'transparent',
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    color: '#FFF',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
  urgencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urgencyButton: {
    width: '48%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  urgencyButtonActive: {
    backgroundColor: '#FDECEA',
    borderColor: '#FDECEA',
  },
  urgencyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  urgencyTextActive: {
    color: '#C62828',
  },
  submitButton: {
    backgroundColor: '#B71C1C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 12,
  }
});

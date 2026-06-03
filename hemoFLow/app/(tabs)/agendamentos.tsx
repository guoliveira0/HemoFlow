import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { criarAgendamento, cancelarAgendamento } from '../../src/lib/agendamentos';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AgendamentosScreen() {
  const { session } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hemocentro, setHemocentro] = useState('Hemocentro Regional de Montes Claros');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadAgendamentos();
    }
  }, [session]);

  const loadAgendamentos = async () => {
    setLoading(true);
    const user = session?.user;
    if (user) {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', user.id)
        .order('data_agendamento', { ascending: false })
        .order('horario', { ascending: false });

      if (data) setAgendamentos(data);
    }
    setLoading(false);
  };

  const handleCreateAgendamento = async () => {
    setSubmitting(true);
    try {
      const dataFormatted = date.toISOString().split('T')[0];
      const horarioFormatted = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

      await criarAgendamento({
        hemocentro,
        data: dataFormatted,
        horario: horarioFormatted,
      });

      Alert.alert("Sucesso", "Agendamento marcado e lembretes criados com sucesso!");
      setShowForm(false);
      await loadAgendamentos();
    } catch (e: any) {
      Alert.alert("Aviso", e.message || "Não foi possível realizar o agendamento.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAgendamento = (agendamentoId: string) => {
    Alert.alert(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar esta doação?",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await cancelarAgendamento(agendamentoId);
              Alert.alert("Agendamento Cancelado", "Notificações foram removidas.");
              await loadAgendamentos();
            } catch (e: any) {
              Alert.alert("Erro", "Não foi possível cancelar.");
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Agendamentos</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        {showForm ? (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Novo Agendamento</Text>

            <Text style={styles.label}>Local</Text>
            <View style={styles.inputBox}>
              <Ionicons name="location-outline" size={20} color="#AAA" />
              <Text style={styles.inputText}>{hemocentro}</Text>
            </View>

            <Text style={styles.label}>Data da Doação</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#AAA" />
              <Text style={styles.inputText}>{date.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event: any, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            <Text style={styles.label}>Horário</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#AAA" />
              <Text style={styles.inputText}>
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event: any, selectedTime?: Date) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedTime) setTime(selectedTime);
                }}
              />
            )}

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowForm(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleCreateAgendamento}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.addButtonText}>Agendar Nova Doação</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Histórico</Text>

              {loading ? (
                <ActivityIndicator size="large" color="#B71C1C" style={{ marginTop: 40 }} />
              ) : agendamentos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar" size={50} color="#444" />
                  <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
                </View>
              ) : (
                agendamentos.map((ag) => {
                  const dataFormatada = new Date(ag.data_agendamento + 'T00:00:00').toLocaleDateString('pt-BR');
                  const isPendente = ag.status === 'pendente';
                  const isCancelado = ag.status === 'cancelado';

                  return (
                    <View key={ag.id} style={[styles.card, isCancelado && { opacity: 0.6 }]}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.dataText}>{dataFormatada} às {ag.horario}</Text>
                        <View style={[
                          styles.statusBadge,
                          isPendente ? styles.statusPendente : isCancelado ? styles.statusCancelado : styles.statusConcluido
                        ]}>
                          <Text style={[
                            styles.statusText,
                            isPendente ? styles.statusTextPendente : isCancelado ? styles.statusTextCancelado : styles.statusTextConcluido
                          ]}>{ag.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.localText}>{ag.hemocentro}</Text>
                      
                      {isPendente && (
                        <TouchableOpacity style={styles.cancelarCardBtn} onPress={() => handleCancelAgendamento(ag.id)}>
                          <Text style={styles.cancelarCardBtnText}>Cancelar Agendamento</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1E1E1E', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { backgroundColor: '#B71C1C', paddingHorizontal: 20, paddingVertical: 20, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  container: { flex: 1 },
  addButton: { flexDirection: 'row', backgroundColor: '#B71C1C', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#888', marginTop: 10, fontSize: 16 },
  card: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dataText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  localText: { color: '#AAA', fontSize: 14, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  statusPendente: { backgroundColor: '#FFF8E1' },
  statusTextPendente: { color: '#F57F17' },
  statusConcluido: { backgroundColor: '#E8F5E9' },
  statusTextConcluido: { color: '#2E7D32' },
  statusCancelado: { backgroundColor: '#FFEBEE' },
  statusTextCancelado: { color: '#D32F2F' },
  cancelarCardBtn: { marginTop: 16, borderWidth: 1, borderColor: '#666', padding: 10, borderRadius: 8, alignItems: 'center' },
  cancelarCardBtnText: { color: '#FFF', fontWeight: 'bold' },
  formContainer: { backgroundColor: '#2A2A2A', padding: 20, borderRadius: 12 },
  label: { color: '#CCC', marginBottom: 8, fontSize: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 12, borderRadius: 8, marginBottom: 20 },
  inputText: { color: '#FFF', fontSize: 16, marginLeft: 10 },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelButton: { flex: 1, padding: 14, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#666', borderRadius: 8 },
  cancelButtonText: { color: '#FFF', fontWeight: 'bold' },
  submitButton: { flex: 1, padding: 14, alignItems: 'center', marginLeft: 8, backgroundColor: '#B71C1C', borderRadius: 8 },
  submitButtonText: { color: '#FFF', fontWeight: 'bold' },
});

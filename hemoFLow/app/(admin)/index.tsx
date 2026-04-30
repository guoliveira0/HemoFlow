import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAlertas();
  }, []);

  async function carregarAlertas() {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlertas(data);
    }
    setLoading(false);
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.hospital} - {item.cidade}</Text>
      <Text style={styles.cardText}>Tipo Sanguíneo: <Text style={styles.bold}>{item.tipo_sanguineo}</Text></Text>
      <Text style={styles.cardText}>Nível: {item.urgencia}</Text>
      <Text style={styles.cardStatus}>{item.ativo ? "🟢 Ativo" : "🔴 Inativo"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciar Alertas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(admin)/create-alert')}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" />
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum alerta registrado até o momento.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  addButton: { backgroundColor: '#D32F2F', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardText: { fontSize: 14, color: '#555', marginBottom: 3 },
  bold: { color: '#D32F2F', fontWeight: 'bold' },
  cardStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 10 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 }
});

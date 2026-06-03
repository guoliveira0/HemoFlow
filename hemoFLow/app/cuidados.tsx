import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Platform, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CuidadosScreen() {
  const router = useRouter();

  const preDoacaoInfo = [
    { id: '1', text: 'Hidrate-se bem e consuma alimentos leves!', icon: 'water-outline' },
    { id: '2', text: 'Não é permitido realizar a doação em jejum.', icon: 'restaurant-outline' },
  ];

  const posDoacaoInfo = [
    { id: '1', text: 'Permaneça no Banco de Sangue por mais 15 minutos para evitar que você se sinta mal com a doação.', icon: 'time-outline' },
    { id: '2', text: 'Manter o curativo por pelo menos 4 horas.', icon: 'medkit-outline' },
    { id: '3', text: 'Não ingerir bebidas alcoólicas.', icon: 'wine-outline' },
    { id: '4', text: 'Não fumar por 2 horas.', icon: 'flame-outline' },
    { id: '5', text: 'Evitar esforço físico exagerado por 12 horas, especialmente com o braço utilizado para a doação.', icon: 'barbell-outline' },
    { id: '6', text: 'Ingerir bastante líquido.', icon: 'beaker-outline' },
    { id: '7', text: 'Se for dirigir veículo automotor ou ser transportado em motocicleta, parar imediatamente o veículo em caso de mal-estar.', icon: 'car-outline' },
    { id: '8', text: 'Na ocorrência de febre, diarreia ou outro sintoma de doença infecciosa até 7 dias após a doação, comunicar imediatamente o Hemocentro.', icon: 'warning-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guia de Doação</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        
        {/* Informativo: Por que doar? */}
        <View style={styles.introCard}>
          <View style={styles.introHeaderRow}>
            <Ionicons name="heart" size={28} color="#D32F2F" />
            <Text style={styles.introTitle}>Doe sangue, salve vidas!</Text>
          </View>
          <Text style={styles.introText}>
            O sangue é essencial para os atendimentos de urgências, realização de cirurgias de grande porte e tratamento em pessoas com doença falciforme e talassemias, além de doenças oncológicas variadas. É muito importante manter os estoques sempre abastecidos.
          </Text>
        </View>

        {/* Pré doação */}
        <Text style={styles.sectionTitle}>Cuidados Pré Doação</Text>
        <View style={styles.listContainer}>
          {preDoacaoInfo.map((item, index) => (
            <View key={item.id} style={[styles.listItem, index === preDoacaoInfo.length - 1 && styles.noBorder]}>
              <View style={styles.iconBoxPrimary}>
                <Ionicons name={item.icon as any} size={22} color="#FFF" />
              </View>
              <Text style={styles.listText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Pós doação */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Cuidados Pós Doação</Text>
        <View style={styles.listContainer}>
          {posDoacaoInfo.map((item, index) => (
            <View key={item.id} style={[styles.listItem, index === posDoacaoInfo.length - 1 && styles.noBorder]}>
              <View style={styles.iconBoxSecondary}>
                <Ionicons name={item.icon as any} size={22} color="#D32F2F" />
              </View>
              <Text style={styles.listText}>{item.text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
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
  introCard: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BF360C',
    marginLeft: 10,
    flex: 1,
  },
  introText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  listContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  iconBoxPrimary: {
    backgroundColor: '#D32F2F',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconBoxSecondary: {
    backgroundColor: '#FFEBEE',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  }
});
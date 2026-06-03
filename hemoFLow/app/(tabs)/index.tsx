import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';

export default function TabOneScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Data States
  const [totalDonations, setTotalDonations] = useState(0);
  const [daysSinceDonation, setDaysSinceDonation] = useState<string | number>('-');
  const [isApto, setIsApto] = useState(true);
  const [progressPercent, setProgressPercent] = useState('100%');
  const [lastDonationDateText, setLastDonationDateText] = useState('Nunca');
  const [nextDonationDateText, setNextDonationDateText] = useState('Hoje');

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        loadData();
      }
    }, [session])
  );

  const loadData = async () => {
    setLoading(true);
    
    // Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user?.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      
      // Calculate donation dates and availability
      if (profileData.ultima_doacao) {
        // T00:00:00 to avoid timezone offset issues locally
        const lastDate = new Date(profileData.ultima_doacao + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        setDaysSinceDonation(diffDays);

        const isFemale = profileData.sexo?.toLowerCase()?.startsWith('f');
        const daysRequired = isFemale ? 90 : 60;
        
        setIsApto(diffDays >= daysRequired);

        // Format rules
        const formatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
        setLastDonationDateText(formatter.format(lastDate));

        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + daysRequired);
        setNextDonationDateText(formatter.format(nextDate));

        let pct = (diffDays / daysRequired) * 100;
        if (pct > 100) pct = 100;
        setProgressPercent(`${pct}%`);
      } else {
        setDaysSinceDonation('-');
        setIsApto(true);
        setLastDonationDateText('Nunca');
        setNextDonationDateText('Hoje');
        setProgressPercent('100%');
      }

      // Fetch Total Donations
      const { count } = await supabase
        .from('doacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session?.user?.id);
      setTotalDonations(count || 0);

      // Fetch Urgent Alert matching blood type
      const { data: alertData } = await supabase
        .from('alertas')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (alertData && alertData.length > 0) {
        setAlert(alertData[0]);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {profile?.nome?.split(' ')[0] || 'Doador'} 👋</Text>
          <Text style={styles.welcome}>Bem-vindo de volta</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.nome ? profile.nome.substring(0,2).toUpperCase() : 'US'}</Text>
        </View>
      </View>

      {/* Card: Aptidão */}
      <View style={styles.cardAptidao}>
        <View style={styles.aptidaoHeader}>
          <Text style={styles.aptidaoTitle}>Sua aptidão</Text>
          {isApto && (
            <View style={styles.badgeApto}>
              <Text style={styles.badgeAptoText}>Apto ✓</Text>
            </View>
          )}
          {!isApto && (
            <View style={[styles.badgeApto, { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.badgeAptoText, { color: '#D32F2F' }]}>Inapto ✕</Text>
            </View>
          )}
        </View>
        
        <View style={styles.daysContainer}>
          <Text style={styles.daysNumber}>{daysSinceDonation}</Text>
          <Text style={styles.daysText}>dias desde a última doação</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: progressPercent as any }]} />
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>Última doação: {lastDonationDateText}</Text>
          <Text style={styles.dateText}>Próxima: {nextDonationDateText}</Text>
        </View>
      </View>

      {/* Row: Tipo Sanguíneo e Total de Doações */}
      <View style={styles.row}>
        {/* Tipo Sanguíneo */}
        <View style={styles.cardSmall}>
          <Text style={styles.cardSmallTitle}>Tipo sanguíneo</Text>
          <Text style={styles.bloodType}>{profile?.tipo_sanguineo || 'N/A'}</Text>
          <Text style={styles.bloodTypeSub}>
            Doador {profile?.tipo_sanguineo?.includes('O-') ? 'universal' : 'comum'}
          </Text>
        </View>

        {/* Total de Doaçõess */}
        <View style={styles.cardSmall}>
          <Text style={styles.cardSmallTitle}>Total de doações</Text>
          <Text style={styles.donationsTotal}>{totalDonations}</Text>
          <View style={styles.badgesRow}>
            {totalDonations > 0 && <Text>🏅</Text>}
            {totalDonations > 3 && <Text>⭐</Text>}
            {totalDonations > 5 && <Text>🩸</Text>}
          </View>
        </View>
      </View>

      {/* Card: Alerta Urgente */}
      {alert && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>Alerta urgente</Text>
            <View style={styles.badgeAgora}>
              <Text style={styles.badgeAgoraText}>Agora</Text>
            </View>
          </View>
          <Text style={styles.alertDescription}>
            {alert.hospital} precisa de <Text style={styles.alertBold}>{alert.tipo_sanguineo}</Text> em nível crítico.
          </Text>
          <TouchableOpacity style={styles.alertButton} onPress={() => router.push('/(tabs)/agendamentos' as any)}>
            <Text style={styles.alertButtonText}>Vou doar agora ↗</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Informativo / Guia de Doação */}
      <TouchableOpacity style={styles.guideCard} onPress={() => router.push('/cuidados' as any)}>
        <View style={styles.guideContent}>
          <Ionicons name="information-circle" size={32} color="#FFF" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.guideTitle}>Guia de Doação</Text>
            <Text style={styles.guideSub}>Veja os cuidados pré e pós-doação</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFF" />
        </View>
      </TouchableOpacity>

      {/* Secão: Hemocentros Próximos */}
      <View style={styles.nearbySection}>
        <Text style={styles.nearbyTitle}>Hemocentros próximos</Text>

        <View style={[styles.hospitalRow, { borderBottomWidth: 0 }]}>
          <View>
            <Text style={styles.hospitalName}>Hemocentro MG Norte</Text>
            <Text style={styles.hospitalInfo}>Seg-Sex · 7h-17h</Text>
          </View>
          <View style={styles.hospitalRight}>
            <Text style={styles.distance}>1,2 km</Text>
            <View style={styles.badgeCritico}>
              <Text style={styles.badgeCriticoText}>Crítico</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 20,
    paddingTop: 50,
  },
  guideCard: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  guideContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  guideSub: {
    color: '#FFCDD2',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#FFF',
    fontSize: 16,
  },
  welcome: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardAptidao: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  aptidaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aptidaoTitle: {
    color: '#AAA',
    fontSize: 14,
  },
  badgeApto: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeAptoText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  daysNumber: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 10,
  },
  daysText: {
    color: '#DDD',
    fontSize: 16,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    marginBottom: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#66BB6A',
    borderRadius: 3,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  cardSmall: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  cardSmallTitle: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 5,
  },
  bloodType: {
    color: '#EF5350',
    fontSize: 36,
    fontWeight: 'bold',
  },
  bloodTypeSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  donationsTotal: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 5,
  },
  alertCard: {
    backgroundColor: '#FDECEA',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeAgora: {
    backgroundColor: '#C62828',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeAgoraText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDescription: {
    color: '#333',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },
  alertBold: {
    fontWeight: 'bold',
    color: '#C62828',
  },
  alertButton: {
    backgroundColor: '#C62828',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nearbySection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  nearbyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  hospitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingVertical: 15,
  },
  hospitalName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hospitalInfo: {
    color: '#AAA',
    fontSize: 12,
  },
  hospitalRight: {
    alignItems: 'flex-end',
  },
  distance: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  badgeCritico: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  badgeCriticoText: {
    color: '#C62828',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeNormal: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#66BB6A',
  },
  badgeNormalText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

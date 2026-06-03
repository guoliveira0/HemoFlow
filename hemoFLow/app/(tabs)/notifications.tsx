import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, Modal, Linking, Alert } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { concederBadgeHeroi } from '../../src/lib/badges';

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)} dias`;
}

export default function NotificationScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile state for validation
  const [profile, setProfile] = useState<any>(null);
  const [isApto, setIsApto] = useState(true);

  // Modal State
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showConquista, setShowConquista] = useState(false);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [totalDoacoes, setTotalDoacoes] = useState(0);

  useEffect(() => {
    loadAlerts();
    if (session?.user?.id) {
      loadUserProfile();
    }
  }, [session]);

  async function loadUserProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user?.id)
      .single();
    
    if (data) {
      setProfile(data);
      if (data.ultima_doacao) {
        const lastDate = new Date(data.ultima_doacao + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.max(0, Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
        const isFemale = data.sexo?.toLowerCase()?.startsWith('f');
        const daysRequired = isFemale ? 90 : 60;
        setIsApto(diffDays >= daysRequired);
      } else {
        setIsApto(true);
      }
    }
  }

  async function loadAlerts() {
    setLoading(true);
    // Busca do Supabase e faz Join com a tabela profiles para pegar o nome do autor e com confirmacoes para contagem e verificação
    const { data, error } = await supabase
      .from('alertas')
      .select('*, profiles(nome), confirmacoes(id, doador_id)')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (data) {
      setAlerts(data);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alertas</Text>
        <TouchableOpacity style={styles.newAlertButton} onPress={() => router.push('/(admin)/create-alert')}>
          <Text style={styles.newAlertButtonText}>+ Novo alerta</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
           <Text style={styles.sectionTitle}>Alertas ativos na sua cidade</Text>
           <TouchableOpacity onPress={loadAlerts}>
             <Text style={{ color: '#888', fontSize: 12 }}>Atualizar</Text>
           </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 50 }} />
        ) : alerts.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 50, fontSize: 16 }}>Nenhum alerta ativo 🥳</Text>
        ) : (
          alerts.map((alert) => {
            const isUrgent = alert.urgencia === 'Urgente';
            const bloodColor = ['O-', 'O+'].includes(alert.tipo_sanguineo) ? '#8B0000' : '#1976D2';
            const voluntariosCount = alert.confirmacoes ? alert.confirmacoes.length : 0;
            const hasConfirmed = alert.confirmacoes?.some((c: any) => c.doador_id === session?.user?.id);
            const goalReached = alert.quantidade_bolsas ? voluntariosCount >= alert.quantidade_bolsas : false;

            return (
              <View 
                key={alert.id} 
                style={[
                  styles.card, 
                  isUrgent ? styles.cardUrgent : styles.cardNormal
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.bloodTypeCircle, { backgroundColor: bloodColor }]}>
                      <Text style={styles.bloodTypeText}>{alert.tipo_sanguineo}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      isUrgent ? styles.statusUrgente : styles.statusModerado
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        isUrgent ? styles.statusUrgenteText : styles.statusModeradoText
                      ]}>{alert.urgencia}</Text>
                    </View>
                  </View>
                  <Text style={[styles.timeText, isUrgent ? { color: '#8B0000' } : { color: '#888' }]}>
                    {getTimeAgo(alert.created_at)}
                  </Text>
                </View>

                <Text style={[
                  styles.hospitalName, 
                  isUrgent ? { color: '#8B0000' } : { color: '#FFF' }
                ]}>
                  {alert.hospital}
                </Text>
                
                {alert.mensagem ? (
                  <Text style={[styles.description, isUrgent ? { color: '#A72828' } : { color: '#CCC' }]}>
                    {alert.mensagem}
                  </Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.author, isUrgent ? { color: '#8B0000' } : { color: '#888' }]}>
                      por {alert.profiles?.nome || 'Hemocentro'} · {alert.cidade}
                    </Text>
                    {alert.quantidade_bolsas ? (
                      <Text style={[{ fontSize: 12, marginTop: 4, fontWeight: 'bold' }, isUrgent ? { color: '#B71C1C' } : { color: '#4CAF50' }]}>
                        ✓ {voluntariosCount} / {alert.quantidade_bolsas} {alert.quantidade_bolsas === 1 ? 'bolsa arrecadada' : 'bolsas arrecadadas'}
                      </Text>
                    ) : (
                      voluntariosCount > 0 && (
                        <Text style={[{ fontSize: 12, marginTop: 4, fontWeight: 'bold' }, isUrgent ? { color: '#B71C1C' } : { color: '#4CAF50' }]}>
                          ✓ {voluntariosCount} {voluntariosCount === 1 ? 'pessoa vai doar' : 'pessoas vão doar'}
                        </Text>
                      )
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isUrgent ? styles.actionButtonUrgent : styles.actionButtonNormal,
                      hasConfirmed && { backgroundColor: '#2A2A2A', borderColor: '#4CAF50', borderWidth: 1 },
                      !hasConfirmed && (profile?.tipo_sanguineo?.trim().toUpperCase() !== alert.tipo_sanguineo?.trim().toUpperCase() || goalReached) && { backgroundColor: '#555' }
                    ]}
                    disabled={!hasConfirmed && (profile?.tipo_sanguineo?.trim().toUpperCase() !== alert.tipo_sanguineo?.trim().toUpperCase() || goalReached)}
                    onPress={() => {
                      if (!hasConfirmed) {
                        setSelectedAlert(alert);
                        setIsConfirmed(false);
                        setShowConquista(false);
                      } else {
                        // Se já confirmou, leva ele direto para o QR Code
                        router.push({ pathname: '/qr-code/[alertaId]', params: { alertaId: alert.id }});
                      }
                    }}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      isUrgent ? styles.actionButtonTextUrgent : styles.actionButtonTextNormal,
                      hasConfirmed && { color: '#4CAF50' },
                      !hasConfirmed && (profile?.tipo_sanguineo?.trim().toUpperCase() !== alert.tipo_sanguineo?.trim().toUpperCase() || goalReached) && { color: '#999' }
                    ]}>
                      {hasConfirmed ? 'Mostrar QR Code' : (goalReached ? 'Meta alcançada' : (profile?.tipo_sanguineo?.trim().toUpperCase() === alert.tipo_sanguineo?.trim().toUpperCase() ? 'Quero ajudar' : 'Incompatível'))}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal / Bottom Sheet */}
      <Modal
        visible={!!selectedAlert}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setSelectedAlert(null);
          setIsConfirmed(false);
          setShowConquista(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
            </View>

            {selectedAlert && !isConfirmed && !showConquista && (
              <>
                <View style={styles.alertInfoRow}>
                  <View style={[styles.bloodTypeCircle, { backgroundColor: '#8B0000', width: 50, height: 50, borderRadius: 25 }]}>
                    <Text style={[styles.bloodTypeText, { fontSize: 20 }]}>{selectedAlert.tipo_sanguineo}</Text>
                  </View>
                  <View style={styles.alertInfoTexts}>
                    <Text style={styles.alertInfoTitle}>Alerta de {selectedAlert.profiles?.nome?.split(' ')[0] || 'Hemocentro'}</Text>
                    <Text style={styles.alertInfoSubtitle}>
                      {selectedAlert.hospital} · {selectedAlert.cidade} · {selectedAlert.urgencia}
                    </Text>
                  </View>
                </View>

                <View style={styles.checklistContainer}>
                  <Text style={styles.checklistTitle}>Antes de confirmar, verifique:</Text>
                  
                  <View style={styles.checkItem}>
                    <Ionicons name={isApto ? "checkmark-circle" : "close-circle"} size={24} color={isApto ? "#4CAF50" : "#F44336"} />
                    <Text style={styles.checkText}>Você está {isApto ? 'apto' : 'inapto'} para doar</Text>
                  </View>

                  <View style={styles.checkItem}>
                    <Ionicons 
                      name={profile?.tipo_sanguineo === selectedAlert.tipo_sanguineo || profile?.tipo_sanguineo === 'O-' ? "checkmark-circle" : "close-circle"} 
                      size={24} 
                      color={profile?.tipo_sanguineo === selectedAlert.tipo_sanguineo || profile?.tipo_sanguineo === 'O-' ? "#4CAF50" : "#F44336"} 
                    />
                    <Text style={styles.checkText}>Seu tipo {profile?.tipo_sanguineo || '?'} é {profile?.tipo_sanguineo === selectedAlert.tipo_sanguineo || profile?.tipo_sanguineo === 'O-' ? 'compatível' : 'incompatível'}</Text>
                  </View>

                  <View style={styles.checkItem}>
                    <Ionicons name="alert-circle" size={24} color="#FF9800" />
                    <Text style={styles.checkText}>Jejum de 3h antes da doação</Text>
                  </View>
                </View>

                <Text style={styles.contactTitle}>Como quer entrar em contato?</Text>
                
                <View style={styles.contactButtonsRow}>
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => {
                      const tel = selectedAlert.profiles?.telefone || '';
                      if (tel) {
                        Linking.openURL(`tel:${tel}`);
                      } else {
                        Alert.alert('Aviso', 'Este usuário não cadastrou telefone.');
                      }
                    }}
                  >
                    <Text style={styles.contactButtonText}>Ligar para {selectedAlert.profiles?.nome?.split(' ')[0] || 'o autor'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => {
                      const tel = selectedAlert.profiles?.telefone || '';
                      if (tel) {
                        Linking.openURL(`whatsapp://send?phone=${tel}&text=Olá! Vi o seu alerta no HemoFlow e gostaria de doar!`);
                      } else {
                        Alert.alert('Aviso', 'Este usuário não cadastrou telefone.');
                      }
                    }}
                  >
                    <Text style={styles.contactButtonText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={async () => {
                    if (session?.user?.id && selectedAlert?.id) {
                      // Tenta inserir a confirmação. O erro unique constraint limitará se já existir.
                      await supabase.from('confirmacoes').insert([
                        { alerta_id: selectedAlert.id, doador_id: session.user.id }
                      ]);
                      await loadAlerts(); // Atualiza a pág e os cards com a contagem nova
                      
                      // Conquista o badge de Herói caso seja um alerta urgente
                      if (selectedAlert.urgencia?.toLowerCase() === 'urgente') {
                        await concederBadgeHeroi(session.user.id);
                      }

                      // Prepara os dados para a tela de conquistas
                      const { data: dbBadges } = await supabase.from('usuario_badges').select('badge_id').eq('user_id', session.user.id);
                      setUserBadges(dbBadges?.map((b: any) => b.badge_id) || []);
                      const { count } = await supabase.from('doacoes').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
                      setTotalDoacoes(count || 0);
                    }
                    setIsConfirmed(true);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Confirmar que vou doar</Text>
                </TouchableOpacity>

                <Text style={styles.footerInfoText}>
                  {selectedAlert.profiles?.nome?.split(' ')[0] || 'O autor'} será notificado que você confirmou
                </Text>
              </>
            )}

            {selectedAlert && isConfirmed && !showConquista && (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={40} color="#4CAF50" />
                </View>
                
                <Text style={styles.successTitle}>Confirmado!</Text>
                
                <Text style={styles.successSubtitle}>
                  {selectedAlert.profiles?.nome?.split(' ')[0] || 'O autor'} foi notificado. Você aparece na lista de doadores confirmados.
                </Text>

                <View style={styles.addressCard}>
                  <Text style={styles.addressCardTitle}>Hemocentro Regional de Montes Claros</Text>
                  <Text style={styles.addressCardText}>Seg-Sex · 7h às 17h · Sáb 7h às 12h</Text>
                  <Text style={styles.addressCardText}>Rua Urbino Viana 640, Montes Claros, MG, 39400-087</Text>
                  <Text style={styles.addressCardText}>(38) 3218-7800</Text>
                </View>

                <View style={styles.actionRowContainer}>
                  <TouchableOpacity 
                    style={styles.comoChegarButton}
                    onPress={() => {
                      const address = "Rua Urbino Viana 640, Montes Claros, MG, 39400-087";
                      const url = Platform.select({
                        ios: `maps:0,0?q=${address}`,
                        android: `geo:0,0?q=${address}`
                      });
                      if (url) Linking.openURL(url);
                    }}
                  >
                    <Text style={styles.comoChegarText}>Como chegar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.agendaButton}
                    onPress={() => router.push({ pathname: '/qr-code/[alertaId]', params: { alertaId: selectedAlert.id }})}
                  >
                    <Text style={styles.agendaButtonText}>Mostrar QR{'\n'}no Local</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.conquistaButton}
                  onPress={() => {
                    setShowConquista(true);
                  }}
                >
                  <Text style={styles.conquistaButtonText}>Ver minha conquista</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedAlert && showConquista && (
              <View style={styles.conquistaView}>
                <Text style={styles.conquistaHeader}>NOVA CONQUISTA</Text>
                
                <View style={styles.conquistaBadgeCircle}>
                  <Ionicons name="heart" size={50} color="#B71C1C" />
                </View>
                
                <Text style={styles.conquistaTitle}>Herói de Emergência</Text>
                <Text style={styles.conquistaDesc}>
                  Você respondeu a um alerta urgente. Isso pode ter salvado uma vida.
                </Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{totalDoacoes}</Text>
                    <Text style={styles.statLabel}>Total de doações</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: '#B71C1C' }]}>{userBadges.length}</Text>
                    <Text style={styles.statLabel}>Badges{'\n'}conquistados</Text>
                  </View>
                </View>
                
                <View style={styles.badgesLista}>
                  {[
                    { id: 'primeira_doacao', title: '1ª doação', icon: 'water', activeBg: '#FCE4EC', activeColor: '#E91E63' },
                    { id: 'heroi_emergencia', title: 'Herói', icon: 'heart', activeBg: '#FDECEA', activeColor: '#B71C1C' },
                    { id: 'cinco_doacoes', title: '5 doações', icon: 'star', activeBg: '#FFF8E1', activeColor: '#FFC107' },
                    { id: 'dez_doacoes', title: '10 doações', icon: 'flame', activeBg: '#FBE9E7', activeColor: '#FF7043' },
                  ].map((sb, index) => {
                    const unlocked = userBadges.includes(sb.id);
                    return (
                      <View key={index} style={{ alignItems: 'center' }}>
                        <View style={[styles.miniBadgeCircle, { backgroundColor: unlocked ? sb.activeBg : '#333' }]}>
                          <Ionicons name={sb.icon as any} size={24} color={unlocked ? sb.activeColor : '#555'} />
                        </View>
                        <Text style={[styles.miniBadgeText, { color: unlocked ? '#FFF' : '#666' }]}>{sb.title}</Text>
                      </View>
                    );
                  })}
                </View>
                
                <TouchableOpacity 
                  style={styles.shareBtn}
                  onPress={() => {
                    setSelectedAlert(null);
                    setIsConfirmed(false);
                    setShowConquista(false);
                  }}
                >
                  <Text style={styles.shareBtnText}>Compartilhar conquista</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#B71C1C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  newAlertButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newAlertButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  cardUrgent: {
    backgroundColor: '#FDECEA',
  },
  cardNormal: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodTypeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bloodTypeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusUrgente: {
    backgroundColor: '#FFCDD2',
  },
  statusUrgenteText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusModerado: {
    backgroundColor: '#FFF8E1',
  },
  statusModeradoText: {
    color: '#F57F17',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusResolvido: {
    backgroundColor: '#E8F5E9',
  },
  statusResolvidoText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  actionButtonUrgent: {
    backgroundColor: '#A72828',
  },
  actionButtonNormal: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtonTextUrgent: {
    color: '#FFF',
  },
  actionButtonTextNormal: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: '60%',
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  alertInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  alertInfoTexts: {
    marginLeft: 16,
    flex: 1,
  },
  alertInfoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertInfoSubtitle: {
    color: '#AAA',
    fontSize: 14,
  },
  checklistContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  checklistTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 12,
  },
  contactTitle: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 12,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  contactButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#B71C1C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerInfoText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  addressCard: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  addressCardTitle: {
    color: '#B71C1C',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addressCardText: {
    color: '#8B0000',
    fontSize: 14,
    marginBottom: 6,
  },
  actionRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  comoChegarButton: {
    flex: 1,
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  comoChegarText: {
    color: '#B71C1C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  agendaButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  agendaButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  conquistaButton: {
    backgroundColor: '#B71C1C',
    width: '100%',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  conquistaButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  conquistaView: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  conquistaHeader: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 20,
  },
  conquistaBadgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  conquistaTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  conquistaDesc: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#AAA',
    fontSize: 12,
    textAlign: 'center',
  },
  badgesLista: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  miniBadgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  miniBadgeText: {
    fontSize: 11,
    textAlign: 'center',
  },
  shareBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

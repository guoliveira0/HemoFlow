import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';

// Todas as badges possíveis baseadas nas regras
const TODAS_BADGES = [
  { id: 'primeira_doacao', title: 'Primeiro passo', subtitle: '1ª doação', icon: 'water', activeBg: '#FCE4EC', activeColor: '#E91E63' },
  { id: 'heroi_emergencia', title: 'Herói de emergência', subtitle: 'Alerta urgente', icon: 'heart', activeBg: '#FDECEA', activeColor: '#B71C1C' },
  { id: 'cinco_doacoes', title: 'Doador frequente', subtitle: '5 doações', icon: 'star', activeBg: '#F1F8E9', activeColor: '#4CAF50' },
  { id: 'doador_universal', title: 'Doador universal', subtitle: 'Tipo O-', icon: 'globe', activeBg: '#E8F5E9', activeColor: '#388E3C' },
  { id: 'dez_doacoes', title: 'Veterano', subtitle: '10 doações', icon: 'flame', activeBg: '#FFF3E0', activeColor: '#FF9800', req: 10 },
  { id: 'vinte_doacoes', title: 'Lenda', subtitle: '20 doações', icon: 'ribbon', activeBg: '#EDE7F6', activeColor: '#FF5722', req: 20 },
];

export default function ProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [totalDoacoes, setTotalDoacoes] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        loadProfileData();
      }
    }, [session])
  );

  async function loadProfileData() {
    try {
      // Perfil
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();
        
      if (profData) {
        setProfile(profData);
        setIsAdmin(profData.is_admin);
      }

      // Doações confirmadas e histórico
      const { data: doacoesData } = await supabase
        .from('doacoes')
        .select('id, data_doacao, verificada, alertas(hospital)')
        .eq('user_id', session?.user?.id)
        .order('data_doacao', { ascending: false });

      if (doacoesData) {
        setTotalDoacoes(doacoesData.filter(d => d.verificada).length);
        setHistorico(doacoesData.slice(0, 3)); // Pega as ultimas 3
      }

      // Badges
      const { data: badgesData } = await supabase
        .from('usuario_badges')
        .select('badge_id')
        .eq('user_id', session?.user?.id);
        
      if (badgesData) {
        setBadges(badgesData.map(b => b.badge_id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    );
  }

  // Lógica de aptidão
  let diasDesdeUltima = 0;
  let apto = true;
  let diasRestantes = 0;
  if (profile?.ultima_doacao) {
    const ultima = new Date(profile.ultima_doacao + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    diasDesdeUltima = Math.floor((hoje.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simplificando regra da aptidão (Feminino=90, Masculino=60)
    const reqDays = profile?.sexo?.toLowerCase()?.startsWith('f') ? 90 : 60;
    diasRestantes = reqDays - diasDesdeUltima;
    apto = diasRestantes <= 0;
  }

  const userInitials = profile?.nome ? profile.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu perfil</Text>
        <TouchableOpacity style={styles.headerEditBtn} onPress={() => router.push('/edit-profile' as any)}>
          <Ionicons name="create-outline" size={16} color="#FFF" />
          <Text style={styles.headerEditTxt}> Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userMainRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarTxt}>{userInitials}</Text>
            </View>
            <View style={styles.userInfoCol}>
              <Text style={styles.userName}>{profile?.nome || 'Usuário'}</Text>
              <Text style={styles.userLoc}>{profile?.cidade || 'Cidade não inf.'}</Text>
              
              <View style={styles.typeRow}>
                <View style={styles.bloodTypeTag}>
                  <Text style={styles.bloodTypeTxt}>{profile?.tipo_sanguineo || '?'}</Text>
                </View>
                {profile?.tipo_sanguineo === 'O-' && <Text style={styles.typeLabel}> Doador universal</Text>}
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#AAA" />
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{session?.user?.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#AAA" />
            <Text style={styles.detailLabel}>Telefone</Text>
            <Text style={styles.detailValue}>{profile?.telefone || 'Não informado'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="male-female-outline" size={16} color="#AAA" />
            <Text style={styles.detailLabel}>Sexo</Text>
            <Text style={styles.detailValue}>{profile?.sexo || 'Não informado'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumAlert}>{totalDoacoes}</Text>
            <Text style={styles.statSub}>Total de doações</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumWhite}>{diasDesdeUltima}</Text>
            <Text style={styles.statSub}>Dias desde última</Text>
          </View>
        </View>

        {/* Aptidão */}
        <View style={[styles.aptidaoCard, apto ? styles.aptoBg : styles.inaptoBg]}>
          <View style={styles.aptidaoIconRow}>
            <Ionicons name={apto ? "checkmark-circle-outline" : "time-outline"} size={28} color={apto ? "#2E7D32" : "#D84315"} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.aptidaoTitle, apto ? { color: '#1B5E20' } : { color: '#BF360C' }]}>
                {apto ? 'Você está apto para doar' : 'Você ainda não pode doar'}
              </Text>
              <Text style={[styles.aptidaoSub, apto ? { color: '#388E3C' } : { color: '#D84315' }]}>
                {apto ? 'Próxima liberação: já disponível' : `Aguarde mais ${diasRestantes} dia(s)`}
              </Text>
            </View>
          </View>
        </View>

        {/* Conquistas */}
        <Text style={styles.sectionTitle}>Conquistas</Text>
        <View style={styles.badgesGrid}>
          {TODAS_BADGES.map((b) => {
            const hasBadge = badges.includes(b.id);
            const pendenteNum = b.req ? Math.max(0, b.req - totalDoacoes) : 0;

            return (
              <View key={b.id} style={[styles.badgeCard, !hasBadge && styles.badgeCardOff, hasBadge && { backgroundColor: b.activeBg }]}>
                <Ionicons name={b.icon as any} size={32} color={hasBadge ? b.activeColor : '#666'} />
                <Text style={[styles.badgeTitle, hasBadge ? { color: b.activeColor } : { color: '#777' }]}>{b.title}</Text>
                <Text style={styles.badgeSub}>{b.subtitle}</Text>
                
                {hasBadge ? (
                  <View style={[styles.badgePill, { backgroundColor: b.activeColor }]}>
                    <Text style={styles.badgePillTxt}>Conquistado</Text>
                  </View>
                ) : (
                  <View style={styles.badgePillOff}>
                    <Text style={styles.badgePillOffTxt}>{pendenteNum > 0 ? `${pendenteNum} restantes` : 'Não obtido'}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Histórico */}
        <View style={styles.histContainer}>
          <Text style={styles.sectionTitle}>Histórico de doações</Text>
          {historico.length === 0 ? (
            <Text style={{ color: '#888', marginBottom: 10 }}>Nenhuma doação registrada.</Text>
          ) : (
            historico.map((h, i) => {
              const dt = new Date(h.data_doacao + 'T00:00:00');
              const localName = h.alertas?.hospital || 'Doação Voluntária';
              return (
                <View key={i}>
                  <View style={styles.histItem}>
                    <View style={styles.histItemRow}>
                      <Ionicons 
                        name={h.verificada ? "checkmark-circle-outline" : "time-outline"} 
                        size={24} 
                        color={h.verificada ? "#4CAF50" : "#FFB300"} 
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.histItemTitle}>{localName}</Text>
                        <Text style={styles.histItemDate}>{dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                      </View>
                    </View>
                    <View style={[styles.histBadge, h.verificada ? styles.histBadgeVerif : styles.histBadgePend]}>
                      <Text style={[styles.histBadgeTxt, h.verificada ? styles.histBadgeTxtVerif : styles.histBadgeTxtPend]}>
                        {h.verificada ? 'Verificada' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                  {i < historico.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
          
          <TouchableOpacity style={styles.fullHistBtn}>
            <Text style={styles.fullHistBtnTxt}>Ver histórico completo ↗</Text>
          </TouchableOpacity>
        </View>

        {/* Configurações e Sair */}
        <View style={styles.configContainer}>
          <Text style={styles.sectionTitleConfig}>Configurações</Text>
          
          <View style={styles.configRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={20} color="#FFF" />
              <Text style={styles.configTxt}> Notificações</Text>
            </View>
            <View style={styles.fakeSwitch}><View style={styles.fakeSwitchKnob}/></View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.configRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-outline" size={20} color="#FFF" />
              <Text style={styles.configTxt}> Localização</Text>
            </View>
            <View style={styles.fakeSwitch}><View style={styles.fakeSwitchKnob}/></View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.configRow} onPress={handleSignOut}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="log-out-outline" size={20} color="#FF8A80" />
              <Text style={[styles.configTxt, { color: '#FF8A80' }]}> Sair da conta</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#FF8A80" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1E1E1E', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { backgroundColor: '#B71C1C', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerEditBtn: { flexDirection: 'row', borderWidth: 1, borderColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  headerEditTxt: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  
  userCard: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 20, marginBottom: 16 },
  userMainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarTxt: { color: '#B71C1C', fontSize: 22, fontWeight: 'bold' },
  userInfoCol: { flex: 1 },
  userName: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  userLoc: { color: '#AAA', fontSize: 13, marginBottom: 8 },
  typeRow: { flexDirection: 'row', alignItems: 'center' },
  bloodTypeTag: { backgroundColor: '#B71C1C', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  bloodTypeTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  typeLabel: { color: '#CCC', fontSize: 12, marginLeft: 6 },
  divider: { height: 1, backgroundColor: '#444', marginVertical: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailLabel: { color: '#AAA', fontSize: 14, marginLeft: 8, width: 80 },
  detailValue: { color: '#FFF', fontSize: 14, flex: 1, textAlign: 'right', fontWeight: '500' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNumAlert: { color: '#E53935', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statNumWhite: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statSub: { color: '#AAA', fontSize: 12 },

  aptidaoCard: { borderRadius: 12, padding: 16, marginBottom: 24 },
  aptoBg: { backgroundColor: '#E8F5E9' },
  inaptoBg: { backgroundColor: '#FBE9E7' },
  aptidaoIconRow: { flexDirection: 'row', alignItems: 'center' },
  aptidaoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  aptidaoSub: { fontSize: 13 },
  
  adminButton: { backgroundColor: '#0056b3', flexDirection: 'row', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  adminButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  badgeCard: { width: '48%', backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  badgeCardOff: { backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  badgeTitle: { marginTop: 10, fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#FFF' },
  badgeSub: { fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'center' },
  badgePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgePillTxt: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  badgePillOff: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#444' },
  badgePillOffTxt: { color: '#666', fontSize: 10, fontWeight: 'bold' },

  histContainer: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, marginBottom: 24 },
  histItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  histItemRow: { flexDirection: 'row', alignItems: 'center' },
  histItemTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  histItemDate: { color: '#888', fontSize: 12, marginTop: 4 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  histBadgeVerif: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)' },
  histBadgePend: { borderColor: '#FF9800', backgroundColor: 'rgba(255,152,0,0.1)' },
  histBadgeTxt: { fontSize: 10, fontWeight: 'bold' },
  histBadgeTxtVerif: { color: '#4CAF50' },
  histBadgeTxtPend: { color: '#FF9800' },
  fullHistBtn: { marginTop: 16, alignItems: 'center', borderWidth: 1, borderColor: '#555', paddingVertical: 12, borderRadius: 8 },
  fullHistBtnTxt: { color: '#AAA', fontSize: 14, fontWeight: 'bold' },

  configContainer: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, marginBottom: 40 },
  sectionTitleConfig: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  configTxt: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
  fakeSwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#B71C1C', justifyContent: 'center', paddingHorizontal: 2 },
  fakeSwitchKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', alignSelf: 'flex-end' },
});

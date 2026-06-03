import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { supabase } from '../../src/lib/supabase'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'

export default function DoacaoQRScreen() {
  const params = useLocalSearchParams()
  const alertaId = params.alertaId as string
  const router = useRouter()
  const { session } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [doacao, setDoacao] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      criarOuBuscarDoacao()
    } else {
      setLoading(false)
    }
  }, [session])

  async function criarOuBuscarDoacao() {
    setLoading(true)
    const user = session?.user

    if (!user || !alertaId) {
      console.log("Usuário ou alertaId ausente:", { user: !!user, alertaId })
      setLoading(false)
      return
    }

    try {
      // Verifica se já existe uma doação pendente para esse alerta
      const { data: existente, error: erroBusca } = await supabase
        .from('doacoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('alerta_id', alertaId)
        .single()
        
      if (erroBusca && erroBusca.code !== 'PGRST116') {
        console.error("Erro ao buscar doação: ", erroBusca)
      }

      if (existente) {
        setDoacao(existente)
        setToken(existente.token_verificacao)
        setLoading(false)
        return
      }

      // Cria a doação com status pendente se não existir
      const { data: nova, error: erroCriacao } = await supabase
        .from('doacoes')
        .insert({
          user_id: user.id,
          alerta_id: alertaId,
          data_doacao: new Date().toISOString().split('T')[0],
          verificada: false,
        })
        .select()
        .single()
        
      if (erroCriacao) {
        console.error("Erro ao criar doação: ", erroCriacao)
      }

      if (nova) {
        setDoacao(nova)
        setToken(nova.token_verificacao)
      }
    } catch (e) {
      console.error("Exceção na validação de doação: ", e)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#1E1E1E' }]}>
        <ActivityIndicator size="large" color="#B71C1C" />
      </View>
    )
  }
  
  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: '#1E1E1E' }]}>
        <Text style={{color: '#fff'}}>Erro ao carregar o QR Code. Tente novamente.</Text>
      </View>
    )
  }

  // URL que o hemocentro vai escanear
  const qrData = `hemoflow://verificar/${token}`

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.titulo}>Mostre esse QR Code</Text>
        <Text style={styles.subtitulo}>O atendente do hemocentro vai escanear para confirmar sua doação</Text>

        <View style={styles.qrContainer}>
          <QRCode value={qrData} size={250} backgroundColor="#FFFFFF" color="#000000" />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoLabel}>STATUS DA DOAÇÃO</Text>
          <View style={[styles.statusBox, doacao?.verificada ? styles.statusConfirmado : styles.statusPendente]}>
            <Ionicons name={doacao?.verificada ? "checkmark-circle" : "time"} size={20} color={doacao?.verificada ? "#4CAF50" : "#FF9800"} />
            <Text style={[styles.infoValor, { color: doacao?.verificada ? '#4CAF50' : '#FF9800', marginLeft: 8 }]}>
              {doacao?.verificada ? 'Confirmada ✓' : 'Aguardando verificação...'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { padding: 20 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 60 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#AAA', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  qrContainer: { padding: 20, borderRadius: 16, backgroundColor: '#FFF', marginBottom: 40 },
  info: { alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  infoLabel: { fontSize: 12, color: '#888', marginBottom: 12, fontWeight: 'bold', letterSpacing: 1 },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30 },
  statusConfirmado: { borderWidth: 1, borderColor: '#4CAF50' },
  statusPendente: { borderWidth: 1, borderColor: '#FF9800' },
  infoValor: { fontSize: 16, fontWeight: 'bold' },
})
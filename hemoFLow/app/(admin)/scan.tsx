import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { verificarBadges } from '../../src/lib/badges';

export default function HemocentroScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  if (!permission) {
    return <View />
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Câmera não autorizada</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Text style={{ textAlign: 'center', color: '#FFF', marginBottom: 20 }}>Precisamos da sua permissão para usar a câmera e escanear doações.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Conceder permissão</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);

    const tokenMatch = data.match(/verificar\/(.+)/);
    
    if (tokenMatch && tokenMatch[1]) {
      const token = tokenMatch[1];
      
      const { data: doacaoExistente } = await supabase.from('doacoes').select('*').eq('token_verificacao', token).single();

      if (doacaoExistente) {
        // Valida e Confirma doação
        const { error } = await supabase
          .from('doacoes')
          .update({ 
            verificada: true, 
            verificada_em: new Date().toISOString(),
            verificada_por: session?.user?.id 
          })
          .eq('token_verificacao', token);

        if (error) {
          Alert.alert('Erro', 'Não foi possível verificar a doação.');
        } else {
          Alert.alert('Sucesso!', 'Doação verificada e confirmada.');
          
          // Checa e concede badges para o usuário automaticamente (Gamificação Hemocentro)
          await verificarBadges(doacaoExistente.user_id);
        }
      } else {
         Alert.alert('Erro', 'Doação não encontrada no banco de dados.');
      }
    } else {
      Alert.alert('QR Code Inválido', 'Este QR Code não pertence ao sistema do HemoFlow.');
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validar QR de Doação</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.cameraContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#B71C1C" />
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
               barcodeTypes: ["qr"],
            }}
          />
        )}
      </View>

      {scanned && !loading && (
        <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
          <Text style={styles.scanAgainText}>Escanear Outro QR Code</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#2A2A2A', paddingTop: 45 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 4 },
  cameraContainer: { flex: 1, backgroundColor: '#000', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1, width: '100%', height: '100%' },
  button: { backgroundColor: '#B71C1C', padding: 16, borderRadius: 8 },
  buttonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  scanAgainButton: { backgroundColor: '#B71C1C', padding: 16, borderRadius: 8, margin: 20, alignItems: 'center' },
  scanAgainText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
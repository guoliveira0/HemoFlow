import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Painel Admin' }} />
      <Stack.Screen name="create-alert" options={{ title: 'Novo Alerta' }} />
    </Stack>
  );
}

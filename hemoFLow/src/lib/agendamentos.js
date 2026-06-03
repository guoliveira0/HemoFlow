import { supabase } from './supabase'
import * as Notifications from 'expo-notifications'

// Calcula se o usuário está apto baseado no sexo e última doação
export function calcularAptidao(ultimaDoacao, sexo) {
  if (!ultimaDoacao) return { apto: true, diasRestantes: 0 }

  const diasEspera = sexo === 'Feminino' || sexo === 'Feminino' ? 90 : 60
  const ultima = new Date(ultimaDoacao + 'T00:00:00')
  const hoje = new Date()
  hoje.setHours(0,0,0,0)
  const diasPassados = Math.floor((hoje.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24))
  const diasRestantes = diasEspera - diasPassados

  return {
    apto: diasRestantes <= 0,
    diasRestantes: Math.max(0, diasRestantes),
    proximaDoacao: new Date(ultima.getTime() + diasEspera * 24 * 60 * 60 * 1000),
  }
}

// Salva o agendamento e programa as notificações
export async function criarAgendamento({ hemocentro, data, horario }) {
  const { data: { user } } = await supabase.auth.getUser()

  // Busca perfil para verificar aptidão
  const { data: perfil } = await supabase
    .from('profiles')
    .select('sexo, ultima_doacao, nome')
    .eq('id', user.id)
    .single()

  // Bloqueia se não estiver apto
  const { apto, diasRestantes } = calcularAptidao(perfil.ultima_doacao, perfil.sexo)
  // Se quiser ser rigoroso pode lançar erro, ou apenas retornar falso no front-end
  if (!apto) {
    throw new Error(`Você ainda não está apto. Faltam ${diasRestantes} dias para a próxima doação.`)
  }

  // Previne agendamento duplicado pendente
  const { data: existentes } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['pendente', 'confirmado'])

  if (existentes && existentes.length > 0) {
    throw new Error('Você já possui um agendamento ativo. Verifique a lista.')
  }

  // Salva no banco
  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .insert({
      user_id: user.id,
      hemocentro,
      data_agendamento: data, // formata YYYY-MM-DD
      horario,
    })
    .select()
    .single()

  if (error) throw new Error('Erro ao salvar agendamento: ' + error.message)

  // Programa as notificações locais
  await agendarNotificacoes(agendamento, perfil.nome, data, horario, hemocentro)

  return agendamento
}

// Programa dois lembretes: véspera e no dia
async function agendarNotificacoes(agendamento, nome, data, horario, hemocentro) {
  const [hora, minuto] = horario.split(':').map(Number)
  const dataDoacao = new Date(`${data}T00:00:00`)
  dataDoacao.setHours(hora, minuto, 0, 0)

  // Lembrete na véspera às 19h
  const vespera = new Date(dataDoacao)
  vespera.setDate(vespera.getDate() - 1)
  vespera.setHours(19, 0, 0, 0)

  // Lembrete no dia, 2 horas antes
  const noDia = new Date(dataDoacao)
  noDia.setHours(noDia.getHours() - 2)

  // Só agenda se as datas ainda estão no futuro
  if (vespera > new Date()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `vespera-${agendamento.id}`,
      content: {
        title: 'Sua doação é amanhã! 🩸',
        body: `Lembre-se: ${hemocentro} às ${horario}. Durma bem e beba água.`,
        data: { agendamentoId: agendamento.id },
      },
      trigger: { date: vespera, type: Notifications.SchedulableTriggerInputTypes.DATE },
    })
  }

  if (noDia > new Date()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `nodia-${agendamento.id}`,
      content: {
        title: 'Sua doação é hoje! ❤️',
        body: `Daqui a 2 horas você doa em ${hemocentro}. Faça um lanche leve antes de ir.`,
        data: { agendamentoId: agendamento.id },
      },
      trigger: { date: noDia, type: Notifications.SchedulableTriggerInputTypes.DATE },
    })
  }
}

// Cancela as notificações se o agendamento for cancelado
export async function cancelarAgendamento(agendamentoId) {
  await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('id', agendamentoId)

  await Notifications.cancelScheduledNotificationAsync(`vespera-${agendamentoId}`)
  await Notifications.cancelScheduledNotificationAsync(`nodia-${agendamentoId}`)
}

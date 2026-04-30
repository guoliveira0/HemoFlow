import { supabase } from './supabase'

// Verifica e concede badges automaticamente após cada doação
export async function verificarBadges(userId) {
  const badgesNovos = []

  // Busca quantas doações o usuário tem
  const { count: totalDoacoes } = await supabase
    .from('doacoes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Busca o perfil para checar tipo sanguíneo
  const { data: perfil } = await supabase
    .from('profiles')
    .select('tipo_sanguineo')
    .eq('id', userId)
    .single()

  // Busca badges que o usuário já tem
  const { data: jaTemBadges } = await supabase
    .from('usuario_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const jaConquistados = jaTemBadges?.map(b => b.badge_id) || []

  // Regras de cada badge
  const regras = [
    {
      id: 'primeira_doacao',
      condicao: totalDoacoes >= 1,
    },
    {
      id: 'cinco_doacoes',
      condicao: totalDoacoes >= 5,
    },
    {
      id: 'dez_doacoes',
      condicao: totalDoacoes >= 10,
    },
    {
      id: 'vinte_doacoes',
      condicao: totalDoacoes >= 20,
    },
    {
      id: 'universal',
      condicao: perfil?.tipo_sanguineo === 'O-',
    },
  ]

  // Concede os badges que ainda não foram conquistados
  for (const regra of regras) {
    if (regra.condicao && !jaConquistados.includes(regra.id)) {
      const { error } = await supabase.from('usuario_badges').insert({
        user_id: userId,
        badge_id: regra.id,
      })
      if (!error) badgesNovos.push(regra.id)
    }
  }

  return badgesNovos // retorna lista dos badges recém conquistados
}

// Concede badge de herói ao confirmar um alerta urgente
export async function concederBadgeHeroi(userId) {
  const { data: jaTemBadge } = await supabase
    .from('usuario_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', 'heroi_emergencia')
    .single()

  if (!jaTemBadge) {
    await supabase.from('usuario_badges').insert({
      user_id: userId,
      badge_id: 'heroi_emergencia',
    })
    return true // badge novo conquistado
  }
  return false
}

// Busca todos os badges do usuário para exibir no perfil
export async function buscarBadgesUsuario(userId) {
  const { data: conquistados } = await supabase
    .from('usuario_badges')
    .select('badge_id, conquistado_em')
    .eq('user_id', userId)

  const { data: todos } = await supabase
    .from('badges')
    .select('*')

  // Retorna todos os badges marcando quais foram conquistados
  return todos?.map(badge => ({
    ...badge,
    conquistado: conquistados?.some(c => c.badge_id === badge.id) || false,
    conquistado_em: conquistados?.find(c => c.badge_id === badge.id)?.conquistado_em || null,
  }))
}

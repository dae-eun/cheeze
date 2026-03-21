import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    let userData = await authenticateUser(event)
    if (!userData) {
      throw createError({ statusCode: 401, statusMessage: '인증이 필요합니다.' })
    }
    if (!userData.email) {
      userData = await refreshTokenAndGetUser(event, supabaseAdmin)
    }

    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('betting_rooms')
      .select('id, organization_id, created_by, title, initial_funds, distribution_method, payout_mode, fee_percent, carry_over_balance, ended_at, created_at, updated_at')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw createError({ statusCode: 404, statusMessage: '배팅 방을 찾을 수 없습니다.' })
    }

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userData.user_id)
      .single()

    if (dbUser?.organization_id !== room.organization_id) {
      throw createError({ statusCode: 403, statusMessage: '이 배팅 방에 접근할 권한이 없습니다.' })
    }

    const { data: participants } = await supabaseAdmin
      .from('room_participants')
      .select('id, user_id, balance, joined_at')
      .eq('room_id', roomId)

    const { data: rounds } = await supabaseAdmin
      .from('betting_rounds')
      .select('id, betting_duration_minutes, started_at, ends_at, status, result, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    const activeRound = (rounds || []).find((r) => r.status === 'betting' || r.status === 'result_pending')
    const currentRound = activeRound || null

    let bets: any[] = []
    let payouts: any[] = []

    if (currentRound) {
      const { data: roundBets } = await supabaseAdmin
        .from('bets')
        .select('id, user_id, choice, amount, created_at')
        .eq('round_id', currentRound.id)
      bets = roundBets || []

      const { data: roundPayouts } = await supabaseAdmin
        .from('payouts')
        .select('id, user_id, amount')
        .eq('round_id', currentRound.id)
      payouts = roundPayouts || []
    }

    return {
      success: true,
      room: {
        ...room,
        participants: participants || [],
        currentRound,
        rounds: rounds || [],
        bets,
        payouts
      }
    }
  } catch (err) {
    console.error('Get betting room error:', err)
    throw err
  }
})

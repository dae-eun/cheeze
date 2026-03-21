import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

const VALID_CHOICES = ['win', 'lose', 'draw'] as const

function getBettingChannelName(organizationId: string, roomId: string) {
  return `betting:org:${organizationId}:room:${roomId}`
}

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
    const roundId = getRouterParam(event, 'roundId')
    if (!roomId || !roundId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID와 라운드 ID가 필요합니다.' })
    }

    const body = await readBody(event)
    const { choice, amount } = body

    if (!choice || !VALID_CHOICES.includes(choice)) {
      throw createError({ statusCode: 400, statusMessage: '승/패/무승부 중 하나를 선택해주세요.' })
    }
    if (typeof amount !== 'number' || amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: '배팅 금액은 1 이상이어야 합니다.' })
    }

    const { data: round, error: roundError } = await supabaseAdmin
      .from('betting_rounds')
      .select('id, room_id, status, ends_at')
      .eq('id', roundId)
      .eq('room_id', roomId)
      .single()

    if (roundError || !round) {
      throw createError({ statusCode: 404, statusMessage: '라운드를 찾을 수 없습니다.' })
    }

    if (round.status !== 'betting') {
      throw createError({ statusCode: 400, statusMessage: '배팅 기간이 아닙니다.' })
    }

    if (new Date() > new Date(round.ends_at)) {
      throw createError({ statusCode: 400, statusMessage: '배팅 시간이 종료되었습니다.' })
    }

    const { data: room } = await supabaseAdmin
      .from('betting_rooms')
      .select('id, organization_id, created_by')
      .eq('id', roomId)
      .single()

    if (room?.created_by === userData.user_id) {
      throw createError({ statusCode: 400, statusMessage: '방 관리자는 배팅할 수 없습니다.' })
    }

    const { data: participant } = await supabaseAdmin
      .from('room_participants')
      .select('id, balance')
      .eq('room_id', roomId)
      .eq('user_id', userData.user_id)
      .single()

    if (!participant) {
      throw createError({ statusCode: 400, statusMessage: '방에 참가한 후 배팅할 수 있습니다.' })
    }

    if (participant.balance < amount) {
      throw createError({ statusCode: 400, statusMessage: `잔액이 부족합니다. (보유: ${participant.balance})` })
    }

    const { data: bet, error: betError } = await supabaseAdmin
      .from('bets')
      .insert({
        round_id: roundId,
        user_id: userData.user_id,
        choice,
        amount
      })
      .select()
      .single()

    if (betError) {
      if (betError.code === '23505') {
        throw createError({ statusCode: 400, statusMessage: '이미 이 라운드에 배팅하셨습니다.' })
      }
      console.error('Create bet error:', betError)
      throw createError({ statusCode: 500, statusMessage: '배팅에 실패했습니다.' })
    }

    const { error: balanceError } = await supabaseAdmin
      .from('room_participants')
      .update({ balance: participant.balance - amount })
      .eq('room_id', roomId)
      .eq('user_id', userData.user_id)

    if (balanceError) {
      console.error('Update balance error:', balanceError)
    }

    try {
      const channelName = getBettingChannelName(room!.organization_id, roomId)
      const channel = supabaseAdmin.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'bet_placed',
        payload: { bet }
      })
    } catch (broadcastErr) {
      console.warn('Realtime broadcast failed:', broadcastErr)
    }

    return { success: true, bet }
  } catch (err) {
    console.error('Place bet error:', err)
    throw err
  }
})

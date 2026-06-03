import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

const VALID_CHOICES = ['win', 'lose', 'draw'] as const

function getBettingChannelName(organizationId: string, roomId: string) {
  return `betting:org:${organizationId}:room:${roomId}`
}

function getBetErrorStatus(message?: string) {
  if (!message) return 500
  if (
    message.includes('not found') ||
    message.includes('not open') ||
    message.includes('time has ended') ||
    message.includes('cannot place') ||
    message.includes('not a room participant') ||
    message.includes('Insufficient') ||
    message.includes('already placed')
  ) {
    return 400
  }
  return 500
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
      throw createError({ statusCode: 400, statusMessage: '승, 패, 무승부 중 하나를 선택해주세요.' })
    }
    if (typeof amount !== 'number' || amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: '배팅 금액은 1 이상이어야 합니다.' })
    }

    const { data: txResult, error: txError } = await supabaseAdmin.rpc('place_bet', {
      p_room_id: roomId,
      p_round_id: roundId,
      p_user_id: userData.user_id,
      p_choice: choice,
      p_amount: amount
    })

    if (txError) {
      console.error('Place bet transaction error:', txError)
      throw createError({
        statusCode: getBetErrorStatus(txError.message),
        statusMessage: txError.message || '배팅에 실패했습니다.'
      })
    }

    const bet = txResult?.bet
    const organizationId = txResult?.organization_id

    if (!bet || !organizationId) {
      throw createError({ statusCode: 500, statusMessage: '배팅 결과를 가져올 수 없습니다.' })
    }

    try {
      const channelName = getBettingChannelName(organizationId, roomId)
      const channel = supabaseAdmin.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'bet_placed',
        payload: { bet }
      })
    } catch (broadcastErr) {
      console.warn('Realtime broadcast failed:', broadcastErr)
    }

    return { success: true, bet, balance: txResult.balance }
  } catch (err) {
    console.error('Place bet error:', err)
    throw err
  }
})

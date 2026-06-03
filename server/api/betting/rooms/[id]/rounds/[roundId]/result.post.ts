import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

const VALID_CHOICES = ['win', 'lose', 'draw'] as const

function getBettingChannelName(organizationId: string, roomId: string) {
  return `betting:org:${organizationId}:room:${roomId}`
}

function getSettlementErrorStatus(message?: string) {
  if (!message) return 500
  if (
    message.includes('not found') ||
    message.includes('Only the room manager') ||
    message.includes('already settled') ||
    message.includes('must be closed')
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
    const { result } = body

    if (!result || !VALID_CHOICES.includes(result)) {
      throw createError({ statusCode: 400, statusMessage: '승, 패, 무승부 중 하나를 선택해주세요.' })
    }

    const { data: txResult, error: txError } = await supabaseAdmin.rpc('settle_betting_round', {
      p_room_id: roomId,
      p_round_id: roundId,
      p_user_id: userData.user_id,
      p_result: result
    })

    if (txError) {
      console.error('Settle betting round transaction error:', txError)
      throw createError({
        statusCode: getSettlementErrorStatus(txError.message),
        statusMessage: txError.message || '결과 확정에 실패했습니다.'
      })
    }

    const organizationId = txResult?.organization_id
    const payouts = txResult?.payouts || []

    if (!organizationId) {
      throw createError({ statusCode: 500, statusMessage: '정산 결과를 가져올 수 없습니다.' })
    }

    try {
      const channelName = getBettingChannelName(organizationId, roomId)
      const channel = supabaseAdmin.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'result_announced',
        payload: { result, payouts, roundId }
      })
      await channel.send({
        type: 'broadcast',
        event: 'payout_completed',
        payload: { payouts }
      })
    } catch (broadcastErr) {
      console.warn('Realtime broadcast failed:', broadcastErr)
    }

    return {
      success: true,
      result,
      payouts,
      carry_over_balance: txResult.carry_over_balance,
      already_settled: txResult.already_settled
    }
  } catch (err) {
    console.error('Set result error:', err)
    throw err
  }
})

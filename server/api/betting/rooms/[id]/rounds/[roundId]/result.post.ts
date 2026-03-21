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
    const { result } = body

    if (!result || !VALID_CHOICES.includes(result)) {
      throw createError({ statusCode: 400, statusMessage: '승/패/무승부 중 하나를 선택해주세요.' })
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('betting_rooms')
      .select('id, organization_id, created_by, distribution_method, payout_mode, fee_percent, carry_over_balance')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw createError({ statusCode: 404, statusMessage: '배팅 방을 찾을 수 없습니다.' })
    }

    if (room.created_by !== userData.user_id) {
      throw createError({ statusCode: 403, statusMessage: '방 관리자만 결과를 확정할 수 있습니다.' })
    }

    const { data: round, error: roundError } = await supabaseAdmin
      .from('betting_rounds')
      .select('id, room_id, status')
      .eq('id', roundId)
      .eq('room_id', roomId)
      .single()

    if (roundError || !round) {
      throw createError({ statusCode: 404, statusMessage: '라운드를 찾을 수 없습니다.' })
    }

    if (round.status !== 'result_pending') {
      throw createError({ statusCode: 400, statusMessage: '배팅 마감 후 결과를 확정할 수 있습니다.' })
    }

    let betList: Array<{ id: string; user_id: string; choice: string; amount: number }> = []
    const { data: bets, error: betsError } = await supabaseAdmin
      .from('bets')
      .select('id, user_id, choice, amount')
      .eq('round_id', roundId)

    if (betsError) {
      console.error('Bets fetch error:', betsError)
      betList = []
    } else {
      betList = bets || []
    }
    const winningBets = betList.filter((b) => b.choice === result)
    const totalWinningAmount = winningBets.reduce((sum, b) => sum + b.amount, 0)
    const roundPool = betList.reduce((sum, b) => sum + b.amount, 0)
    const carryOver = room.carry_over_balance ?? 0
    const totalPool = carryOver + roundPool
    const feePercent = room.fee_percent ?? 0
    const fee = Math.floor((roundPool * feePercent) / 100)
    const distributable = totalPool - fee

    const payouts: Array<{ round_id: string; user_id: string; amount: number }> = []

    if (totalWinningAmount > 0 && distributable > 0) {
      const isDoubleMode = room.payout_mode === 'double'
      const totalTargetPayout = totalWinningAmount * 2

      for (const bet of winningBets) {
        let share: number
        if (isDoubleMode && distributable >= totalTargetPayout) {
          share = bet.amount * 2
        } else {
          share = Math.floor((distributable * bet.amount) / totalWinningAmount)
        }
        payouts.push({
          round_id: roundId,
          user_id: bet.user_id,
          amount: share
        })
      }
    }

    const newCarryOver =
      payouts.length === 0 && room.distribution_method === 'carry_over'
        ? distributable
        : 0

    const { error: updateError } = await supabaseAdmin
      .from('betting_rounds')
      .update({ result, status: 'closed' })
      .eq('id', roundId)

    if (updateError) {
      throw createError({ statusCode: 500, statusMessage: '결과 확정에 실패했습니다.' })
    }

    await supabaseAdmin
      .from('betting_rooms')
      .update({ carry_over_balance: newCarryOver })
      .eq('id', roomId)

    if (payouts.length > 0) {
      await supabaseAdmin.from('payouts').insert(payouts)

      for (const p of payouts) {
        const { data: part } = await supabaseAdmin
          .from('room_participants')
          .select('balance')
          .eq('room_id', roomId)
          .eq('user_id', p.user_id)
          .single()
        if (part) {
          await supabaseAdmin
            .from('room_participants')
            .update({ balance: part.balance + p.amount })
            .eq('room_id', roomId)
            .eq('user_id', p.user_id)
        }
      }
    }

    try {
      const channelName = getBettingChannelName(room.organization_id, roomId)
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

    return { success: true, result, payouts }
  } catch (err) {
    console.error('Set result error:', err)
    throw err
  }
})

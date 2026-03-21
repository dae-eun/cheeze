import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

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

    const { data: room, error: roomError } = await supabaseAdmin
      .from('betting_rooms')
      .select('id, organization_id, created_by')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw createError({ statusCode: 404, statusMessage: '배팅 방을 찾을 수 없습니다.' })
    }

    if (room.created_by !== userData.user_id) {
      throw createError({ statusCode: 403, statusMessage: '방 관리자만 배팅을 마감할 수 있습니다.' })
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

    if (round.status !== 'betting') {
      throw createError({ statusCode: 400, statusMessage: '배팅 중인 라운드만 마감할 수 있습니다.' })
    }

    const { error: updateError } = await supabaseAdmin
      .from('betting_rounds')
      .update({ status: 'result_pending' })
      .eq('id', roundId)

    if (updateError) {
      throw createError({ statusCode: 500, statusMessage: '배팅 마감에 실패했습니다.' })
    }

    try {
      const channelName = getBettingChannelName(room.organization_id, roomId)
      const channel = supabaseAdmin.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'betting_ended',
        payload: { roundId }
      })
    } catch (broadcastErr) {
      console.warn('Realtime broadcast failed:', broadcastErr)
    }

    return { success: true }
  } catch (err) {
    console.error('End betting error:', err)
    throw err
  }
})

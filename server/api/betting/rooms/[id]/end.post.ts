import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../utils/auth'

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
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('betting_rooms')
      .select('id, organization_id, created_by, ended_at')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw createError({ statusCode: 404, statusMessage: '배팅 방을 찾을 수 없습니다.' })
    }

    if (room.created_by !== userData.user_id) {
      throw createError({ statusCode: 403, statusMessage: '방 관리자만 게임을 종료할 수 있습니다.' })
    }

    if (room.ended_at) {
      throw createError({ statusCode: 400, statusMessage: '이미 종료된 게임입니다.' })
    }

    const { data: activeRound } = await supabaseAdmin
      .from('betting_rounds')
      .select('id')
      .eq('room_id', roomId)
      .in('status', ['betting', 'result_pending'])
      .limit(1)
      .maybeSingle()

    if (activeRound) {
      throw createError({ statusCode: 400, statusMessage: '진행 중인 라운드가 있습니다. 배팅 마감 후 결과를 확정한 뒤 종료해주세요.' })
    }

    const { error: updateError } = await supabaseAdmin
      .from('betting_rooms')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', roomId)

    if (updateError) {
      throw createError({ statusCode: 500, statusMessage: '게임 종료에 실패했습니다.' })
    }

    try {
      const channelName = getBettingChannelName(room.organization_id, roomId)
      const channel = supabaseAdmin.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'game_ended',
        payload: { roomId }
      })
    } catch (broadcastErr) {
      console.warn('Realtime broadcast failed:', broadcastErr)
    }

    return { success: true }
  } catch (err) {
    console.error('End game error:', err)
    throw err
  }
})

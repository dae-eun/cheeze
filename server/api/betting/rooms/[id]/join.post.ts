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
      .select('id, organization_id, initial_funds, ended_at')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw createError({ statusCode: 404, statusMessage: '배팅 방을 찾을 수 없습니다.' })
    }

    if (room.ended_at) {
      throw createError({ statusCode: 400, statusMessage: '종료된 게임에는 참가할 수 없습니다.' })
    }

    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userData.user_id)
      .single()

    if (dbUser?.organization_id !== room.organization_id) {
      throw createError({ statusCode: 403, statusMessage: '이 배팅 방에 접근할 권한이 없습니다.' })
    }

    const { data: existing } = await supabaseAdmin
      .from('room_participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userData.user_id)
      .maybeSingle()

    if (existing) {
      throw createError({ statusCode: 400, statusMessage: '이미 참가한 방입니다.' })
    }

    const { data: participant, error: insertError } = await supabaseAdmin
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: userData.user_id,
        balance: room.initial_funds
      })
      .select()
      .single()

    if (insertError) {
      console.error('Join room error:', insertError)
      throw createError({ statusCode: 500, statusMessage: '방 참가에 실패했습니다.' })
    }

    try {
      const channelName = getBettingChannelName(room.organization_id, roomId)
      const channel = supabaseAdmin.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'participant_joined',
        payload: { participant: { ...participant, user_id: userData.user_id } }
      })
    } catch (broadcastErr) {
      console.warn('Realtime broadcast failed:', broadcastErr)
    }

    return { success: true, participant }
  } catch (err) {
    console.error('Join room error:', err)
    throw err
  }
})

import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../../utils/auth'

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

    const body = await readBody(event)
    const { betting_duration_minutes } = body

    const duration = typeof betting_duration_minutes === 'number' ? betting_duration_minutes : 5
    if (duration < 1) {
      throw createError({ statusCode: 400, statusMessage: '배팅 시간은 1분 이상이어야 합니다.' })
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from('betting_rooms')
      .select('id, organization_id, created_by, ended_at')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      throw createError({ statusCode: 404, statusMessage: '배팅 방을 찾을 수 없습니다.' })
    }

    if (room.ended_at) {
      throw createError({ statusCode: 400, statusMessage: '종료된 게임에는 새 라운드를 시작할 수 없습니다.' })
    }

    if (room.created_by !== userData.user_id) {
      throw createError({ statusCode: 403, statusMessage: '방 관리자만 라운드를 시작할 수 있습니다.' })
    }

    const { data: activeRound } = await supabaseAdmin
      .from('betting_rounds')
      .select('id')
      .eq('room_id', roomId)
      .in('status', ['betting', 'result_pending'])
      .limit(1)
      .maybeSingle()

    if (activeRound) {
      throw createError({ statusCode: 400, statusMessage: '진행 중인 라운드가 있습니다.' })
    }

    const startedAt = new Date()
    const endsAt = new Date(startedAt.getTime() + duration * 60 * 1000)

    const { data: round, error: roundError } = await supabaseAdmin
      .from('betting_rounds')
      .insert({
        room_id: roomId,
        betting_duration_minutes: duration,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'betting'
      })
      .select()
      .single()

    if (roundError) {
      console.error('Start round error:', roundError)
      throw createError({ statusCode: 500, statusMessage: '라운드 시작에 실패했습니다.' })
    }

    try {
      const channelName = getBettingChannelName(room.organization_id, roomId)
      const channel = supabaseAdmin.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: 'round_started',
        payload: { round }
      })
    } catch (broadcastErr) {
      console.warn('Realtime broadcast failed:', broadcastErr)
    }

    return { success: true, round }
  } catch (err) {
    console.error('Start round error:', err)
    throw err
  }
})

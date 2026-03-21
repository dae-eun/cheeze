import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, false)

    const { data: room, error } = await supabaseAdmin
      .from('quiz_rooms')
      .select('id, title, status, play_start_at, play_end_at, ranking_visible')
      .eq('id', roomId)
      .single()

    if (error || !room) {
      throw createError({ statusCode: 404, statusMessage: '방을 찾을 수 없습니다.' })
    }

    const { data: rules } = await supabaseAdmin
      .from('quiz_room_rules')
      .select('*')
      .eq('room_id', roomId)
      .single()

    const { count } = await supabaseAdmin
      .from('quiz_problems')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_active', true)

    const { data: existingSession } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, status, finished_at')
      .eq('room_id', roomId)
      .eq('user_id', user.user_id)
      .maybeSingle()

    const now = new Date()
    const canPlay = room.status === 'playing' &&
      (!room.play_start_at || new Date(room.play_start_at) <= now) &&
      (!room.play_end_at || new Date(room.play_end_at) >= now)

    return {
      room: { ...room, rules: rules || {} },
      problemCount: count || 0,
      canPlay,
      hasExistingSession: !!existingSession,
      existingSession: existingSession ? { id: existingSession.id, status: existingSession.status } : null,
      canStartNew: !existingSession || existingSession.status === 'playing'
    }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get play config error:', err)
    throw createError({ statusCode: 500, statusMessage: '플레이 설정을 불러오는데 실패했습니다.' })
  }
})

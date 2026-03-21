import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, true, user.user_id)

    const { data: sessions } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, user_id, started_at, finished_at, total_score, total_solved_count, total_wrong_count, total_elapsed_ms, status')
      .eq('room_id', roomId)
      .order('finished_at', { ascending: false, nullsFirst: false })
      .limit(200)

    if (!sessions || sessions.length === 0) {
      return { results: [] }
    }

    const userIds = [...new Set(sessions.map((s) => s.user_id))]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('id', userIds)

    const userMap = new Map((users || []).map((u) => [u.id, { name: u.name, email: u.email }]))

    const results = sessions.map((s) => ({
      ...s,
      userName: userMap.get(s.user_id)?.name || '알 수 없음',
      userEmail: userMap.get(s.user_id)?.email
    }))

    return { results }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get results error:', err)
    throw createError({ statusCode: 500, statusMessage: '결과를 불러오는데 실패했습니다.' })
  }
})

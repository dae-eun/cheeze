import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, false)

    const { data: room } = await supabaseAdmin
      .from('quiz_rooms')
      .select('id, ranking_visible')
      .eq('id', roomId)
      .single()

    if (!room || !room.ranking_visible) {
      return { ranking: [], rankingVisible: false }
    }

    const { data: sessions } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, user_id, total_score, total_solved_count, total_elapsed_ms, finished_at')
      .eq('room_id', roomId)
      .eq('status', 'completed')
      .eq('ranking_eligible', true)
      .order('total_score', { ascending: false })
      .order('total_elapsed_ms', { ascending: true })
      .order('finished_at', { ascending: true })
      .limit(100)

    if (!sessions || sessions.length === 0) {
      return { ranking: [], rankingVisible: true }
    }

    const userIds = [...new Set(sessions.map((s) => s.user_id))]
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', userIds)

    const userMap = new Map((users || []).map((u) => [u.id, u.name]))

    const ranking = sessions.map((s, i) => ({
      rank: i + 1,
      userId: s.user_id,
      name: userMap.get(s.user_id) || '알 수 없음',
      totalScore: s.total_score,
      totalSolvedCount: s.total_solved_count,
      totalElapsedMs: s.total_elapsed_ms,
      finishedAt: s.finished_at,
      isCurrentUser: s.user_id === user.user_id
    }))

    return { ranking, rankingVisible: true }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get ranking error:', err)
    throw createError({ statusCode: 500, statusMessage: '랭킹을 불러오는데 실패했습니다.' })
  }
})

import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, false)

    const { data: session } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, status')
      .eq('room_id', roomId)
      .eq('user_id', user.user_id)
      .maybeSingle()

    if (!session) {
      return { session: null, result: null }
    }

    const { data: sessionFull } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('*')
      .eq('id', session.id)
      .single()

    const { data: results } = await supabaseAdmin
      .from('quiz_problem_results')
      .select('*')
      .eq('session_id', session.id)
      .order('order_no', { ascending: true })

    const { data: room } = await supabaseAdmin
      .from('quiz_rooms')
      .select('id, title, ranking_visible')
      .eq('id', roomId)
      .single()

    const { count: totalProblems } = await supabaseAdmin
      .from('quiz_session_problem_orders')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id)

    return {
      session: { ...sessionFull, total_problems: totalProblems || 0 },
      results: results || [],
      room: room || {}
    }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get my result error:', err)
    throw createError({ statusCode: 500, statusMessage: '결과를 불러오는데 실패했습니다.' })
  }
})

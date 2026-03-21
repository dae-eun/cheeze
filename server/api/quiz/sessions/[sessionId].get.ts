import { getQuizAuth } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'sessionId')
    if (!sessionId) {
      throw createError({ statusCode: 400, statusMessage: '세션 ID가 필요합니다.' })
    }

    const { user, supabaseAdmin } = await getQuizAuth(event)

    const { data: session, error } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, room_id, user_id, started_at, finished_at, total_score, total_solved_count, total_wrong_count, total_elapsed_ms, status')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      throw createError({ statusCode: 404, statusMessage: '세션을 찾을 수 없습니다.' })
    }

    if (session.user_id !== user.user_id) {
      throw createError({ statusCode: 403, statusMessage: '이 세션에 접근할 수 없습니다.' })
    }

    const { data: orders } = await supabaseAdmin
      .from('quiz_session_problem_orders')
      .select('problem_id, order_no')
      .eq('session_id', sessionId)
      .order('order_no', { ascending: true })

    const { data: results } = await supabaseAdmin
      .from('quiz_problem_results')
      .select('problem_id, order_no, is_correct, elapsed_ms, click_count, earned_score, timeout_yn')
      .eq('session_id', sessionId)

    const completedOrderNos = new Set((results || []).map((r) => r.order_no))
    const currentOrderNo = orders
      ? Math.min(...orders.map((o) => o.order_no).filter((no) => !completedOrderNos.has(no)), 999999) || (orders.length > 0 ? orders[0].order_no : 1)
      : 1

    const currentProblem = orders?.find((o) => o.order_no === currentOrderNo)

    return {
      session,
      orders: orders || [],
      results: results || [],
      currentOrderNo,
      currentProblemId: currentProblem?.problem_id
    }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get session error:', err)
    throw createError({ statusCode: 500, statusMessage: '세션 정보를 불러오는데 실패했습니다.' })
  }
})

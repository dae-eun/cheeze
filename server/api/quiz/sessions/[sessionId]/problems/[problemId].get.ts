import { getQuizAuth } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'sessionId')
    const problemId = getRouterParam(event, 'problemId')
    if (!sessionId || !problemId) {
      throw createError({ statusCode: 400, statusMessage: '세션 ID와 문제 ID가 필요합니다.' })
    }

    const { user, supabaseAdmin } = await getQuizAuth(event)

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw createError({ statusCode: 404, statusMessage: '세션을 찾을 수 없습니다.' })
    }

    if (session.user_id !== user.user_id) {
      throw createError({ statusCode: 403, statusMessage: '이 세션에 접근할 수 없습니다.' })
    }

    const { data: order } = await supabaseAdmin
      .from('quiz_session_problem_orders')
      .select('order_no')
      .eq('session_id', sessionId)
      .eq('problem_id', problemId)
      .single()

    if (!order) {
      throw createError({ statusCode: 404, statusMessage: '해당 문제가 이 세션에 없습니다.' })
    }

    const { data: problem, error } = await supabaseAdmin
      .from('quiz_problems')
      .select('id, title, description, image_url, image_width, image_height, base_score, time_limit_sec, click_limit')
      .eq('id', problemId)
      .single()

    if (error || !problem) {
      throw createError({ statusCode: 404, statusMessage: '문제를 찾을 수 없습니다.' })
    }

    const { count: totalProblems } = await supabaseAdmin
      .from('quiz_session_problem_orders')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    return {
      problem: { ...problem, order_no: order.order_no },
      totalProblems: totalProblems || 0
    }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get session problem error:', err)
    throw createError({ statusCode: 500, statusMessage: '문제 정보를 불러오는데 실패했습니다.' })
  }
})

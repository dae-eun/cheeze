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
      .select('id, user_id, status, started_at')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      throw createError({ statusCode: 404, statusMessage: '세션을 찾을 수 없습니다.' })
    }

    if (session.user_id !== user.user_id) {
      throw createError({ statusCode: 403, statusMessage: '이 세션에 접근할 수 없습니다.' })
    }

    if (session.status === 'completed') {
      return { success: true, session, alreadyCompleted: true }
    }

    const now = new Date()
    const startedAt = new Date(session.started_at)
    const totalElapsedMs = now.getTime() - startedAt.getTime()

    const { data: results } = await supabaseAdmin
      .from('quiz_problem_results')
      .select('elapsed_ms')
      .eq('session_id', sessionId)

    const { data: sessionData } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('total_score, total_solved_count, total_wrong_count')
      .eq('id', sessionId)
      .single()

    const { error: updateError } = await supabaseAdmin
      .from('quiz_play_sessions')
      .update({
        finished_at: now.toISOString(),
        total_elapsed_ms: totalElapsedMs,
        status: 'completed',
        total_score: sessionData?.total_score ?? 0,
        total_solved_count: sessionData?.total_solved_count ?? 0,
        total_wrong_count: sessionData?.total_wrong_count ?? 0
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Complete session error:', updateError)
      throw createError({ statusCode: 500, statusMessage: '세션 완료 처리에 실패했습니다.' })
    }

    const { data: updated } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    return { success: true, session: updated, alreadyCompleted: false }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Complete session error:', err)
    throw createError({ statusCode: 500, statusMessage: '세션 완료 처리에 실패했습니다.' })
  }
})

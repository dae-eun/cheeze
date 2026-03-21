import { getQuizAuth } from '#quizUtils/quizAuth'
import { judgeClick } from '#quizUtils/quizJudge'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'sessionId')
    if (!sessionId) {
      throw createError({ statusCode: 400, statusMessage: '세션 ID가 필요합니다.' })
    }

    const { user, supabaseAdmin } = await getQuizAuth(event)

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, room_id, user_id, status')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw createError({ statusCode: 404, statusMessage: '세션을 찾을 수 없습니다.' })
    }

    if (session.user_id !== user.user_id) {
      throw createError({ statusCode: 403, statusMessage: '이 세션에 접근할 수 없습니다.' })
    }

    if (session.status !== 'playing') {
      throw createError({ statusCode: 400, statusMessage: '진행 중인 세션이 아닙니다.' })
    }

    const body = await readBody(event)
    const { problemId, normalizedX, normalizedY } = body

    if (!problemId || normalizedX === undefined || normalizedY === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'problemId, normalizedX, normalizedY가 필요합니다.' })
    }

    const x = Number(normalizedX)
    const y = Number(normalizedY)
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      throw createError({ statusCode: 400, statusMessage: 'normalizedX, normalizedY는 0~1 사이여야 합니다.' })
    }

    const { data: order } = await supabaseAdmin
      .from('quiz_session_problem_orders')
      .select('order_no')
      .eq('session_id', sessionId)
      .eq('problem_id', problemId)
      .single()

    if (!order) {
      throw createError({ statusCode: 400, statusMessage: '해당 문제가 이 세션에 없습니다.' })
    }

    const { data: existingResult } = await supabaseAdmin
      .from('quiz_problem_results')
      .select('id, is_correct')
      .eq('session_id', sessionId)
      .eq('problem_id', problemId)
      .maybeSingle()

    if (existingResult?.is_correct) {
      throw createError({ statusCode: 400, statusMessage: '이미 정답을 맞춘 문제입니다.' })
    }

    const { data: problem } = await supabaseAdmin
      .from('quiz_problems')
      .select('id, click_limit')
      .eq('id', problemId)
      .single()

    if (!problem) {
      throw createError({ statusCode: 404, statusMessage: '문제를 찾을 수 없습니다.' })
    }

    const { data: area } = await supabaseAdmin
      .from('quiz_answer_areas')
      .select('shape_type, points_json, tolerance')
      .eq('problem_id', problemId)
      .maybeSingle()

    if (!area) {
      throw createError({ statusCode: 400, statusMessage: '정답 영역이 설정되지 않은 문제입니다.' })
    }

    const { count: clickCount } = await supabaseAdmin
      .from('quiz_click_logs')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('problem_id', problemId)

    const remainingClicks = problem.click_limit - (clickCount || 0)
    if (remainingClicks <= 0) {
      throw createError({ statusCode: 400, statusMessage: '클릭 횟수를 모두 사용했습니다.' })
    }

    const correct = judgeClick(
      x,
      y,
      area.shape_type,
      area.points_json as { x?: number; y?: number; width?: number; height?: number; cx?: number; cy?: number; r?: number } | Array<{ x: number; y: number }>,
      Number(area.tolerance) || 0
    )

    const judgeResult = correct ? 'correct' : 'wrong'
    const newRemaining = remainingClicks - 1

    await supabaseAdmin.from('quiz_click_logs').insert({
      session_id: sessionId,
      problem_id: problemId,
      click_no: (clickCount || 0) + 1,
      normalized_x: x,
      normalized_y: y,
      judge_result: judgeResult
    })

    let earnedScore = 0
    if (correct) {
      const { data: probDetail } = await supabaseAdmin
        .from('quiz_problems')
        .select('base_score')
        .eq('id', problemId)
        .single()

      earnedScore = probDetail?.base_score || 100

      const { error: insertResultError } = await supabaseAdmin.from('quiz_problem_results').insert({
        session_id: sessionId,
        problem_id: problemId,
        order_no: order.order_no,
        is_correct: true,
        elapsed_ms: 0,
        paused_ms: 0,
        click_count: (clickCount || 0) + 1,
        remaining_click_count: newRemaining,
        timeout_yn: false,
        earned_score: earnedScore
      })

      if (insertResultError) {
        if (insertResultError.code === '23505') {
          return { correct: true, remainingClicks: newRemaining, earnedScore }
        }
        throw insertResultError
      }

      const { data: sessionData } = await supabaseAdmin
        .from('quiz_play_sessions')
        .select('total_score')
        .eq('id', sessionId)
        .single()

      const { data: allResults } = await supabaseAdmin
        .from('quiz_problem_results')
        .select('earned_score, is_correct')
        .eq('session_id', sessionId)

      const totalScore = (sessionData?.total_score ?? 0) + earnedScore
      const totalSolved = (allResults || []).filter((r) => r.is_correct).length

      await supabaseAdmin
        .from('quiz_play_sessions')
        .update({
          total_score: totalScore,
          total_solved_count: totalSolved
        })
        .eq('id', sessionId)
    } else if (newRemaining <= 0) {
      const { data: rules } = await supabaseAdmin
        .from('quiz_room_rules')
        .select('wrong_penalty')
        .eq('room_id', session.room_id)
        .single()

      const penalty = Math.max(0, Number(rules?.wrong_penalty) || 0)
      const earnedScoreForWrong = penalty > 0 ? -penalty : 0

      await supabaseAdmin.from('quiz_problem_results').insert({
        session_id: sessionId,
        problem_id: problemId,
        order_no: order.order_no,
        is_correct: false,
        elapsed_ms: 0,
        paused_ms: 0,
        click_count: problem.click_limit,
        remaining_click_count: 0,
        timeout_yn: false,
        earned_score: earnedScoreForWrong
      })

      const { data: wrongResults } = await supabaseAdmin
        .from('quiz_problem_results')
        .select('id')
        .eq('session_id', sessionId)
        .eq('is_correct', false)

      const totalWrong = (wrongResults || []).length + 1

      if (penalty > 0) {
        const { data: sessionData } = await supabaseAdmin
          .from('quiz_play_sessions')
          .select('total_score')
          .eq('id', sessionId)
          .single()

        const { data: allResults } = await supabaseAdmin
          .from('quiz_problem_results')
          .select('is_correct')
          .eq('session_id', sessionId)

        const totalScore = Math.max(0, (sessionData?.total_score ?? 0) + earnedScoreForWrong)
        const totalSolved = (allResults || []).filter((r) => r.is_correct).length

        await supabaseAdmin
          .from('quiz_play_sessions')
          .update({ total_score: totalScore, total_solved_count: totalSolved, total_wrong_count: totalWrong })
          .eq('id', sessionId)
      } else {
        await supabaseAdmin
          .from('quiz_play_sessions')
          .update({ total_wrong_count: totalWrong })
          .eq('id', sessionId)
      }
    } else {
      const { data: rules } = await supabaseAdmin
        .from('quiz_room_rules')
        .select('wrong_penalty')
        .eq('room_id', session.room_id)
        .single()

      const penalty = Math.max(0, Number(rules?.wrong_penalty) || 0)
      if (penalty > 0) {
        const { data: sessionData } = await supabaseAdmin
          .from('quiz_play_sessions')
          .select('total_score')
          .eq('id', sessionId)
          .single()

        const newTotal = Math.max(0, (sessionData?.total_score ?? 0) - penalty)
        await supabaseAdmin
          .from('quiz_play_sessions')
          .update({ total_score: newTotal })
          .eq('id', sessionId)
      }
    }

    return {
      correct,
      remainingClicks: newRemaining,
      earnedScore: correct ? earnedScore : undefined
    }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Click judge error:', err)
    throw createError({ statusCode: 500, statusMessage: '클릭 판정에 실패했습니다.' })
  }
})

import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const problemId = getRouterParam(event, 'problemId')
    if (!problemId) {
      throw createError({ statusCode: 400, statusMessage: '문제 ID가 필요합니다.' })
    }

    const { dbUser, supabaseAdmin } = await getQuizAuth(event)

    const { data: problem, error: problemError } = await supabaseAdmin
      .from('quiz_problems')
      .select('id, room_id')
      .eq('id', problemId)
      .single()

    if (problemError || !problem) {
      throw createError({ statusCode: 404, statusMessage: '문제를 찾을 수 없습니다.' })
    }

    await ensureRoomAccess(supabaseAdmin, problem.room_id, dbUser.organization_id, false)

    const { data: area, error } = await supabaseAdmin
      .from('quiz_answer_areas')
      .select('*')
      .eq('problem_id', problemId)
      .maybeSingle()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: '정답 영역을 불러오는데 실패했습니다.' })
    }

    return { answerArea: area }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get answer area error:', err)
    throw createError({ statusCode: 500, statusMessage: '정답 영역을 불러오는데 실패했습니다.' })
  }
})

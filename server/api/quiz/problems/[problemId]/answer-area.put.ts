import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const problemId = getRouterParam(event, 'problemId')
    if (!problemId) {
      throw createError({ statusCode: 400, statusMessage: '문제 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)

    const { data: problem, error: problemError } = await supabaseAdmin
      .from('quiz_problems')
      .select('id, room_id')
      .eq('id', problemId)
      .single()

    if (problemError || !problem) {
      throw createError({ statusCode: 404, statusMessage: '문제를 찾을 수 없습니다.' })
    }

    await ensureRoomAccess(supabaseAdmin, problem.room_id, dbUser.organization_id, true, user.user_id)

    const body = await readBody(event)
    const { shape_type = 'RECT', points_json, tolerance = 0, normalized_yn = true } = body

    if (!points_json) {
      throw createError({ statusCode: 400, statusMessage: '정답 영역 좌표(points_json)가 필요합니다.' })
    }

    const validShapes = ['RECT', 'POLYGON', 'CIRCLE']
    if (!validShapes.includes(shape_type)) {
      throw createError({ statusCode: 400, statusMessage: 'shape_type은 RECT, POLYGON, CIRCLE 중 하나여야 합니다.' })
    }

    const areaData = {
      problem_id: problemId,
      shape_type,
      points_json,
      tolerance: Number(tolerance) || 0,
      normalized_yn: !!normalized_yn
    }

    const { data: existing } = await supabaseAdmin
      .from('quiz_answer_areas')
      .select('id')
      .eq('problem_id', problemId)
      .maybeSingle()

    let result
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('quiz_answer_areas')
        .update({
          shape_type: areaData.shape_type,
          points_json: areaData.points_json,
          tolerance: areaData.tolerance,
          normalized_yn: areaData.normalized_yn
        })
        .eq('problem_id', problemId)
        .select()
        .single()

      if (error) {
        console.error('Update answer area error:', error)
        throw createError({ statusCode: 500, statusMessage: '정답 영역 저장에 실패했습니다.' })
      }
      result = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('quiz_answer_areas')
        .insert(areaData)
        .select()
        .single()

      if (error) {
        console.error('Insert answer area error:', error)
        throw createError({ statusCode: 500, statusMessage: '정답 영역 저장에 실패했습니다.' })
      }
      result = data
    }

    return { success: true, answerArea: result }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Save answer area error:', err)
    throw createError({ statusCode: 500, statusMessage: '정답 영역 저장에 실패했습니다.' })
  }
})

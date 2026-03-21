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

    const { error } = await supabaseAdmin.from('quiz_problems').delete().eq('id', problemId)

    if (error) {
      console.error('Delete quiz problem error:', error)
      throw createError({ statusCode: 500, statusMessage: '문제 삭제에 실패했습니다.' })
    }

    return { success: true }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Delete quiz problem error:', err)
    throw createError({ statusCode: 500, statusMessage: '문제 삭제에 실패했습니다.' })
  }
})

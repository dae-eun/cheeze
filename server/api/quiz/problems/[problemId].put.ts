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
    const { title, description, order_no, base_score, time_limit_sec, click_limit, is_active } = body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title?.trim() || null
    if (description !== undefined) updates.description = description?.trim() || null
    if (order_no !== undefined) updates.order_no = Math.max(0, Number(order_no) || 0)
    if (base_score !== undefined) updates.base_score = Math.max(0, Number(base_score) || 100)
    if (time_limit_sec !== undefined) updates.time_limit_sec = Math.max(5, Math.min(600, Number(time_limit_sec) || 30))
    if (click_limit !== undefined) updates.click_limit = Math.max(1, Math.min(99, Number(click_limit) || 5))
    if (is_active !== undefined) updates.is_active = !!is_active

    if (Object.keys(updates).length === 0) {
      const { data: p } = await supabaseAdmin.from('quiz_problems').select('*').eq('id', problemId).single()
      return { success: true, problem: p }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('quiz_problems')
      .update(updates)
      .eq('id', problemId)
      .select()
      .single()

    if (error) {
      console.error('Update quiz problem error:', error)
      throw createError({ statusCode: 500, statusMessage: '문제 수정에 실패했습니다.' })
    }

    return { success: true, problem: updated }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Update quiz problem error:', err)
    throw createError({ statusCode: 500, statusMessage: '문제 수정에 실패했습니다.' })
  }
})

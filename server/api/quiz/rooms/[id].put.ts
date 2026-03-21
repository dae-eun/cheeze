import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, true, user.user_id)

    const body = await readBody(event)
    const {
      title,
      description,
      thumbnail_url,
      status,
      is_public,
      play_start_at,
      play_end_at,
      ranking_visible,
      default_click_limit,
      default_time_limit_sec,
      wrong_penalty
    } = body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = typeof title === 'string' ? title.trim() : null
    if (description !== undefined) updates.description = description?.trim() || null
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url?.trim() || null
    if (status !== undefined && ['preparing', 'playing', 'ended'].includes(status)) updates.status = status
    if (is_public !== undefined) updates.is_public = !!is_public
    if (play_start_at !== undefined) updates.play_start_at = play_start_at || null
    if (play_end_at !== undefined) updates.play_end_at = play_end_at || null
    if (ranking_visible !== undefined) updates.ranking_visible = !!ranking_visible

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin.from('quiz_rooms').update(updates).eq('id', roomId)
      if (error) {
        console.error('Update quiz room error:', error)
        throw createError({ statusCode: 500, statusMessage: '방 수정에 실패했습니다.' })
      }
    }

    const ruleUpdates: Record<string, unknown> = {}
    if (default_click_limit !== undefined) ruleUpdates.default_click_limit = Math.max(1, Math.min(99, Number(default_click_limit) || 5))
    if (default_time_limit_sec !== undefined) ruleUpdates.default_time_limit_sec = Math.max(5, Math.min(600, Number(default_time_limit_sec) || 30))
    if (wrong_penalty !== undefined) ruleUpdates.wrong_penalty = Math.max(0, Math.min(999, Number(wrong_penalty) || 0))

    if (Object.keys(ruleUpdates).length > 0) {
      await supabaseAdmin.from('quiz_room_rules').update(ruleUpdates).eq('room_id', roomId)
    }

    const { data: room } = await supabaseAdmin.from('quiz_rooms').select('*').eq('id', roomId).single()
    return { success: true, room }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Update quiz room error:', err)
    throw createError({ statusCode: 500, statusMessage: '방 수정에 실패했습니다.' })
  }
})

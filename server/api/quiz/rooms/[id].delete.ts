import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, true, user.user_id)

    const { error } = await supabaseAdmin.from('quiz_rooms').delete().eq('id', roomId)

    if (error) {
      console.error('Delete quiz room error:', error)
      throw createError({ statusCode: 500, statusMessage: '방 삭제에 실패했습니다.' })
    }

    return { success: true }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Delete quiz room error:', err)
    throw createError({ statusCode: 500, statusMessage: '방 삭제에 실패했습니다.' })
  }
})

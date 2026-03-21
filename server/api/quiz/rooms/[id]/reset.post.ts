import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, true, user.user_id)

    const { error } = await supabaseAdmin
      .from('quiz_play_sessions')
      .delete()
      .eq('room_id', roomId)

    if (error) {
      console.error('Quiz reset error:', error)
      throw createError({ statusCode: 500, statusMessage: '게임 초기화에 실패했습니다.' })
    }

    return { success: true }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Quiz reset error:', err)
    throw createError({ statusCode: 500, statusMessage: '게임 초기화에 실패했습니다.' })
  }
})

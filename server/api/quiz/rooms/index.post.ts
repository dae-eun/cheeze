import { getQuizAuth } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    const body = await readBody(event)

    const {
      title,
      description,
      thumbnail_url,
      status = 'preparing',
      is_public = true,
      play_start_at,
      play_end_at,
      ranking_visible = true,
      default_click_limit = 5,
      default_time_limit_sec = 30,
      wrong_penalty = 0
    } = body

    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw createError({ statusCode: 400, statusMessage: '방 제목을 입력해주세요.' })
    }

    const roomData = {
      organization_id: dbUser.organization_id,
      created_by: user.user_id,
      title: title.trim(),
      description: description?.trim() || null,
      thumbnail_url: thumbnail_url?.trim() || null,
      status: ['preparing', 'playing', 'ended'].includes(status) ? status : 'preparing',
      is_public: !!is_public,
      play_start_at: play_start_at || null,
      play_end_at: play_end_at || null,
      ranking_visible: !!ranking_visible
    }

    const { data: room, error } = await supabaseAdmin
      .from('quiz_rooms')
      .insert(roomData)
      .select()
      .single()

    if (error) {
      console.error('Create quiz room error:', error)
      throw createError({ statusCode: 500, statusMessage: '방 생성에 실패했습니다.' })
    }

    const rulesData = {
      room_id: room.id,
      default_click_limit: Math.max(1, Math.min(99, Number(default_click_limit) || 5)),
      default_time_limit_sec: Math.max(5, Math.min(600, Number(default_time_limit_sec) || 30)),
      wrong_penalty: Math.max(0, Math.min(999, Number(wrong_penalty) || 0))
    }

    await supabaseAdmin.from('quiz_room_rules').insert(rulesData)

    return { success: true, room }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Create quiz room error:', err)
    throw createError({ statusCode: 500, statusMessage: '방 생성에 실패했습니다.' })
  }
})

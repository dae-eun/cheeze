import { getQuizAuth } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const { dbUser, supabaseAdmin } = await getQuizAuth(event)

    const { data: rooms, error } = await supabaseAdmin
      .from('quiz_rooms')
      .select('id, title, description, thumbnail_url, status, is_public, play_start_at, play_end_at, ranking_visible, created_by, created_at, updated_at')
      .eq('organization_id', dbUser.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('List quiz rooms error:', error)
      throw createError({ statusCode: 500, statusMessage: '방 목록을 불러오는데 실패했습니다.' })
    }

    return { rooms: rooms || [] }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('List quiz rooms error:', err)
    throw createError({ statusCode: 500, statusMessage: '방 목록을 불러오는데 실패했습니다.' })
  }
})

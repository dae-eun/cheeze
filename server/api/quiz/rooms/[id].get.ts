import { getQuizAuth } from '#quizUtils/quizAuth'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { dbUser, supabaseAdmin } = await getQuizAuth(event)

    const { data: room, error } = await supabaseAdmin
      .from('quiz_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error || !room) {
      throw createError({ statusCode: 404, statusMessage: '방을 찾을 수 없습니다.' })
    }

    if (room.organization_id !== dbUser.organization_id) {
      throw createError({ statusCode: 403, statusMessage: '이 방에 접근할 수 없습니다.' })
    }

    const { data: rules } = await supabaseAdmin
      .from('quiz_room_rules')
      .select('*')
      .eq('room_id', roomId)
      .single()

    const { data: problems } = await supabaseAdmin
      .from('quiz_problems')
      .select('id, title, description, image_url, image_width, image_height, order_no, base_score, time_limit_sec, click_limit, is_active')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('order_no', { ascending: true })

    const problemIds = (problems || []).map((p) => p.id)
    const { data: areas } = problemIds.length > 0
      ? await supabaseAdmin.from('quiz_answer_areas').select('problem_id').in('problem_id', problemIds)
      : { data: [] }
    const areaSet = new Set((areas || []).map((a) => a.problem_id))

    const problemsWithArea = (problems || []).map((p) => ({
      ...p,
      has_answer_area: areaSet.has(p.id)
    }))

    return {
      room: { ...room, rules: rules || {} },
      problems: problemsWithArea
    }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Get quiz room error:', err)
    throw createError({ statusCode: 500, statusMessage: '방 정보를 불러오는데 실패했습니다.' })
  }
})

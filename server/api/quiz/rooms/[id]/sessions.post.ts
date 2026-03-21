import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, false)

    const { data: room } = await supabaseAdmin
      .from('quiz_rooms')
      .select('id, status, play_start_at, play_end_at')
      .eq('id', roomId)
      .single()

    if (!room) {
      throw createError({ statusCode: 404, statusMessage: '방을 찾을 수 없습니다.' })
    }

    const now = new Date()
    const canPlay = room.status === 'playing' &&
      (!room.play_start_at || new Date(room.play_start_at) <= now) &&
      (!room.play_end_at || new Date(room.play_end_at) >= now)

    if (!canPlay) {
      throw createError({ statusCode: 400, statusMessage: '현재 플레이 가능한 시간이 아닙니다.' })
    }

    const { data: existingSession } = await supabaseAdmin
      .from('quiz_play_sessions')
      .select('id, status')
      .eq('room_id', roomId)
      .eq('user_id', user.user_id)
      .maybeSingle()

    if (existingSession) {
      if (existingSession.status === 'completed') {
        throw createError({ statusCode: 400, statusMessage: '이미 참여 완료한 방입니다. 결과만 조회할 수 있습니다.' })
      }
      return {
        success: true,
        session: existingSession,
        resumed: true
      }
    }

    const { data: problems } = await supabaseAdmin
      .from('quiz_problems')
      .select('id')
      .eq('room_id', roomId)
      .eq('is_active', true)

    if (!problems || problems.length === 0) {
      throw createError({ statusCode: 400, statusMessage: '플레이할 문제가 없습니다.' })
    }

    const { data: rules } = await supabaseAdmin
      .from('quiz_room_rules')
      .select('problem_order_type')
      .eq('room_id', roomId)
      .single()

    const orderType = rules?.problem_order_type || 'RANDOM'
    const orderedProblems = orderType === 'RANDOM' ? shuffleArray(problems) : problems

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('quiz_play_sessions')
      .insert({
        room_id: roomId,
        user_id: user.user_id,
        status: 'playing'
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('Create session error:', sessionError)
      throw createError({ statusCode: 500, statusMessage: '세션 생성에 실패했습니다.' })
    }

    const orderRows = orderedProblems.map((p, i) => ({
      session_id: session.id,
      problem_id: p.id,
      order_no: i + 1
    }))

    const { error: orderError } = await supabaseAdmin
      .from('quiz_session_problem_orders')
      .insert(orderRows)

    if (orderError) {
      console.error('Create session orders error:', orderError)
      await supabaseAdmin.from('quiz_play_sessions').delete().eq('id', session.id)
      throw createError({ statusCode: 500, statusMessage: '세션 생성에 실패했습니다.' })
    }

    return { success: true, session, resumed: false }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Create quiz session error:', err)
    throw createError({ statusCode: 500, statusMessage: '세션 생성에 실패했습니다.' })
  }
})

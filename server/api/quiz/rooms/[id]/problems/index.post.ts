import { getQuizAuth, ensureRoomAccess } from '#quizUtils/quizAuth'
import { parseMultipartImage, uploadQuizImage } from '#quizUtils/quizStorage'

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')
    if (!roomId) {
      throw createError({ statusCode: 400, statusMessage: '방 ID가 필요합니다.' })
    }

    const { user, dbUser, supabaseAdmin } = await getQuizAuth(event)
    await ensureRoomAccess(supabaseAdmin, roomId, dbUser.organization_id, true, user.user_id)

    const file = await parseMultipartImage(event)
    if (!file) {
      throw createError({ statusCode: 400, statusMessage: '이미지 파일을 업로드해주세요.' })
    }

    const { data: maxOrder } = await supabaseAdmin
      .from('quiz_problems')
      .select('order_no')
      .eq('room_id', roomId)
      .order('order_no', { ascending: false })
      .limit(1)
      .maybeSingle()

    const orderNo = (maxOrder?.order_no ?? 0) + 1

    const problemData = {
      room_id: roomId,
      title: '',
      description: null,
      image_url: '',
      image_width: null,
      image_height: null,
      order_no: orderNo,
      base_score: 100,
      time_limit_sec: 30,
      click_limit: 5,
      is_active: true
    }

    const { data: problem, error: insertError } = await supabaseAdmin
      .from('quiz_problems')
      .insert(problemData)
      .select()
      .single()

    if (insertError) {
      console.error('Create quiz problem error:', insertError)
      throw createError({ statusCode: 500, statusMessage: '문제 생성에 실패했습니다.' })
    }

    const imageUrl = await uploadQuizImage(
      supabaseAdmin,
      dbUser.organization_id,
      roomId,
      problem.id,
      file
    )

    const { error: updateError } = await supabaseAdmin
      .from('quiz_problems')
      .update({ image_url: imageUrl })
      .eq('id', problem.id)

    if (updateError) {
      console.error('Update quiz problem image error:', updateError)
    }

    const { data: updatedProblem } = await supabaseAdmin
      .from('quiz_problems')
      .select('*')
      .eq('id', problem.id)
      .single()

    return { success: true, problem: updatedProblem || problem }
  } catch (err) {
    if (err.statusCode) throw err
    console.error('Create quiz problem error:', err)
    throw createError({ statusCode: 500, statusMessage: '문제 생성에 실패했습니다.' })
  }
})

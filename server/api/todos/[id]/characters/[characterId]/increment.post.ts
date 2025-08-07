import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    const { id: todoId, characterId } = event.context.params as { id: string; characterId: string }
    
    // 인증 확인
    const token = getTokenFromCookie(event, 'access_token')
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증이 필요합니다.'
      })
    }

    const user = await verifyAccessToken(token)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '유효하지 않은 토큰입니다.'
      })
    }
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증이 필요합니다.'
      })
    }

    // 캐릭터가 현재 사용자의 것인지 확인
    const { data: character, error: characterError } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', user.user_id)
      .single()

    if (characterError || !character) {
      throw createError({
        statusCode: 403,
        statusMessage: '해당 캐릭터에 접근할 수 없습니다.'
      })
    }

    // todo_characters 레코드 조회
    const { data: todoCharacter, error: fetchError } = await supabaseAdmin
      .from('todo_characters')
      .select('*')
      .eq('todo_id', todoId)
      .eq('character_id', characterId)
      .eq('completion_date', new Date().toISOString().split('T')[0])
      .single()

    if (fetchError) {
      throw createError({
        statusCode: 404,
        statusMessage: '해당 숙제를 찾을 수 없습니다.'
      })
    }

    // 이미 완료된 경우
    if (todoCharacter.is_completed) {
      throw createError({
        statusCode: 400,
        statusMessage: '이미 완료된 숙제입니다.'
      })
    }

    // 반복횟수 증가
    const newCount = (todoCharacter.current_count || 0) + 1
    const targetCount = todoCharacter.target_count || 1

    // 업데이트
    const { data: updatedTodoCharacter, error: updateError } = await supabaseAdmin
      .from('todo_characters')
      .update({
        current_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', todoCharacter.id)
      .select()
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: '반복횟수 증가에 실패했습니다.'
      })
    }

    // 목표 횟수에 도달했는지 확인 (트리거가 자동으로 처리)
    const isCompleted = newCount >= targetCount

    return {
      success: true,
      message: `반복횟수가 증가했습니다. (${newCount}/${targetCount})`,
      data: {
        current_count: newCount,
        target_count: targetCount,
        is_completed: isCompleted
      }
    }

  } catch (error) {
    console.error('Increment count error:', error)
    throw error
  }
})

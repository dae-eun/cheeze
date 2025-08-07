import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
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

    const todoId = getRouterParam(event, 'id')
    const characterId = getRouterParam(event, 'characterId')
    const body = await readBody(event)
    const { is_completed } = body

    // 캐릭터가 사용자의 것인지 확인
    const { data: character, error: characterError } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('id', characterId)
      .eq('user_id', user.user_id)
      .single()

    if (characterError || !character) {
      throw createError({
        statusCode: 403,
        statusMessage: '캐릭터에 접근할 권한이 없습니다.'
      })
    }

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    // 기존 매핑이 있는지 확인
    const { data: existingMapping, error: existingError } = await supabaseAdmin
      .from('todo_characters')
      .select('id, is_completed')
      .eq('todo_id', todoId)
      .eq('character_id', characterId)
      .eq('completion_date', today)
      .single()

    if (existingMapping) {
      // 기존 매핑 업데이트
      const { data: updatedMapping, error: updateError } = await supabaseAdmin
        .from('todo_characters')
        .update({
          is_completed: is_completed,
          completed_at: is_completed ? new Date().toISOString() : null
        })
        .eq('id', existingMapping.id)
        .select()
        .single()

      if (updateError) {
        console.error('Todo character update error:', updateError)
        throw createError({
          statusCode: 500,
          statusMessage: '숙제 상태 업데이트에 실패했습니다.'
        })
      }

      return {
        success: true,
        todoCharacter: updatedMapping
      }
    } else {
      // 새로운 매핑 생성
      const { data: newMapping, error: createError } = await supabaseAdmin
        .from('todo_characters')
        .insert({
          todo_id: todoId,
          character_id: characterId,
          is_completed: is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
          completion_date: today
        })
        .select()
        .single()

      if (createError) {
        console.error('Todo character creation error:', createError)
        throw createError({
          statusCode: 500,
          statusMessage: '숙제 상태 생성에 실패했습니다.'
        })
      }

      return {
        success: true,
        todoCharacter: newMapping
      }
    }

  } catch (error) {
    console.error('Toggle todo character error:', error)
    throw error
  }
}) 
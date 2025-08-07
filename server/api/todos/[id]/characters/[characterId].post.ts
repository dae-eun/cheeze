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

    // 숙제가 존재하는지 확인
    const { data: todo, error: todoError } = await supabaseAdmin
      .from('todos')
      .select('id, target_count')
      .eq('id', todoId)
      .single()

    if (todoError || !todo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제를 찾을 수 없습니다.'
      })
    }

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

    // 이미 할당되어 있는지 확인
    const { data: existingMapping, error: existingError } = await supabaseAdmin
      .from('todo_characters')
      .select('id')
      .eq('todo_id', todoId)
      .eq('character_id', characterId)
      .eq('completion_date', today)
      .single()

    if (existingMapping) {
      throw createError({
        statusCode: 400,
        statusMessage: '이미 할당된 숙제입니다.'
      })
    }

    // 숙제를 캐릭터에 할당
    const { data: todoCharacter, error: assignError } = await supabaseAdmin
      .from('todo_characters')
      .insert({
        todo_id: todoId,
        character_id: characterId,
        is_completed: false,
        completion_date: today,
        target_count: todo.target_count || 1,
        current_count: 0
      })
      .select()
      .single()

    if (assignError) {
      console.error('Todo character assignment error:', assignError)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제 할당에 실패했습니다.'
      })
    }

    return {
      success: true,
      todoCharacter
    }

  } catch (error) {
    console.error('Assign todo to character error:', error)
    throw error
  }
}) 
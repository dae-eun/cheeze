import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../../utils/auth'

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

    const characterId = getRouterParam(event, 'id')

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

    // 해당 캐릭터의 숙제 매핑 가져오기
    const { data: todoCharacters, error: todoCharactersError } = await supabaseAdmin
      .from('todo_characters')
      .select(`
        id,
        todo_id,
        character_id,
        is_completed,
        completed_at,
        completion_date,
        created_at,
        updated_at
      `)
      .eq('character_id', characterId)
      .eq('completion_date', today)

    if (todoCharactersError) {
      console.error('Todo characters fetch error:', todoCharactersError)
      throw createError({
        statusCode: 500,
        statusMessage: '캐릭터 숙제 정보를 가져올 수 없습니다.'
      })
    }

    return {
      success: true,
      todoCharacters: todoCharacters || []
    }

  } catch (error) {
    console.error('Get character todos error:', error)
    throw error
  }
}) 
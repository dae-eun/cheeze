import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    // 사용자 인증 확인 (리프레시 토큰 자동 처리)
    let user = await authenticateUser(event)
    
    // 리프레시 토큰으로 인증된 경우, 새로운 액세스 토큰 발급
    if (user && !user.email) {
      try {
        user = await refreshTokenAndGetUser(event, supabaseAdmin)
      } catch (refreshError) {
        throw createError({
          statusCode: 401,
          statusMessage: '세션이 만료되었습니다. 다시 로그인해주세요.'
        })
      }
    }
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증이 필요합니다.'
      })
    }

    const { id: todoId, characterId } = getRouterParams(event)

    // 캐릭터가 현재 사용자에게 속하는지 확인
    const { data: character, error: characterError } = await supabaseAdmin
      .from('characters')
      .select('id, user_id')
      .eq('id', characterId)
      .single()

    if (characterError || !character) {
      throw createError({
        statusCode: 404,
        statusMessage: '캐릭터를 찾을 수 없습니다.'
      })
    }

    if (character.user_id !== user.user_id) {
      throw createError({
        statusCode: 403,
        statusMessage: '이 캐릭터에 대한 권한이 없습니다.'
      })
    }

    // 숙제가 존재하는지 확인
    const { data: todo, error: todoError } = await supabaseAdmin
      .from('todos')
      .select('id')
      .eq('id', todoId)
      .single()

    if (todoError || !todo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제를 찾을 수 없습니다.'
      })
    }

    // 오늘 날짜의 숙제-캐릭터 매핑 삭제
    const today = new Date().toISOString().split('T')[0]
    const { error: deleteError } = await supabaseAdmin
      .from('todo_characters')
      .delete()
      .eq('todo_id', todoId)
      .eq('character_id', characterId)
      .eq('completion_date', today)

    if (deleteError) {
      console.error('Delete todo character error:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제 제거에 실패했습니다.'
      })
    }

    return {
      success: true,
      message: '숙제가 성공적으로 제거되었습니다.'
    }
  } catch (error: any) {
    console.error('Delete todo character error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '숙제 제거 중 오류가 발생했습니다.'
    })
  }
}) 
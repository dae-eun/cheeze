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

    // 숙제 정보 조회 (주기 확인용)
    const { data: todo, error: todoError } = await supabaseAdmin
      .from('todos')
      .select('id, repeat_cycle')
      .eq('id', todoId)
      .single()

    if (todoError || !todo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제를 찾을 수 없습니다.'
      })
    }

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    // 삭제 쿼리 구성
    let deleteQuery = supabaseAdmin
      .from('todo_characters')
      .delete()
      .eq('todo_id', todoId)
      .eq('character_id', characterId)

    // 주간 숙제의 경우 현재 주 전체에서 삭제
    if (todo.repeat_cycle === 'weekly') {
      const currentDate = new Date()
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // 일요일
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // 토요일

      const startOfWeekStr = startOfWeek.toISOString().split('T')[0]
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

      deleteQuery = deleteQuery
        .gte('completion_date', startOfWeekStr)
        .lte('completion_date', endOfWeekStr)
    } else {
      // 일간/주말 숙제는 오늘 날짜로만 삭제
      deleteQuery = deleteQuery.eq('completion_date', today)
    }

    const { error: deleteError } = await deleteQuery

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
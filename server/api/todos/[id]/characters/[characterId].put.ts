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
    const { is_completed, is_shared } = body
    
    console.log('PUT 요청 본문:', body)
    console.log('is_completed:', is_completed, 'type:', typeof is_completed)
    console.log('is_shared:', is_shared, 'type:', typeof is_shared)

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

    // target_count는 트리거에서 처리하므로 별도 조회 불필요

    // 기존 매핑이 있는지 확인
    const { data: existingMapping, error: existingError } = await supabaseAdmin
      .from('todo_characters')
      .select('id, is_completed, is_shared, current_count')
      .eq('todo_id', todoId)
      .eq('character_id', characterId)
      .eq('completion_date', today)
      .single()

    if (existingMapping) {
      // 요청 본문에서 is_shared 값 가져오기 (기존 값 유지하거나 새 값 사용)
      const isShared = is_shared !== undefined ? is_shared : existingMapping.is_shared

      // 기존 매핑 업데이트
      const updateData: any = {
        is_completed: is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
        is_shared: isShared
      }

      // 완료 상태 변경 시 current_count 설정
      if (is_completed === false) {
        updateData.current_count = 0  // 되돌리기 시 0으로 초기화
      }
      // 완료 시 current_count는 트리거에서 적절히 처리됨

      // 카운트 기반 자동 완료는 데이터베이스 트리거에서 처리

      const { data: updatedMapping, error: updateError } = await supabaseAdmin
        .from('todo_characters')
        .update(updateData)
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
      // 요청 본문에서 is_shared 값 가져오기 (기본값 false)
      const isShared = is_shared !== undefined ? is_shared : false

      // 새로운 매핑 생성
      let currentCount = 0
      if (is_completed === false) {
        currentCount = 0  // 미완료 시 0
      }
      // 완료 시 current_count는 트리거에서 적절히 처리됨

      const insertData: any = {
        todo_id: todoId,
        character_id: characterId,
        is_completed: is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
        completion_date: today,
        is_shared: isShared,
        current_count: currentCount
      }

      // 카운트 기반 자동 완료는 데이터베이스 트리거에서 처리

      const { data: newMapping, error: insertError } = await supabaseAdmin
        .from('todo_characters')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error('Todo character creation error:', insertError)
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
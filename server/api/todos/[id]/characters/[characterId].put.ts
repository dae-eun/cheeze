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

    // 숙제 정보 조회 (주기 확인용)
    const { data: todoInfo, error: todoInfoError } = await supabaseAdmin
      .from('todos')
      .select('repeat_cycle')
      .eq('id', todoId)
      .single()

    if (todoInfoError || !todoInfo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제를 찾을 수 없습니다.'
      })
    }

    // 기존 매핑 검색 쿼리 구성
    let query = supabaseAdmin
      .from('todo_characters')
      .select('id, is_completed, is_shared, current_count, completion_date')
      .eq('todo_id', todoId)
      .eq('character_id', characterId)

    // 주간 숙제의 경우 현재 주 전체에서 검색
    if (todoInfo.repeat_cycle === 'weekly') {
      const currentDate = new Date()
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // 일요일
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // 토요일

      const startOfWeekStr = startOfWeek.toISOString().split('T')[0]
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

      query = query
        .gte('completion_date', startOfWeekStr)
        .lte('completion_date', endOfWeekStr)
    } else {
      // 일간/주말 숙제는 오늘 날짜로만 검색
      query = query.eq('completion_date', today)
    }

    const { data: existingMappings, error: existingError } = await query

    if (existingError) {
      console.error('Existing mapping search error:', existingError)
      throw createError({
        statusCode: 500,
        statusMessage: '기존 숙제 매핑 조회에 실패했습니다.'
      })
    }

    // 주간 숙제의 경우 여러 레코드가 있을 수 있으므로 가장 최근 것을 선택
    const existingMapping = existingMappings && existingMappings.length > 0 
      ? existingMappings.sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())[0]
      : null

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

      // completion_date 설정: 주간 숙제는 오늘 날짜, 일간/주말은 오늘 날짜
      let completionDate = today
      
      const insertData: any = {
        todo_id: todoId,
        character_id: characterId,
        is_completed: is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
        completion_date: completionDate,
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
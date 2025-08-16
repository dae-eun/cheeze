import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    const { id: todoId, characterId } = event.context.params as { id: string; characterId: string }
    
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

    // 대상 todo 정보(주기/목표 횟수) 조회
    const { data: todoInfo, error: todoInfoError } = await supabaseAdmin
      .from('todos')
      .select('repeat_cycle, target_count')
      .eq('id', todoId)
      .single()

    if (todoInfoError || !todoInfo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제를 찾을 수 없습니다.'
      })
    }

    // 기준 날짜 계산
    const todayStr = new Date().toISOString().split('T')[0]
    let fetchQuery = supabaseAdmin
      .from('todo_characters')
      .select('*')
      .eq('todo_id', todoId)
      .eq('character_id', characterId)

    if (todoInfo.repeat_cycle === 'weekly') {
      const currentDate = new Date()
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0]
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0]
      fetchQuery = fetchQuery
        .gte('completion_date', startOfWeekStr)
        .lte('completion_date', endOfWeekStr)
        .order('completion_date', { ascending: false })
        .limit(1)
    } else {
      fetchQuery = fetchQuery
        .eq('completion_date', todayStr)
        .limit(1)
    }

    const { data: foundRows, error: fetchError } = await fetchQuery

    let todoCharacter = (foundRows && foundRows[0]) || null

    // 없으면 과거 최신 레코드를 오늘로 이월하여 업데이트(선호 동작)
    if (!todoCharacter) {
      // 직전 레코드에서 공유 설정 승계 시도
      const { data: lastRow } = await supabaseAdmin
        .from('todo_characters')
        .select('id,is_shared,current_count,target_count,completion_date')
        .eq('todo_id', todoId)
        .eq('character_id', characterId)
        .order('completion_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const isShared = lastRow?.is_shared ?? false
      const prevCount = lastRow?.current_count ?? 0
      const targetCount = (lastRow?.target_count as number | undefined) || (todoInfo.target_count || 1)
      const newCount = prevCount + 1
      const willComplete = newCount >= targetCount && targetCount > 0

      if (lastRow?.id) {
        // 과거 최신 레코드를 오늘 날짜로 이월 업데이트
        const { data: updatedRow, error: carryUpdateError } = await supabaseAdmin
          .from('todo_characters')
          .update({
            completion_date: todayStr,
            current_count: newCount,
            is_completed: willComplete,
            completed_at: willComplete ? new Date().toISOString() : null,
            is_shared: isShared,
            updated_at: new Date().toISOString()
          })
          .eq('id', lastRow.id)
          .select()
          .single()

        if (carryUpdateError) {
          throw createError({
            statusCode: 500,
            statusMessage: '숙제 레코드 이월 업데이트에 실패했습니다.'
          })
        }

        return {
          success: true,
          message: `반복횟수가 증가했습니다. (${newCount}/${targetCount})`,
          data: {
            current_count: newCount,
            target_count: targetCount,
            is_completed: willComplete
          }
        }
      } else {
        // 완전 최초 케이스: 기존 레코드가 아예 없으면 새로 생성
        const { data: newRow, error: insertError } = await supabaseAdmin
          .from('todo_characters')
          .insert({
            todo_id: todoId,
            character_id: characterId,
            is_completed: willComplete,
            completed_at: willComplete ? new Date().toISOString() : null,
            completion_date: todayStr,
            current_count: newCount,
            target_count: targetCount,
            is_shared: isShared
          })
          .select()
          .single()

        if (insertError) {
          throw createError({
            statusCode: 500,
            statusMessage: '숙제 레코드 생성에 실패했습니다.'
          })
        }

        return {
          success: true,
          message: `반복횟수가 증가했습니다. (${newCount}/${targetCount})`,
          data: {
            current_count: newCount,
            target_count: targetCount,
            is_completed: willComplete
          }
        }
      }
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

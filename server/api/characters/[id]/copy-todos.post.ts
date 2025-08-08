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
    const body = await readBody(event)
    const { sourceCharacterId } = body

    if (!sourceCharacterId) {
      throw createError({
        statusCode: 400,
        statusMessage: '복사할 캐릭터 ID가 필요합니다.'
      })
    }

    // 대상 캐릭터가 사용자의 것인지 확인
    const { data: targetCharacter, error: targetCharacterError } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('id', characterId)
      .eq('user_id', user.user_id)
      .single()

    if (targetCharacterError || !targetCharacter) {
      throw createError({
        statusCode: 403,
        statusMessage: '대상 캐릭터에 접근할 권한이 없습니다.'
      })
    }

    // 소스 캐릭터가 사용자의 것인지 확인
    const { data: sourceCharacter, error: sourceCharacterError } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('id', sourceCharacterId)
      .eq('user_id', user.user_id)
      .single()

    if (sourceCharacterError || !sourceCharacter) {
      throw createError({
        statusCode: 403,
        statusMessage: '소스 캐릭터에 접근할 권한이 없습니다.'
      })
    }

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    // 소스 캐릭터의 숙제 목록 가져오기
    const { data: sourceTodoCharacters, error: sourceTodoCharactersError } = await supabaseAdmin
      .from('todo_characters')
      .select(`
        todo_id,
        target_count,
        is_shared
      `)
      .eq('character_id', sourceCharacterId)
      .eq('completion_date', today)

    if (sourceTodoCharactersError) {
      console.error('Source todo characters fetch error:', sourceTodoCharactersError)
      throw createError({
        statusCode: 500,
        statusMessage: '소스 캐릭터의 숙제 정보를 가져올 수 없습니다.'
      })
    }

    if (!sourceTodoCharacters || sourceTodoCharacters.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '복사할 숙제가 없습니다.'
      })
    }

    // 대상 캐릭터의 기존 숙제 확인
    const { data: existingTodoCharacters, error: existingTodoCharactersError } = await supabaseAdmin
      .from('todo_characters')
      .select('todo_id')
      .eq('character_id', characterId)
      .eq('completion_date', today)

    if (existingTodoCharactersError) {
      console.error('Existing todo characters fetch error:', existingTodoCharactersError)
      throw createError({
        statusCode: 500,
        statusMessage: '기존 숙제 정보를 가져올 수 없습니다.'
      })
    }

    const existingTodoIds = (existingTodoCharacters || []).map(tc => tc.todo_id)

    // 복사할 숙제 필터링 (이미 할당된 숙제 제외)
    const todosToCopy = sourceTodoCharacters.filter(tc => !existingTodoIds.includes(tc.todo_id))

    if (todosToCopy.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '복사할 새로운 숙제가 없습니다. (이미 모두 할당되어 있음)'
      })
    }

    // 숙제 복사
    const copyPromises = todosToCopy.map(tc => 
      supabaseAdmin
        .from('todo_characters')
        .insert({
          todo_id: tc.todo_id,
          character_id: characterId,
          is_completed: false,
          completion_date: today,
          target_count: tc.target_count,
          current_count: 0,
          is_shared: tc.is_shared
        })
        .select()
        .single()
    )

    const copyResults = await Promise.all(copyPromises)
    const copyErrors = copyResults.filter(result => result.error)

    if (copyErrors.length > 0) {
      console.error('Copy todos error:', copyErrors)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제 복사 중 오류가 발생했습니다.'
      })
    }

    const copiedTodos = copyResults.map(result => result.data).filter(Boolean)

    return {
      success: true,
      message: `${copiedTodos.length}개의 숙제가 성공적으로 복사되었습니다.`,
      copiedTodos
    }

  } catch (error) {
    console.error('Copy character todos error:', error)
    throw error
  }
})

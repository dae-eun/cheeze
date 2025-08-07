import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../utils/auth'

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

    // 시스템 사용자만 접근 가능
    if (user.organization_id !== null) {
      throw createError({
        statusCode: 403,
        statusMessage: '관리자만 접근할 수 있습니다.'
      })
    }

    // 모든 todo_characters 레코드를 가져와서 개별적으로 업데이트
    const { data: todoCharacters, error: fetchError } = await supabaseAdmin
      .from('todo_characters')
      .select('id, todo_id, target_count')

    if (fetchError) {
      console.error('Fetch todo characters error:', fetchError)
      throw createError({
        statusCode: 500,
        statusMessage: 'todo_characters 데이터를 가져올 수 없습니다.'
      })
    }

    let updatedCount = 0
    for (const tc of todoCharacters || []) {
      // 해당 todo의 target_count 가져오기
      const { data: todo, error: todoError } = await supabaseAdmin
        .from('todos')
        .select('target_count')
        .eq('id', tc.todo_id)
        .single()

      if (todoError || !todo) continue

      // target_count가 다르거나 null인 경우 업데이트
      if (tc.target_count !== todo.target_count) {
        const { error: updateError } = await supabaseAdmin
          .from('todo_characters')
          .update({ target_count: todo.target_count })
          .eq('id', tc.id)

        if (!updateError) {
          updatedCount++
        }
      }
    }

    return {
      success: true,
      message: 'target_count가 성공적으로 업데이트되었습니다.',
      updatedRecords: updatedCount,
      totalRecords: todoCharacters?.length || 0
    }

  } catch (error) {
    console.error('Update target counts error:', error)
    throw error
  }
})

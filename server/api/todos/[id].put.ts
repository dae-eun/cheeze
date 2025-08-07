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

    const todoId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { title, description, repeat_cycle, progress_type } = body

    // 입력 검증
    if (!title || title.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: '숙제 제목을 입력해주세요.'
      })
    }

    // 반복주기 검증
    if (!repeat_cycle || !['daily', 'weekly', 'weekend'].includes(repeat_cycle)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바른 반복주기를 선택해주세요.'
      })
    }

    // 진행종류 검증
    if (!progress_type || !['dungeon', 'quest', 'purchase', 'other'].includes(progress_type)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바른 진행종류를 선택해주세요.'
      })
    }

    // 숙제목록 존재 확인 및 권한 확인
    const { data: existingTodo, error: fetchError } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .single()

    if (fetchError || !existingTodo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제목록을 찾을 수 없습니다.'
      })
    }

    // 사용자의 조직 정보 가져오기
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.user_id)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      throw createError({
        statusCode: 500,
        statusMessage: '사용자 정보를 가져올 수 없습니다.'
      })
    }

    // 권한 확인 (관리자 숙제이거나 같은 조직의 숙제이거나 본인이 만든 숙제)
    if (!existingTodo.is_admin_todo && 
        existingTodo.organization_id !== userData.organization_id &&
        existingTodo.created_by !== user.user_id) {
      throw createError({
        statusCode: 403,
        statusMessage: '숙제목록을 수정할 권한이 없습니다.'
      })
    }

    // 숙제목록 수정
    const { data: updatedTodo, error: updateError } = await supabaseAdmin
      .from('todos')
      .update({
        title: title.trim(),
        description: description?.trim() || '',
        repeat_cycle: repeat_cycle,
        progress_type: progress_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', todoId)
      .select()
      .single()

    if (updateError) {
      console.error('Todo update error:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제목록 수정에 실패했습니다.'
      })
    }

    return {
      success: true,
      todo: updatedTodo
    }

  } catch (error) {
    console.error('Update todo error:', error)
    throw error
  }
}) 
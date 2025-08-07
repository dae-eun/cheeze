import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    // 인증 확인 (리프레시 토큰 자동 처리)
    let userData = await authenticateUser(event)
    
    if (!userData) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증이 필요합니다.'
      })
    }

    // 리프레시 토큰으로 인증된 경우, 새로운 액세스 토큰 발급
    if (!userData.email) {
      try {
        userData = await refreshTokenAndGetUser(event, supabaseAdmin)
      } catch (refreshError) {
        throw createError({
          statusCode: 401,
          statusMessage: '세션이 만료되었습니다. 다시 로그인해주세요.'
        })
      }
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
    if (!repeat_cycle || !['없음', '일간', '주간', '월간'].includes(repeat_cycle)) {
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
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userData.user_id)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      throw createError({
        statusCode: 500,
        statusMessage: '사용자 정보를 가져올 수 없습니다.'
      })
    }

    // 권한 확인 (관리자 숙제가거나 같은 조직의 숙제가거나 본인이 만든 숙제)
    if (!existingTodo.is_admin_todo && 
        existingTodo.organization_id !== dbUser.organization_id &&
        existingTodo.created_by !== userData.user_id) {
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
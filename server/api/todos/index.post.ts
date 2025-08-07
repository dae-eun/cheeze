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

    // 숙제목록 추가
    const todoData = {
      title: title.trim(),
      description: description?.trim() || '',
      repeat_cycle: repeat_cycle,
      progress_type: progress_type,
      created_by: user.user_id,
      organization_id: userData.organization_id || null,
      is_admin_todo: false
    }
    
    const { data: todo, error: todoError } = await supabaseAdmin
      .from('todos')
      .insert(todoData)
      .select()
      .single()

    if (todoError) {
      console.error('Todo creation error:', todoError)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제목록 추가에 실패했습니다.'
      })
    }

    return {
      success: true,
      todo
    }

  } catch (error) {
    console.error('Create todo error:', error)
    throw error
  }
}) 
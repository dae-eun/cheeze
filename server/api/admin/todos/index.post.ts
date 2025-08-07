import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../utils/auth'

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

    // 시스템 계정 확인 (organization_id가 null인 사용자)
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userData.user_id)
      .maybeSingle()

    if (userError || !dbUser) {
      throw createError({
        statusCode: 401,
        statusMessage: '사용자 정보를 찾을 수 없습니다.'
      })
    }

    // 시스템 계정이 아니면 접근 거부
    if (dbUser.organization_id !== null) {
      throw createError({
        statusCode: 403,
        statusMessage: '시스템 계정만 접근할 수 있습니다.'
      })
    }

    const body = await readBody(event)
    const { title, description, progress_type, repeat_cycle, organization_id, target_count = 1 } = body

    // 입력 검증
    if (!title || !progress_type || !repeat_cycle) {
      throw createError({
        statusCode: 400,
        statusMessage: '필수 정보를 모두 입력해주세요.'
      })
    }

    // 진행 종류 검증
    const validProgressTypes = ['dungeon', 'quest', 'purchase', 'exchange', 'other']
    if (!validProgressTypes.includes(progress_type)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바르지 않은 진행 종류입니다.'
      })
    }

    // 반복 주기 검증
    const validRepeatCycles = ['없음', '일간', '주간', '월간']
    if (!validRepeatCycles.includes(repeat_cycle)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바르지 않은 반복 주기입니다.'
      })
    }

    // 목표 횟수 검증
    if (target_count < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: '목표 횟수는 1 이상이어야 합니다.'
      })
    }

    // 시스템 숙제 생성
    const { data: todo, error: todoError } = await supabaseAdmin
      .from('todos')
      .insert({
        title: title,
        description: description || '',
        progress_type: progress_type,
        repeat_cycle: repeat_cycle,
        target_count: target_count,
        is_admin_todo: true,
        created_by: userData.user_id,
        organization_id: organization_id || null
      })
      .select()
      .maybeSingle()

    if (todoError) {
      console.error('Todo creation error:', todoError)
      console.error('Todo creation details:', {
        title,
        description,
        progress_type,
        repeat_cycle,
        is_admin_todo: true,
        created_by: userData.user_id,
        organization_id: organization_id || null
      })
      throw createError({
        statusCode: 500,
        statusMessage: `시스템 숙제 생성 중 오류가 발생했습니다: ${todoError.message}`
      })
    }

    if (!todo) {
      throw createError({
        statusCode: 500,
        statusMessage: '시스템 숙제 생성에 실패했습니다.'
      })
    }

    return {
      success: true,
      message: '시스템 숙제가 성공적으로 생성되었습니다.',
      todo: todo
    }

  } catch (error) {
    console.error('Create system todo error:', error)
    throw error
  }
})

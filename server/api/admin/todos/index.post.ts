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

    // 시스템 계정 확인 (organization_id가 null인 사용자)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.user_id)
      .maybeSingle()

    if (userError || !userData) {
      throw createError({
        statusCode: 401,
        statusMessage: '사용자 정보를 찾을 수 없습니다.'
      })
    }

    // 시스템 계정이 아니면 접근 거부
    if (userData.organization_id !== null) {
      throw createError({
        statusCode: 403,
        statusMessage: '시스템 계정만 접근할 수 있습니다.'
      })
    }

    const body = await readBody(event)
    const { title, description, progress_type, repeat_cycle, organization_id } = body

    // 입력 검증
    if (!title || !progress_type || !repeat_cycle) {
      throw createError({
        statusCode: 400,
        statusMessage: '필수 정보를 모두 입력해주세요.'
      })
    }

    // 진행 종류 검증
    const validProgressTypes = ['아르바이트', '던전', '퀘스트', '기타']
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

    // 시스템 숙제 생성
    const { data: todo, error: todoError } = await supabaseAdmin
      .from('todos')
      .insert({
        title: title,
        description: description || '',
        progress_type: progress_type,
        repeat_cycle: repeat_cycle,
        is_admin_todo: true,
        created_by: user.user_id,
        organization_id: organization_id || null
      })
      .select()
      .maybeSingle()

    if (todoError) {
      console.error('Todo creation error:', todoError)
      throw createError({
        statusCode: 500,
        statusMessage: '시스템 숙제 생성 중 오류가 발생했습니다.'
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
      message: '시스템 숙제이 성공적으로 생성되었습니다.',
      todo: todo
    }

  } catch (error) {
    console.error('Create system todo error:', error)
    throw error
  }
})

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
    const { name } = body

    // 입력 검증
    if (!name || name.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: '조직명을 입력해주세요.'
      })
    }

    // 초대코드 생성 (6자리 랜덤 문자열)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // 조직 생성
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: name.trim(),
        invite_code: inviteCode
      })
      .select()
      .maybeSingle()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      throw createError({
        statusCode: 500,
        statusMessage: '조직 생성 중 오류가 발생했습니다.'
      })
    }

    if (!organization) {
      throw createError({
        statusCode: 500,
        statusMessage: '조직 생성에 실패했습니다.'
      })
    }

    return {
      success: true,
      message: '조직이 성공적으로 생성되었습니다.',
      organization: organization
    }

  } catch (error) {
    console.error('Create organization error:', error)
    throw error
  }
})

import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../../utils/auth'

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

    const orgId = getRouterParam(event, 'id')

    // 조직 존재 확인
    const { data: existingOrg, error: fetchError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (fetchError || !existingOrg) {
      throw createError({
        statusCode: 404,
        statusMessage: '조직을 찾을 수 없습니다.'
      })
    }

    // 새로운 초대코드 생성 (6자리 랜덤 문자열)
    const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // 초대코드 업데이트
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ invite_code: newInviteCode })
      .eq('id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Invite code update error:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: '초대코드 갱신 중 오류가 발생했습니다.'
      })
    }

    return {
      success: true,
      message: '초대코드가 성공적으로 갱신되었습니다.',
      organization: updatedOrg
    }

  } catch (error) {
    console.error('Regenerate invite code error:', error)
    throw error
  }
})

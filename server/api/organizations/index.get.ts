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

    // 시스템 계정이거나 사용자의 조직만 조회 가능
    let query = supabaseAdmin
      .from('organizations')
      .select('id, name, invite_code, created_at')

    // 시스템 계정이 아니면 본인 조직만 조회
    if (dbUser.organization_id !== null) {
      query = query.eq('id', dbUser.organization_id)
    }

    const { data: organizations, error: orgError } = await query.order('name')

    if (orgError) {
      console.error('Organizations fetch error:', orgError)
      throw createError({
        statusCode: 500,
        statusMessage: '조직 목록을 가져올 수 없습니다.'
      })
    }

    return {
      success: true,
      organizations: organizations || []
    }

  } catch (error) {
    console.error('Get organizations error:', error)
    throw error
  }
})

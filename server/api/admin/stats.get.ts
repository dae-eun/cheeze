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

    // 통계 데이터 수집
    const [
      { count: totalUsers },
      { count: totalOrganizations },
      { count: systemTodos },
      { count: totalTodos }
    ] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('organizations')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin_todo', true),
      supabaseAdmin
        .from('todos')
        .select('*', { count: 'exact', head: true })
    ])

    // 조직별 사용자 수 조회
    const { data: orgUserCounts, error: orgUserError } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        name,
        users:users(count)
      `)

    if (orgUserError) {
      console.error('Organization user count error:', orgUserError)
    }

    // 조직별 사용자 수 매핑
    const organizationStats = orgUserCounts?.map(org => ({
      id: org.id,
      name: org.name,
      user_count: org.users?.[0]?.count || 0
    })) || []

    return {
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        totalOrganizations: totalOrganizations || 0,
        systemTodos: systemTodos || 0,
        totalTodos: totalTodos || 0,
        organizationStats
      }
    }

  } catch (error) {
    console.error('Get admin stats error:', error)
    throw error
  }
})



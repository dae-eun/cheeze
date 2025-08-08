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

    // 쿼리 파라미터 가져오기
    const query = getQuery(event)
    const search = query.search as string
    const organizationId = query.organization_id as string
    const sortBy = query.sort_by as string || 'created_at'
    const sortOrder = query.sort_order as string || 'desc'
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 50
    const offset = (page - 1) * limit

    // 기본 쿼리 구성
    let queryBuilder = supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        organization_id,
        created_at,
        characters:characters(
          id,
          name,
          server_id,
          is_main,
          servers:servers(name)
        )
      `)

    // 검색 필터 적용
    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 조직 필터 적용
    if (organizationId) {
      queryBuilder = queryBuilder.eq('organization_id', organizationId)
    }

    // 정렬 적용
    if (sortBy === 'name') {
      queryBuilder = queryBuilder.order('name', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'email') {
      queryBuilder = queryBuilder.order('email', { ascending: sortOrder === 'asc' })
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // 페이지네이션 적용
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    // 데이터 조회
    const { data: users, error: usersError, count } = await queryBuilder

    if (usersError) {
      throw createError({
        statusCode: 500,
        statusMessage: '사용자 목록을 가져오는 중 오류가 발생했습니다.'
      })
    }

    // 조직 정보 조회
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .order('name')

    if (orgError) {
      console.error('Organization fetch error:', orgError)
    }

    // 사용자 데이터 가공
    const processedUsers = users?.map(user => ({
      ...user,
      character_count: user.characters?.length || 0
    })) || []

    return {
      success: true,
      users: processedUsers,
      organizations: organizations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }

  } catch (error) {
    console.error('Get admin users error:', error)
    throw error
  }
})

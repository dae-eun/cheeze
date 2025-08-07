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

    // todo 조회
    const { data: todo, error: todoError } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .single()

    if (todoError || !todo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제를 찾을 수 없습니다.'
      })
    }

    // 권한 확인 (관리자 숙제이거나 같은 조직의 숙제이거나 본인이 만든 숙제)
    if (!todo.is_admin_todo && 
        todo.organization_id !== dbUser.organization_id &&
        todo.created_by !== userData.user_id) {
      throw createError({
        statusCode: 403,
        statusMessage: '이 숙제에 접근할 권한이 없습니다.'
      })
    }

    return {
      success: true,
      todo: todo
    }

  } catch (error) {
    console.error('Get todo error:', error)
    throw error
  }
})

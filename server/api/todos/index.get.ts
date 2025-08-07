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



    // 숙제목록 가져오기 (시스템 숙제 + 사용자 본인 숙제)
    let query = supabaseAdmin
      .from('todos')
      .select(`
        id,
        title,
        description,
        created_at,
        updated_at,
        created_by,
        is_admin_todo,
        organization_id,
        repeat_cycle,
        progress_type
      `)

    // 시스템(관리자) 숙제과 사용자 본인이 생성한 숙제만 표시
    query = query.or(`is_admin_todo.eq.true,created_by.eq.${userData.user_id}`)

    const { data: todos, error: todosError } = await query.order('created_at', { ascending: false })

    if (todosError) {
      console.error('Todos fetch error:', todosError)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제목록을 가져올 수 없습니다.'
      })
    }

    return {
      success: true,
      todos: todos || []
    }

  } catch (error) {
    console.error('Get todos error:', error)
    throw error
  }
}) 
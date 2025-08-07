import { createClient } from '@supabase/supabase-js'
import { authenticateUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 쿠키에서 토큰 확인
    const userData = authenticateUser(event)
    
    if (!userData) {
      return {
        success: false,
        message: '인증되지 않은 사용자입니다.'
      }
    }

    // 사용자 정보 조회
    const config = useRuntimeConfig()
    const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, organization_id')
      .eq('id', userData.user_id)
      .maybeSingle()

    if (error || !user) {
      return {
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization_id: user.organization_id
      }
    }

  } catch (error) {
    console.error('Auth check error:', error)
    return {
      success: false,
      message: '인증 확인 중 오류가 발생했습니다.'
    }
  }
}) 
import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 쿠키에서 토큰 확인 (리프레시 토큰 자동 처리)
    const userData = await authenticateUser(event)
    
    if (!userData) {
      return {
        success: false,
        message: '인증되지 않은 사용자입니다.'
      }
    }

    // 리프레시 토큰으로 인증된 경우 (userData.email이 빈 문자열), 사용자 정보 조회 필요
    if (!userData.email) {
      const config = useRuntimeConfig()
      const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)
      
      try {
        const refreshedUser = await refreshTokenAndGetUser(event, supabaseAdmin)
        
        return {
          success: true,
          user: {
            id: refreshedUser.user_id,
            email: refreshedUser.email,
            name: refreshedUser.name,
            organization_id: refreshedUser.organization_id
          }
        }
      } catch (refreshError) {
        return {
          success: false,
          message: '세션이 만료되었습니다. 다시 로그인해주세요.'
        }
      }
    }

    // 액세스 토큰으로 인증된 경우, 사용자 정보 반환
    return {
      success: true,
      user: {
        id: userData.user_id,
        email: userData.email,
        name: userData.name,
        organization_id: userData.organization_id
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
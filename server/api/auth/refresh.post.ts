import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

// JWT 시크릿 키
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'
const REFRESH_SECRET = 'your-super-secret-refresh-key-change-in-production'

export default defineEventHandler(async (event) => {
  try {
    // 쿠키에서 리프레시 토큰 가져오기
    const refresh_token = getCookie(event, 'refresh_token')

    if (!refresh_token) {
      throw createError({
        statusCode: 400,
        statusMessage: '리프레시 토큰이 필요합니다.'
      })
    }

    // 리프레시 토큰 검증
    let decoded
    try {
      decoded = jwt.verify(refresh_token, REFRESH_SECRET) as { user_id: string }
    } catch (error) {
      throw createError({
        statusCode: 401,
        statusMessage: '유효하지 않은 리프레시 토큰입니다.'
      })
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, organization_id')
      .eq('id', decoded.user_id)
      .maybeSingle()

    if (userError) {
      console.error('User lookup error:', userError)
      throw createError({
        statusCode: 500,
        statusMessage: '토큰 갱신 중 오류가 발생했습니다.'
      })
    }

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '사용자를 찾을 수 없습니다.'
      })
    }

    // 새로운 액세스 토큰 생성
    const newAccessToken = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        name: user.name,
        organization_id: user.organization_id
      },
      JWT_SECRET,
      { expiresIn: '15m' } // 15분
    )

    // 새로운 액세스 토큰을 쿠키에 설정
    setCookie(event, 'access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 // 15분
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization_id: user.organization_id
      }
    }

  } catch (error) {
    console.error('Token refresh error:', error)
    throw error
  }
}) 
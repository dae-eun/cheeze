import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

// JWT 시크릿 키 (실제 프로덕션에서는 환경변수로 관리)
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'
const REFRESH_SECRET = 'your-super-secret-refresh-key-change-in-production'

export default defineEventHandler(async (event) => {
  try {
    console.log('Login API called')
    const body = await readBody(event)
    console.log('Login request body:', body)
    const { email, password } = body

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '이메일과 비밀번호를 입력해주세요.'
      })
    }

    // 사용자 조회
    console.log('Looking up user with email:', email)
    console.log('Supabase config:', {
      url: config.public.supabaseUrl,
      hasAnonKey: !!config.public.supabaseAnonKey
    })
    
    let user, userError
    try {
      const result = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      
      user = result.data
      userError = result.error

      console.log('User lookup result:', { user, userError })
    } catch (dbError) {
      console.error('Database query error:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: '데이터베이스 연결 오류가 발생했습니다.'
      })
    }

    if (userError) {
      console.error('User lookup error:', userError)
      throw createError({
        statusCode: 500,
        statusMessage: '로그인 처리 중 오류가 발생했습니다.'
      })
    }

    if (!user) {
      console.log('User not found for email:', email)
      throw createError({
        statusCode: 401,
        statusMessage: '이메일 또는 비밀번호가 올바르지 않습니다.'
      })
    }

    // 비밀번호 검증
    console.log('Login password verification:', {
      inputPassword: password,
      storedSalt: user.salt,
      storedHash: user.password_hash
    })
    
    const hashedPassword = await hashPassword(password, user.salt)
    console.log('Computed hash:', hashedPassword)
    console.log('Hash match:', hashedPassword === user.password_hash)
    
    if (hashedPassword !== user.password_hash) {
      console.error('Password verification failed')
      throw createError({
        statusCode: 401,
        statusMessage: '이메일 또는 비밀번호가 올바르지 않습니다.'
      })
    }

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        name: user.name,
        organization_id: user.organization_id
      },
      JWT_SECRET,
      { expiresIn: '15m' } // 15분
    )

    // 리프레시 토큰 생성
    const refreshToken = jwt.sign(
      {
        user_id: user.id
      },
      REFRESH_SECRET,
      { expiresIn: '7d' } // 7일
    )

    // 쿠키 설정
    setCookie(event, 'access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 // 15분
    })
    
    setCookie(event, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7일
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization_id: user.organization_id,
        is_system: user.organization_id === null
      }
    }

  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
})

import { hashPassword } from '../../utils/auth' 
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'
const REFRESH_SECRET = 'your-super-secret-refresh-key-change-in-production'

interface TokenPayload {
  user_id: string
  email: string
  name: string
  organization_id: string
  exp: number
  iat: number
}

// Salt 생성 함수
export function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// 비밀번호 해시 함수
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

// 쿠키에서 토큰 가져오기
export const getTokenFromCookie = (event: any, name: string): string | null => {
  return getCookie(event, name) || null
}

// 액세스 토큰 검증
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

// 리프레시 토큰 검증
export const verifyRefreshToken = (token: string): { user_id: string } | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { user_id: string }
  } catch {
    return null
  }
}

// 토큰 만료 확인
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    return Date.now() >= decoded.exp * 1000
  } catch {
    return true
  }
}

// 사용자 인증 미들웨어 (리프레시 토큰 자동 처리)
export const authenticateUser = async (event: any): Promise<TokenPayload | null> => {
  const token = getTokenFromCookie(event, 'access_token')
  
  // 액세스 토큰이 있고 유효한 경우
  if (token && !isTokenExpired(token)) {
    const verified = verifyAccessToken(token)
    if (verified) return verified
  }
  
  // 액세스 토큰이 없거나 만료된 경우, 리프레시 토큰 시도
  const refresh_token = getTokenFromCookie(event, 'refresh_token')
  if (!refresh_token) return null
  
  try {
    const decoded = verifyRefreshToken(refresh_token)
    if (!decoded) return null
    
    // 여기서는 사용자 정보를 반환하지 않고, 호출하는 쪽에서 처리하도록 함
    // 실제 토큰 갱신은 각 API 엔드포인트에서 처리
    return {
      user_id: decoded.user_id,
      email: '', // 리프레시 토큰에는 이메일 정보가 없으므로 빈 문자열
      name: '', // 리프레시 토큰에는 이름 정보가 없으므로 빈 문자열
      organization_id: '', // 리프레시 토큰에는 organization_id 정보가 없으므로 빈 문자열
      exp: 0,
      iat: 0
    }
  } catch {
    return null
  }
}

// 토큰 갱신 및 사용자 정보 반환 함수
export const refreshTokenAndGetUser = async (event: any, supabaseAdmin: any): Promise<TokenPayload> => {
  const refresh_token = getTokenFromCookie(event, 'refresh_token')
  
  if (!refresh_token) {
    throw createError({
      statusCode: 401,
      statusMessage: '리프레시 토큰이 필요합니다.'
    })
  }

  try {
    const decoded = verifyRefreshToken(refresh_token)
    if (!decoded) {
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

    if (userError || !user) {
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
      { expiresIn: '15m' }
    )

    // 새로운 액세스 토큰을 쿠키에 설정
    setCookie(event, 'access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60
    })

    return {
      user_id: user.id,
      email: user.email,
      name: user.name,
      organization_id: user.organization_id,
      exp: 0,
      iat: 0
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw createError({
      statusCode: 401,
      statusMessage: '세션이 만료되었습니다. 다시 로그인해주세요.'
    })
  }
} 
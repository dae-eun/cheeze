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

// 사용자 인증 미들웨어
export const authenticateUser = (event: any): TokenPayload | null => {
  const token = getTokenFromCookie(event, 'access_token')
  if (!token) return null
  
  if (isTokenExpired(token)) return null
  
  return verifyAccessToken(token)
} 
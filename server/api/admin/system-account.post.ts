import { createClient } from '@supabase/supabase-js'
import { hashPassword, generateSalt } from '../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, name } = body

    // 입력 검증
    if (!email || !password || !name) {
      throw createError({
        statusCode: 400,
        statusMessage: '필수 정보를 모두 입력해주세요.'
      })
    }

    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: '비밀번호는 최소 6자 이상이어야 합니다.'
      })
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: '올바른 이메일 형식을 입력해주세요.'
      })
    }

    // 기존 사용자 확인
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (checkError) {
      console.error('User check error:', checkError)
      throw createError({
        statusCode: 500,
        statusMessage: '사용자 확인 중 오류가 발생했습니다.'
      })
    }

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: '이미 존재하는 이메일입니다.'
      })
    }

               // 비밀번호 해시화
           const salt = generateSalt()
           const hashedPassword = await hashPassword(password, salt)

    // 시스템 계정 생성 (organization_id는 null로 설정)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        password_hash: hashedPassword,
        salt: salt,
        name: name,
        organization_id: null // 시스템 계정은 조직에 속하지 않음
      })
      .select()
      .maybeSingle()

    if (userError) {
      console.error('System account creation error:', userError)
      throw createError({
        statusCode: 500,
        statusMessage: '시스템 계정 생성 중 오류가 발생했습니다.'
      })
    }

    if (!user) {
      throw createError({
        statusCode: 500,
        statusMessage: '시스템 계정 생성에 실패했습니다.'
      })
    }

    return {
      success: true,
      message: '시스템 계정이 성공적으로 생성되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }

  } catch (error) {
    console.error('System account creation error:', error)
    throw error
  }
})

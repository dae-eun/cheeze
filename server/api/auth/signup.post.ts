import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    // 데이터베이스 연결 테스트
    console.log('Testing database connection...')
    console.log('Service role key available:', !!config.supabaseServiceKey)
    
    const { data: testData, error: testError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    console.log('Database connection test:', { testData, testError })
    
    if (testError) {
      console.error('Database connection failed:', testError)
      throw createError({
        statusCode: 500,
        statusMessage: '데이터베이스 연결에 실패했습니다.'
      })
    }
    
    const body = await readBody(event)
    console.log('Signup request body:', body)
    
    const { email, password, name, inviteCode, mainCharacter, subCharacters } = body

    // 입력 검증
    if (!email || !password || !name || !inviteCode) {
      console.log('Missing required fields:', { email: !!email, password: !!password, name: !!name, inviteCode: !!inviteCode })
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

    if (!mainCharacter?.name || !mainCharacter?.serverId) {
      throw createError({
        statusCode: 400,
        statusMessage: '메인 캐릭터 정보를 모두 입력해주세요.'
      })
    }

    // 서브 캐릭터 검증
    for (const character of subCharacters || []) {
      if (!character.name || !character.serverId) {
        throw createError({
          statusCode: 400,
          statusMessage: '서브 캐릭터 정보를 모두 입력해주세요.'
        })
      }
    }

    // 1. 초대코드로 조직 확인
    console.log('Looking up organization with invite code:', inviteCode)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    console.log('Organization lookup result:', { organization, orgError })

    if (orgError) {
      console.error('Organization lookup error:', orgError)
      throw createError({
        statusCode: 500,
        statusMessage: '조직 확인 중 오류가 발생했습니다.'
      })
    }

    if (!organization) {
      console.log('Organization not found for invite code:', inviteCode)
      throw createError({
        statusCode: 400,
        statusMessage: '유효하지 않은 초대코드입니다.'
      })
    }

    // 2. 이메일 중복 확인
    const { data: existingUser, error: emailCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (emailCheckError) {
      console.error('Email check error:', emailCheckError)
      throw createError({
        statusCode: 500,
        statusMessage: '이메일 확인 중 오류가 발생했습니다.'
      })
    }

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: '이미 가입된 이메일입니다.'
      })
    }

    // 3. 비밀번호 암호화 (Salt + Hash)
    const salt = generateSalt()
    const hashedPassword = await hashPassword(password, salt)

    // 4. 사용자 생성 (service role 사용)
    console.log('Creating user with data:', { email, name, organization_id: organization.id })
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        password_hash: hashedPassword,
        salt: salt,
        name: name,
        organization_id: organization.id
      })
      .select()
      .maybeSingle()

    console.log('User creation result:', { user, userError })

    if (userError) {
      console.error('User creation error:', userError)
      throw createError({
        statusCode: 500,
        statusMessage: '회원가입 중 오류가 발생했습니다.'
      })
    }

    if (!user) {
      console.log('User creation failed: no data returned')
      throw createError({
        statusCode: 500,
        statusMessage: '사용자 생성에 실패했습니다.'
      })
    }

    // 5. 메인 캐릭터 생성 (service role 사용)
    const { error: mainCharError } = await supabaseAdmin
      .from('characters')
      .insert({
        user_id: user.id,
        name: mainCharacter.name,
        server_id: mainCharacter.serverId,
        is_main: true
      })

    if (mainCharError) {
      console.error('Main character creation error:', mainCharError)
      throw createError({
        statusCode: 500,
        statusMessage: '메인 캐릭터 생성 중 오류가 발생했습니다.'
      })
    }

    // 6. 서브 캐릭터들 생성
    if (subCharacters && subCharacters.length > 0) {
      const subCharactersData = subCharacters.map(character => ({
        user_id: user.id,
        name: character.name,
        server_id: character.serverId,
        is_main: false
      }))

      const { error: subCharError } = await supabaseAdmin
        .from('characters')
        .insert(subCharactersData)

      if (subCharError) {
        console.error('Sub characters creation error:', subCharError)
        throw createError({
          statusCode: 500,
          statusMessage: '서브 캐릭터 생성 중 오류가 발생했습니다.'
        })
      }
    }

    return {
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization_id: user.organization_id
      }
    }

  } catch (error) {
    console.error('Signup error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    throw error
  }
})

import { hashPassword, generateSalt } from '../../utils/auth' 
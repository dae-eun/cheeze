import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)

export default defineEventHandler(async (event) => {
  try {
    // 1. organizations 테이블 확인
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
    
    console.log('Organizations:', organizations)
    console.log('Organizations error:', orgError)

    // 2. servers 테이블 확인
    const { data: servers, error: serverError } = await supabase
      .from('servers')
      .select('*')
    
    console.log('Servers:', servers)
    console.log('Servers error:', serverError)

    // 3. users 테이블 확인
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
    
    console.log('Users:', users)
    console.log('Users error:', userError)

    return {
      success: true,
      organizations: {
        data: organizations,
        error: orgError
      },
      servers: {
        data: servers,
        error: serverError
      },
      users: {
        data: users,
        error: userError
      }
    }

  } catch (error) {
    console.error('Test DB error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}) 
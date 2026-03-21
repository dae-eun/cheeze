import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    let userData = await authenticateUser(event)
    if (!userData) {
      throw createError({ statusCode: 401, statusMessage: '인증이 필요합니다.' })
    }
    if (!userData.email) {
      userData = await refreshTokenAndGetUser(event, supabaseAdmin)
    }

    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userData.user_id)
      .single()

    if (userError || !dbUser) {
      throw createError({ statusCode: 500, statusMessage: '사용자 정보를 가져올 수 없습니다.' })
    }

    if (dbUser.organization_id === null) {
      throw createError({ statusCode: 403, statusMessage: '조직에 소속된 사용자만 배팅 방을 이용할 수 있습니다.' })
    }

    const { data: rooms, error } = await supabaseAdmin
      .from('betting_rooms')
      .select('id, organization_id, created_by, title, initial_funds, ended_at, created_at, updated_at')
      .eq('organization_id', dbUser.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Betting rooms fetch error:', error)
      throw createError({ statusCode: 500, statusMessage: '배팅 방 목록을 가져올 수 없습니다.' })
    }

    return { success: true, rooms: rooms || [] }
  } catch (err) {
    console.error('Get betting rooms error:', err)
    throw err
  }
})

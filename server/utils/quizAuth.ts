import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { authenticateUser, refreshTokenAndGetUser } from './auth'

const config = useRuntimeConfig()

export async function getQuizAuth(event: H3Event) {
  const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)
  let userData = await authenticateUser(event)
  if (!userData) {
    throw createError({ statusCode: 401, statusMessage: '인증이 필요합니다.' })
  }
  if (!userData.email) {
    userData = await refreshTokenAndGetUser(event, supabaseAdmin)
  }

  const { data: dbUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, organization_id')
    .eq('id', userData.user_id)
    .single()

  if (userError || !dbUser) {
    throw createError({ statusCode: 500, statusMessage: '사용자 정보를 가져올 수 없습니다.' })
  }

  if (dbUser.organization_id === null) {
    throw createError({ statusCode: 403, statusMessage: '조직에 소속된 사용자만 퀴즈 기능을 이용할 수 있습니다.' })
  }

  return { user: userData, dbUser, supabaseAdmin }
}

export async function ensureRoomAccess(
  supabaseAdmin: ReturnType<typeof createClient>,
  roomId: string,
  organizationId: string,
  checkCreator = false,
  creatorUserId?: string
) {
  const { data: room, error } = await supabaseAdmin
    .from('quiz_rooms')
    .select('id, organization_id, created_by')
    .eq('id', roomId)
    .single()

  if (error || !room) {
    throw createError({ statusCode: 404, statusMessage: '방을 찾을 수 없습니다.' })
  }

  if (room.organization_id !== organizationId) {
    throw createError({ statusCode: 403, statusMessage: '이 방에 접근할 수 없습니다.' })
  }

  if (checkCreator && creatorUserId && room.created_by !== creatorUserId) {
    throw createError({ statusCode: 403, statusMessage: '방 생성자만 이 작업을 수행할 수 있습니다.' })
  }

  return room
}

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
      throw createError({ statusCode: 403, statusMessage: '조직에 소속된 사용자만 배팅 방을 생성할 수 있습니다.' })
    }

    const body = await readBody(event)
    const { title, initial_funds, distribution_method, payout_mode, fee_percent } = body

    const funds = typeof initial_funds === 'number' ? initial_funds : 10000
    if (funds < 1) {
      throw createError({ statusCode: 400, statusMessage: '초기 자금은 1 이상이어야 합니다.' })
    }

    const method = ['carry_over', 'disappear'].includes(distribution_method) ? distribution_method : 'carry_over'
    const payout = ['pool', 'double'].includes(payout_mode) ? payout_mode : 'pool'
    const fee = typeof fee_percent === 'number' ? Math.max(0, Math.min(100, Math.floor(fee_percent))) : 0

    const roomData = {
      organization_id: dbUser.organization_id,
      created_by: userData.user_id,
      title: title?.trim() || null,
      initial_funds: funds,
      distribution_method: method,
      payout_mode: payout,
      fee_percent: fee
    }

    const { data: room, error } = await supabaseAdmin
      .from('betting_rooms')
      .insert(roomData)
      .select()
      .single()

    if (error) {
      console.error('Create betting room error:', error)
      throw createError({ statusCode: 500, statusMessage: '배팅 방 생성에 실패했습니다.' })
    }

    const { error: participantError } = await supabaseAdmin.from('room_participants').insert({
      room_id: room.id,
      user_id: userData.user_id,
      balance: funds
    })

    if (participantError) {
      console.error('Add creator to participants error:', participantError)
    }

    return { success: true, room }
  } catch (err) {
    console.error('Create betting room error:', err)
    throw err
  }
})

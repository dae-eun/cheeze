import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

interface ReorderBody {
  orderedIds?: string[]
  orders?: Array<{ id: string; order: number }>
}

export default defineEventHandler(async (event) => {
  try {
    // 인증 확인
    const token = getTokenFromCookie(event, 'access_token')
    if (!token) {
      throw createError({ statusCode: 401, statusMessage: '인증이 필요합니다.' })
    }

    const user = await verifyAccessToken(token)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '유효하지 않은 토큰입니다.' })
    }

    const body = (await readBody(event)) as ReorderBody
    if ((!body.orderedIds || body.orderedIds.length === 0) && (!body.orders || body.orders.length === 0)) {
      throw createError({ statusCode: 400, statusMessage: '정렬 정보가 필요합니다.' })
    }

    // 현재 사용자의 서브 캐릭터만 대상으로 함 (is_main = false)
    // 메인 캐릭터는 항상 최상단 유지 (is_main desc 정렬 우선)
    if (body.orderedIds && body.orderedIds.length > 0) {
      // orderedIds의 순서를 1부터 부여
      const updates = body.orderedIds.map((id, index) => ({ id, order: index + 1 }))
      // 다중 업데이트 수행
      for (const u of updates) {
        const { error: updateError } = await supabaseAdmin
          .from('characters')
          .update({ order: u.order })
          .eq('id', u.id)
          .eq('user_id', user.user_id)
          .eq('is_main', false)
        if (updateError) {
          console.error('Reorder update error:', updateError)
          throw createError({ statusCode: 500, statusMessage: '정렬 업데이트 중 오류가 발생했습니다.' })
        }
      }
    } else if (body.orders && body.orders.length > 0) {
      for (const u of body.orders) {
        const { error: updateError } = await supabaseAdmin
          .from('characters')
          .update({ order: u.order })
          .eq('id', u.id)
          .eq('user_id', user.user_id)
          .eq('is_main', false)
        if (updateError) {
          console.error('Reorder update error:', updateError)
          throw createError({ statusCode: 500, statusMessage: '정렬 업데이트 중 오류가 발생했습니다.' })
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Characters reorder error:', error)
    throw error
  }
})



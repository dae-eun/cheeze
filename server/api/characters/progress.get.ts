import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

type RepeatCycle = 'daily' | 'weekly' | 'weekend'

export default defineEventHandler(async (event) => {
  try {
    const token = getTokenFromCookie(event, 'access_token')
    if (!token) {
      throw createError({ statusCode: 401, statusMessage: '인증이 필요합니다.' })
    }

    const user = await verifyAccessToken(token)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '유효하지 않은 토큰입니다.' })
    }

    // 사용자 캐릭터 목록 가져오기 (id만)
    const { data: characters, error: charactersError } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('user_id', user.user_id)

    if (charactersError) {
      console.error('Characters fetch error:', charactersError)
      throw createError({ statusCode: 500, statusMessage: '캐릭터 조회 중 오류가 발생했습니다.' })
    }

    const characterIds: string[] = (characters || []).map((c: any) => c.id)

    // 캐릭터가 없으면 빈 결과 반환
    if (characterIds.length === 0) {
      return { success: true, progress: {} }
    }

    // 최소 컬럼 + todos.repeat_cycle 동시 조회
    const { data: tcRows, error: tcError } = await supabaseAdmin
      .from('todo_characters')
      .select(`
        character_id,
        todo_id,
        is_completed,
        completion_date,
        updated_at,
        todos ( repeat_cycle )
      `)
      .in('character_id', characterIds)

    if (tcError) {
      console.error('Todo characters fetch error:', tcError)
      throw createError({ statusCode: 500, statusMessage: '숙제 진행률 조회에 실패했습니다.' })
    }

    // 최신 레코드 선별: (character_id, todo_id) 기준으로 completion_date DESC, updated_at DESC
    const latestMap = new Map<string, any>()
    for (const row of tcRows || []) {
      const key = `${row.character_id}__${row.todo_id}`
      const current = latestMap.get(key)
      if (!current) {
        latestMap.set(key, row)
        continue
      }
      const aDate = (row.completion_date || '') as string
      const bDate = (current.completion_date || '') as string
      if (aDate > bDate) {
        latestMap.set(key, row)
      } else if (aDate === bDate) {
        const aUpdated = (row.updated_at || '') as string
        const bUpdated = (current.updated_at || '') as string
        if (aUpdated > bUpdated) {
          latestMap.set(key, row)
        }
      }
    }

    // 집계: 캐릭터별, 반복 주기별 total / completed
    const result: Record<string, Record<RepeatCycle, { total: number; completed: number }>> = {}

    // 기본 0값 세팅
    for (const id of characterIds) {
      result[id] = {
        daily: { total: 0, completed: 0 },
        weekly: { total: 0, completed: 0 },
        weekend: { total: 0, completed: 0 }
      }
    }

    for (const row of latestMap.values()) {
      const cId = row.character_id as string
      const cycle = ((row as any).todos?.repeat_cycle || 'daily') as RepeatCycle
      if (!result[cId]) continue
      result[cId][cycle].total += 1
      if (row.is_completed) result[cId][cycle].completed += 1
    }

    return { success: true, progress: result }
  } catch (error) {
    console.error('Characters progress API error:', error)
    throw error
  }
})



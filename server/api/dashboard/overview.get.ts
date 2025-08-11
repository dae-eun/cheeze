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

    // 사용자 캐릭터 목록 (id, name, is_main, servers.name)
    const { data: characters, error: charactersError } = await supabaseAdmin
      .from('characters')
      .select('id, name, is_main, servers(name)')
      .eq('user_id', user.user_id)

    if (charactersError) {
      console.error('Characters fetch error:', charactersError)
      throw createError({ statusCode: 500, statusMessage: '캐릭터 조회 중 오류가 발생했습니다.' })
    }

    const characterIds: string[] = (characters || []).map((c: any) => c.id)
    if (characterIds.length === 0) {
      return { success: true, total: { total: 0, completed: 0, pending: 0, completionRate: 0 }, characters: [] }
    }

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
      throw createError({ statusCode: 500, statusMessage: '대시보드 통계 조회에 실패했습니다.' })
    }

    // 최신 레코드 선별
    const latestMap = new Map<string, any>()
    for (const row of tcRows || []) {
      const key = `${row.character_id}__${row.todo_id}`
      const current = latestMap.get(key)
      if (!current) { latestMap.set(key, row); continue }
      const aDate = (row.completion_date || '') as string
      const bDate = (current.completion_date || '') as string
      if (aDate > bDate) {
        latestMap.set(key, row)
      } else if (aDate === bDate) {
        const aUpdated = (row.updated_at || '') as string
        const bUpdated = (current.updated_at || '') as string
        if (aUpdated > bUpdated) latestMap.set(key, row)
      }
    }

    // 전체 합산
    const latestList = Array.from(latestMap.values())
    const total = latestList.length
    const completed = latestList.filter(r => r.is_completed).length
    const pending = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 캐릭터별/주기별 통계
    const perCharacter: Record<string, { daily: any; weekly: any; weekend: any; total: number; completed: number; pending: number; completionRate: number }> = {}
    for (const c of characters || []) {
      perCharacter[c.id] = {
        daily: { total: 0, completed: 0, pending: 0, completionRate: 0 },
        weekly: { total: 0, completed: 0, pending: 0, completionRate: 0 },
        weekend: { total: 0, completed: 0, pending: 0, completionRate: 0 },
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0
      }
    }

    for (const row of latestList) {
      const cId = row.character_id as string
      const cycle = ((row as any).todos?.repeat_cycle || 'daily') as RepeatCycle
      const bucket = perCharacter[cId][cycle]
      bucket.total += 1
      if (row.is_completed) bucket.completed += 1
    }

    for (const cId of Object.keys(perCharacter)) {
      const c = perCharacter[cId]
      for (const cycle of ['daily', 'weekly', 'weekend'] as RepeatCycle[]) {
        const b = c[cycle]
        b.pending = b.total - b.completed
        b.completionRate = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0
      }
      c.total = c.daily.total + c.weekly.total + c.weekend.total
      c.completed = c.daily.completed + c.weekly.completed + c.weekend.completed
      c.pending = c.total - c.completed
      c.completionRate = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
    }

    // 응답 구성
    const charactersPayload = (characters || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      serverName: c.servers?.name || '알 수 없음',
      isMain: c.is_main,
      dailyStats: perCharacter[c.id].daily,
      weeklyStats: perCharacter[c.id].weekly,
      weekendStats: perCharacter[c.id].weekend
    }))

    return {
      success: true,
      total: { total, completed, pending, completionRate },
      characters: charactersPayload
    }
  } catch (error) {
    console.error('Dashboard overview API error:', error)
    throw error
  }
})



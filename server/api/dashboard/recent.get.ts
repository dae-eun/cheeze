import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

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

    // 사용자 캐릭터 ID 목록 조회
    const { data: characters, error: charactersError } = await supabaseAdmin
      .from('characters')
      .select('id, name')
      .eq('user_id', user.user_id)

    if (charactersError) {
      console.error('Characters fetch error:', charactersError)
      throw createError({ statusCode: 500, statusMessage: '캐릭터 조회 중 오류가 발생했습니다.' })
    }

    const characterIds: string[] = (characters || []).map((c: any) => c.id)
    const characterIdToName = new Map<string, string>((characters || []).map((c: any) => [c.id, c.name]))

    if (characterIds.length === 0) {
      return { success: true, activities: [] }
    }

    // 최근 완료 5개: todo_characters 에서 is_completed=true, completed_at DESC
    const { data: rows, error: rowsError } = await supabaseAdmin
      .from('todo_characters')
      .select(`
        id,
        character_id,
        todo_id,
        completed_at,
        is_completed,
        todos ( title, progress_type )
      `)
      .in('character_id', characterIds)
      .eq('is_completed', true)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5)

    if (rowsError) {
      console.error('Recent activities fetch error:', rowsError)
      throw createError({ statusCode: 500, statusMessage: '최근 활동 조회에 실패했습니다.' })
    }

    const activities = (rows || []).map((r: any) => ({
      id: r.id,
      todoTitle: r.todos?.title || '알 수 없는 숙제',
      characterName: characterIdToName.get(r.character_id) || '알 수 없는 캐릭터',
      progressType: r.todos?.progress_type || 'other',
      completedAt: r.completed_at
    }))

    return { success: true, activities }
  } catch (error) {
    console.error('Dashboard recent API error:', error)
    throw error
  }
})



import { createClient } from '@supabase/supabase-js'
import { authenticateUser, refreshTokenAndGetUser } from '../../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    // 인증 확인 (리프레시 토큰 자동 처리)
    let userData = await authenticateUser(event)
    
    if (!userData) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증이 필요합니다.'
      })
    }

    // 리프레시 토큰으로 인증된 경우, 새로운 액세스 토큰 발급
    if (!userData.email) {
      try {
        userData = await refreshTokenAndGetUser(event, supabaseAdmin)
      } catch (refreshError) {
        throw createError({
          statusCode: 401,
          statusMessage: '세션이 만료되었습니다. 다시 로그인해주세요.'
        })
      }
    }

    // 사용자의 조직 정보 가져오기
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', userData.user_id)
      .single()

    if (userError || !dbUser.organization_id) {
      throw createError({
        statusCode: 403,
        statusMessage: '조직에 속해있지 않습니다.'
      })
    }

    // 조직의 모든 사용자 정보 가져오기
    const { data: organizationMembers, error: membersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        created_at,
        characters (
          id,
          name,
          server_id,
          is_main,
          servers (name)
        )
      `)
      .eq('organization_id', dbUser.organization_id)
      .order('name')

    if (membersError) {
      console.error('Organization members fetch error:', membersError)
      throw createError({
        statusCode: 500,
        statusMessage: '조직원 정보를 가져올 수 없습니다.'
      })
    }

    // 날짜 쿼리 처리: ?date=YYYY-MM-DD | today | all
    const query = getQuery(event) as Record<string, string | string[]>
    const dateQueryParam = typeof query.date === 'string' ? query.date : undefined

    const today = new Date().toISOString().split('T')[0]

    // 조직원들의 공유된 숙제 현황 가져오기
    interface JoinedTodoRow {
      id: string
      title: string
      description: string | null
      repeat_cycle: 'daily' | 'weekly' | 'weekend' | null
      progress_type: 'dungeon' | 'quest' | 'purchase' | 'exchange' | 'other' | null
      target_count: number | null
    }

    interface JoinedCharacterRow {
      id: string
      name: string
      server_id: string
      is_main: boolean
      servers?: { name: string } | null
      // users 관계는 사용하지 않으므로 any 처리
      users?: any
    }

    interface JoinedTodoCharacterRow {
      id: string
      todo_id: string
      character_id: string
      is_completed: boolean
      completed_at: string | null
      completion_date: string | null
      current_count: number
      target_count: number
      is_shared: boolean
      created_at: string
      updated_at: string
      todos?: JoinedTodoRow | null
      characters?: JoinedCharacterRow | null
    }

    let todosQuery = supabaseAdmin
      .from('todo_characters')
      .select(`
        id,
        todo_id,
        character_id,
        is_completed,
        completed_at,
        completion_date,
        current_count,
        target_count,
        is_shared,
        created_at,
        updated_at,
        todos (
          id,
          title,
          description,
          repeat_cycle,
          progress_type,
          target_count
        ),
        characters (
          id,
          name,
          server_id,
          is_main,
          servers (name),
          users (
            id,
            name
          )
        )
      `)
      .eq('is_shared', true)

    // 기본값: 모든 날짜에서 최신 상태를 보여주기 위해 날짜 필터 미적용
    if (dateQueryParam === 'today') {
      todosQuery = todosQuery.eq('completion_date', today)
    } else if (dateQueryParam && dateQueryParam !== 'all') {
      todosQuery = todosQuery.eq('completion_date', dateQueryParam)
    }

    // 최신 상태 우선 정렬 (날짜 -> 업데이트 시간)
    todosQuery = todosQuery
      .order('completion_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })

    const { data: rawSharedTodos, error: todosError } = await todosQuery as unknown as { data: JoinedTodoCharacterRow[] | null, error: any }

    if (todosError) {
      console.error('Shared todos fetch error:', todosError)
      throw createError({
        statusCode: 500,
        statusMessage: '공유 숙제 정보를 가져올 수 없습니다.'
      })
    }

    // 날짜 필터가 없는 경우(모든 날짜)에는 (character_id, todo_id) 기준으로 최신 1개만 사용
    const isAllDates = !dateQueryParam || dateQueryParam === 'all'
    const sharedTodos: JoinedTodoCharacterRow[] = (() => {
      if (!rawSharedTodos || rawSharedTodos.length === 0) return []
      if (!isAllDates) return rawSharedTodos
      const seen = new Set<string>()
      const deduped: JoinedTodoCharacterRow[] = []
      for (const row of rawSharedTodos) {
        const key = `${row.character_id}:${row.todo_id}`
        if (!seen.has(key)) {
          seen.add(key)
          deduped.push(row)
        }
      }
      return deduped
    })()

    // 조직원별로 데이터 정리
    const memberStats = organizationMembers?.map(member => {
      const memberCharacters = member.characters || []
      const memberTodos = sharedTodos?.filter(tc => 
        memberCharacters.some(char => char.id === tc.character_id)
      ) || []

      // 진행중/완료 우선 정렬, 그 다음 progress_type, 마지막 title로 정렬
      const sortedMemberTodos = memberTodos.sort((a, b) => {
        const isCompletedA = a.is_completed
        const isCompletedB = b.is_completed
        const progressTypeA = a.todos?.progress_type || ''
        const progressTypeB = b.todos?.progress_type || ''
        const titleA = a.todos?.title || ''
        const titleB = b.todos?.title || ''
        
        // 진행중이 완료보다 먼저 (false가 true보다 먼저)
        if (isCompletedA !== isCompletedB) {
          return isCompletedA ? 1 : -1
        }
        
        // progress_type 순서 정의 (던전 -> 퀘스트 -> 구매 -> 교환 -> 기타)
        const progressTypeOrder = {
          'dungeon': 1,
          'quest': 2,
          'purchase': 3,
          'exchange': 4,
          'other': 5
        }
        
        const orderA = progressTypeOrder[progressTypeA as keyof typeof progressTypeOrder] || 6
        const orderB = progressTypeOrder[progressTypeB as keyof typeof progressTypeOrder] || 6
        
        // progress_type이 다르면 progress_type으로 정렬
        if (orderA !== orderB) {
          return orderA - orderB
        }
        
        // progress_type이 같으면 title로 정렬
        return titleA.localeCompare(titleB, 'ko')
      })

      const totalTodos = sortedMemberTodos.length
      const completedTodos = sortedMemberTodos.filter(tc => tc.is_completed).length

      return {
        user: {
          id: member.id,
          name: member.name,
          email: member.email
        },
        characters: memberCharacters,
        totalTodos,
        completedTodos,
        completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
        todos: sortedMemberTodos
      }
    }) || []

    return {
      success: true,
      organizationMembers: memberStats,
      sharedTodos: sharedTodos || [],
      date: dateQueryParam || 'all'
    }

  } catch (error) {
    console.error('Get organization members todos error:', error)
    throw error
  }
})

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

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    // 조직원들의 공유된 숙제 현황 가져오기
    const { data: sharedTodos, error: todosError } = await supabaseAdmin
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
      .eq('completion_date', today)
      .order('created_at', { ascending: false })

    if (todosError) {
      console.error('Shared todos fetch error:', todosError)
      throw createError({
        statusCode: 500,
        statusMessage: '공유 숙제 정보를 가져올 수 없습니다.'
      })
    }

    // 조직원별로 데이터 정리
    const memberStats = organizationMembers?.map(member => {
      const memberCharacters = member.characters || []
      const memberTodos = sharedTodos?.filter(tc => 
        memberCharacters.some(char => char.id === tc.character_id)
      ) || []

      const totalTodos = memberTodos.length
      const completedTodos = memberTodos.filter(tc => tc.is_completed).length

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
        todos: memberTodos
      }
    }) || []

    return {
      success: true,
      organizationMembers: memberStats,
      sharedTodos: sharedTodos || []
    }

  } catch (error) {
    console.error('Get organization members todos error:', error)
    throw error
  }
})

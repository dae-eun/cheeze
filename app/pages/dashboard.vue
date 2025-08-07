<template>
  <div class="space-y-8">
    <!-- 헤더 섹션 -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">대시보드</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">오늘의 숙제 현황을 한눈에 확인하세요</p>
      </div>
             <div class="flex space-x-3">
         <NuxtLink
           to="/characters/todos"
           class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
         >
           <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
           </svg>
           캐릭터별 관리
         </NuxtLink>
       </div>
    </div>

    <!-- 전체 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">전체 숙제</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalStats.total }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">완료된 숙제</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalStats.completed }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">진행중</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalStats.pending }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">완료율</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalStats.completionRate }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 캐릭터별 숙제 현황 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">캐릭터별 숙제 현황</h2>
      </div>
      <div class="p-6">
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
        <div v-else-if="characterStats.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">캐릭터가 없습니다</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">캐릭터를 추가하고 숙제를 관리해보세요.</p>
          <NuxtLink
            to="/profile"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            캐릭터 추가하기
          </NuxtLink>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="character in characterStats"
            :key="character.id"
            class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            @click="goToCharacterTodos(character.id)"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-medium text-sm">{{ character.name.charAt(0) }}</span>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">{{ character.name }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ character.serverName }}</p>
                </div>
              </div>
              <span v-if="character.isMain" class="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                메인
              </span>
            </div>
            
                         <div class="space-y-3">
               <!-- 일간 숙제 -->
               <div>
                 <div class="flex justify-between text-sm mb-1">
                   <span class="text-gray-600 dark:text-gray-400">일간</span>
                   <span class="font-medium text-gray-900 dark:text-white">{{ character.dailyStats.completionRate }}%</span>
                 </div>
                 <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                   <div
                     class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                     :style="{ width: character.dailyStats.completionRate + '%' }"
                   ></div>
                 </div>
                 <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                   <span>{{ character.dailyStats.completed }}/{{ character.dailyStats.total }}</span>
                   <span>{{ character.dailyStats.pending }} 남음</span>
                 </div>
               </div>

               <!-- 주간 숙제 -->
               <div>
                 <div class="flex justify-between text-sm mb-1">
                   <span class="text-gray-600 dark:text-gray-400">주간</span>
                   <span class="font-medium text-gray-900 dark:text-white">{{ character.weeklyStats.completionRate }}%</span>
                 </div>
                 <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                   <div
                     class="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                     :style="{ width: character.weeklyStats.completionRate + '%' }"
                   ></div>
                 </div>
                 <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                   <span>{{ character.weeklyStats.completed }}/{{ character.weeklyStats.total }}</span>
                   <span>{{ character.weeklyStats.pending }} 남음</span>
                 </div>
               </div>

               <!-- 주말 숙제 -->
               <div>
                 <div class="flex justify-between text-sm mb-1">
                   <span class="text-gray-600 dark:text-gray-400">주말</span>
                   <span class="font-medium text-gray-900 dark:text-white">{{ character.weekendStats.completionRate }}%</span>
                 </div>
                 <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                   <div
                     class="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                     :style="{ width: character.weekendStats.completionRate + '%' }"
                   ></div>
                 </div>
                 <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                   <span>{{ character.weekendStats.completed }}/{{ character.weekendStats.total }}</span>
                   <span>{{ character.weekendStats.pending }} 남음</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 최근 활동 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">최근 활동</h2>
      </div>
      <div class="p-6">
        <div v-if="recentActivities.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">아직 완료된 숙제가 없습니다.</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ activity.todoTitle }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ activity.characterName }} - {{ formatTime(activity.completedAt) }}</p>
            </div>
            <div class="flex-shrink-0">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {{ getProgressTypeLabel(activity.progressType) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 빠른 액션 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">빠른 액션</h2>
      </div>
      <div class="p-6">
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <NuxtLink
             to="/characters/todos"
             class="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
           >
             <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
               <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
             </div>
             <span class="font-medium text-gray-900 dark:text-white">캐릭터별 관리</span>
           </NuxtLink>

          <NuxtLink
            to="/todos"
            class="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span class="font-medium text-gray-900 dark:text-white">숙제 관리</span>
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="flex flex-col items-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <div class="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span class="font-medium text-gray-900 dark:text-white">프로필 관리</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    
  </div>
</template>

<script setup lang="ts">
// 페이지 메타 정의
definePageMeta({
  title: '대시보드',
  layout: 'default'
})

const supabase = useSupabase()
const { startAutoRefresh } = useAuth()
const userStore = useUserStore()
const charactersStore = useCharactersStore()
const todosStore = useTodosStore()



interface Character {
  id: string
  name: string
  server_id: string
  is_main: boolean
  servers?: {
    name: string
  }
}

interface TodoCharacter {
  id: string
  todo_id: string
  character_id: string
  is_completed: boolean
  completed_at: string | null
  completion_date: string
}

interface Todo {
  id: string
  title: string
  description: string
  progress_type: string
  repeat_cycle: string
}

interface CharacterStats {
  id: string
  name: string
  serverName: string
  isMain: boolean
  total: number
  completed: number
  pending: number
  completionRate: number
  dailyStats: {
    total: number
    completed: number
    pending: number
    completionRate: number
  }
  weeklyStats: {
    total: number
    completed: number
    pending: number
    completionRate: number
  }
  weekendStats: {
    total: number
    completed: number
    pending: number
    completionRate: number
  }
}

interface RecentActivity {
  id: string
  todoTitle: string
  characterName: string
  progressType: string
  completedAt: string
}

const characters = ref<Character[]>([])
const todoCharacters = ref<TodoCharacter[]>([])
const todos = ref<Todo[]>([])
const loading = ref(true)

// 전체 통계
const totalStats = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayTodos = todoCharacters.value.filter(tc => tc.completion_date === today)
  
  const total = todayTodos.length
  const completed = todayTodos.filter(tc => tc.is_completed).length
  const pending = total - completed
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    pending,
    completionRate
  }
})

// 캐릭터별 통계
const characterStats = computed((): CharacterStats[] => {
  const today = new Date().toISOString().split('T')[0]
  
  return characters.value.map(character => {
    const characterTodos = todoCharacters.value.filter(tc => 
      tc.character_id === character.id && tc.completion_date === today
    )
    
    const total = characterTodos.length
    const completed = characterTodos.filter(tc => tc.is_completed).length
    const pending = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 일간/주간/주말 통계 계산
    const calculateCycleStats = (cycle: string) => {
      const cycleTodos = todos.value.filter(todo => todo.repeat_cycle === cycle)
      const cycleTodoIds = cycleTodos.map(todo => todo.id)
      
      const cycleCharacterTodos = characterTodos.filter(tc => 
        cycleTodoIds.includes(tc.todo_id)
      )
      
      const cycleTotal = cycleCharacterTodos.length
      const cycleCompleted = cycleCharacterTodos.filter(tc => tc.is_completed).length
      const cyclePending = cycleTotal - cycleCompleted
      const cycleCompletionRate = cycleTotal > 0 ? Math.round((cycleCompleted / cycleTotal) * 100) : 0
      
      return {
        total: cycleTotal,
        completed: cycleCompleted,
        pending: cyclePending,
        completionRate: cycleCompletionRate
      }
    }

    return {
      id: character.id,
      name: character.name,
      serverName: character.servers?.name || '알 수 없음',
      isMain: character.is_main,
      total,
      completed,
      pending,
      completionRate,
      dailyStats: calculateCycleStats('daily'),
      weeklyStats: calculateCycleStats('weekly'),
      weekendStats: calculateCycleStats('weekend')
    }
  })
})

// 일간/주간/주말 숙제 통계 계산 함수
const calculateStatsByCycle = (cycle: string) => {
  const today = new Date().toISOString().split('T')[0]
  
  // 해당 주기의 숙제들 필터링
  const cycleTodos = todos.value.filter(todo => todo.repeat_cycle === cycle)
  const cycleTodoIds = cycleTodos.map(todo => todo.id)
  
  // 오늘 날짜의 해당 주기 숙제들
  const todayCycleTodos = todoCharacters.value.filter(tc => 
    cycleTodoIds.includes(tc.todo_id) && tc.completion_date === today
  )
  
  const total = todayCycleTodos.length
  const completed = todayCycleTodos.filter(tc => tc.is_completed).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  
  // 진행 종류별 통계
  const byType = { dungeon: 0, quest: 0, purchase: 0, other: 0 }
  const byTypeTotal = { dungeon: 0, quest: 0, purchase: 0, other: 0 }
  
  todayCycleTodos.forEach(tc => {
    const todo = cycleTodos.find(t => t.id === tc.todo_id)
    if (todo) {
      const type = todo.progress_type as keyof typeof byType
      byTypeTotal[type]++
      if (tc.is_completed) {
        byType[type]++
      }
    }
  })
  
  return {
    total,
    completed,
    pending: total - completed,
    completionRate,
    byType,
    byTypeTotal
  }
}

// 일간/주간/주말 통계
const dailyStats = computed(() => calculateStatsByCycle('daily'))
const weeklyStats = computed(() => calculateStatsByCycle('weekly'))
const weekendStats = computed(() => calculateStatsByCycle('weekend'))

// 최근 활동
const recentActivities = computed((): RecentActivity[] => {
  const today = new Date().toISOString().split('T')[0]
  
  return todoCharacters.value
    .filter(tc => tc.is_completed && tc.completion_date === today && tc.completed_at)
    .map(tc => {
      const todo = todos.value.find(t => t.id === tc.todo_id)
      const character = characters.value.find(c => c.id === tc.character_id)
      
      return {
        id: tc.id,
        todoTitle: todo?.title || '알 수 없는 숙제',
        characterName: character?.name || '알 수 없는 캐릭터',
        progressType: todo?.progress_type || 'other',
        completedAt: tc.completed_at!
      }
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)
})

// 데이터 로드
const loadData = async () => {
  const currentUser = userStore.getCurrentUser()
  if (!currentUser) return

  loading.value = true
  try {
    // 캐릭터 로드
    const charactersData = await charactersStore.fetchCharacters()
    characters.value = charactersData

    // 숙제 로드
    const todosData = await todosStore.fetchTodos()
    todos.value = todosData as any

    // 숙제-캐릭터 매핑 로드
    const todoCharactersPromises = characters.value.map(character =>
      $fetch(`/api/characters/${character.id}/todos`, {
        method: 'GET'
      })
    )
    
    const todoCharactersResponses = await Promise.all(todoCharactersPromises)
    const allTodoCharacters: TodoCharacter[] = []
    
    todoCharactersResponses.forEach(response => {
      if (response.success && response.todoCharacters) {
        allTodoCharacters.push(...(response.todoCharacters as unknown as TodoCharacter[]))
      }
    })
    
    todoCharacters.value = allTodoCharacters

  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// 캐릭터별 숙제 페이지로 이동
const goToCharacterTodos = (characterId: string) => {
  navigateTo(`/characters/todos?character=${characterId}`)
}

// 유틸리티 함수들
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getProgressTypeLabel = (type: string) => {
  const labels = {
    dungeon: '던전',
    quest: '퀘스트',
    purchase: '구매',
    other: '기타'
  }
  return labels[type as keyof typeof labels] || type
}

// 페이지 로드 시 데이터 가져오기
onMounted(async () => {
  try {
    const user = await userStore.fetchUser()
    if (user) {
      await loadData()
      startAutoRefresh()
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
 })
 </script> 
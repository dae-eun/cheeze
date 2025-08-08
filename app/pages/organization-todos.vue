<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- 헤더 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">길드원 숙제 현황</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          조직원들이 공유한 숙제의 진행 상황을 확인할 수 있습니다.
        </p>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          데이터를 불러오는 중...
        </div>
      </div>

      <!-- 조직원 그리드 -->
      <div v-else-if="organizationMembers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="member in organizationMembers"
          :key="member.user.id"
          @click="openMemberDetail(member)"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 dark:border-gray-700"
        >
          <!-- 사용자 정보 -->
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ member.user.name }}
              </h3>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ member.characters.length }}캐릭터
                </span>
              </div>
            </div>

            <!-- 숙제 현황 -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">공유한 총 숙제</span>
                <span class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ member.totalTodos }}
                </span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">완료</span>
                <span class="text-lg font-semibold text-green-600 dark:text-green-400">
                  {{ member.completedTodos }}
                </span>
              </div>

              <!-- 진행률 바 -->
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${member.completionRate}%` }"
                ></div>
              </div>

              <div class="text-center">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ member.completionRate }}%
                </span>
              </div>
            </div>

            <!-- 캐릭터 목록 (간단히) -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="character in member.characters.slice(0, 3)"
                  :key="character.id"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {{ character.name }}
                </span>
                <span
                  v-if="member.characters.length > 3"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  +{{ member.characters.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 데이터 없음 -->
      <div v-else class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">조직원이 없습니다</h3>
        <p class="text-gray-600 dark:text-gray-400">조직에 다른 멤버가 없거나 공유된 숙제가 없습니다.</p>
      </div>
    </div>

    <!-- 조직원 상세 모달 -->
    <div v-if="showMemberModal" class="fixed inset-0 flex items-center justify-center z-50" style="background-color: rgba(0, 0, 0, 0.5);" @click="showMemberModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" @click.stop>
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ selectedMember?.user.name }}의 숙제 현황
          </h3>
          <button
            @click="showMemberModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 캐릭터별 숙제 목록 -->
        <div v-if="selectedMember" class="space-y-6">
          <div
            v-for="character in selectedMember.characters"
            :key="character.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ character.name }}
              </h4>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ character.servers?.name }}
              </span>
            </div>

            <!-- 해당 캐릭터의 공유된 숙제들 -->
            <div class="space-y-3">
              <div
                v-for="todo in getCharacterTodos(character.id)"
                :key="todo.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div class="flex-1">
                  <h5 class="font-medium text-gray-900 dark:text-white">
                    {{ todo.todos?.title }}
                  </h5>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ todo.todos?.description }}
                  </p>
                  <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{{ getProgressTypeLabel(todo.todos?.progress_type) }}</span>
                    <span>{{ getRepeatCycleLabel(todo.todos?.repeat_cycle) }}</span>
                    <span v-if="todo.target_count > 1">
                      {{ todo.current_count }}/{{ todo.target_count }}
                    </span>
                  </div>
                </div>
                
                <div class="flex items-center space-x-3">
                  <span
                    :class="todo.is_completed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'"
                    class="text-sm font-medium"
                  >
                    {{ todo.is_completed ? '완료' : '진행중' }}
                  </span>
                  <div
                    :class="todo.is_completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"
                    class="w-3 h-3 rounded-full"
                  ></div>
                </div>
              </div>

              <!-- 해당 캐릭터에 공유된 숙제가 없는 경우 -->
              <div v-if="getCharacterTodos(character.id).length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
                공유된 숙제가 없습니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
  title: '길드원 숙제 현황',
  description: '조직원들이 공유한 숙제의 진행 상황을 확인할 수 있습니다'
})

// 페이지 고유 메타데이터 설정
useHead({
  title: '길드원 숙제 현황',
  meta: [
    { name: 'description', content: '조직원들이 공유한 숙제의 진행 상황을 확인할 수 있습니다' },
    { property: 'og:title', content: '길드원 숙제 현황' },
    { property: 'og:description', content: '조직원들이 공유한 숙제의 진행 상황을 확인할 수 있습니다' }
  ]
})

const { checkAuth, startAutoRefresh } = useAuth()

// 타입 정의
interface User {
  id: string
  name: string
  email: string
}

interface Character {
  id: string
  name: string
  server_id: string
  is_main: boolean
  servers?: {
    name: string
  }
}

interface Todo {
  id: string
  title: string
  description: string
  repeat_cycle: 'daily' | 'weekly' | 'weekend'
  progress_type: 'dungeon' | 'quest' | 'purchase' | 'exchange' | 'other'
  target_count?: number
}

interface TodoCharacter {
  id: string
  todo_id: string
  character_id: string
  is_completed: boolean
  completed_at: string | null
  completion_date: string
  current_count: number
  target_count: number
  is_shared: boolean
  todos?: Todo
  characters?: Character & {
    users?: User
  }
}

interface OrganizationMember {
  user: User
  characters: Character[]
  totalTodos: number
  completedTodos: number
  completionRate: number
  todos: TodoCharacter[]
}

// 상태 관리
const organizationMembers = ref<OrganizationMember[]>([])
const loading = ref(true)
const showMemberModal = ref(false)
const selectedMember = ref<OrganizationMember | null>(null)

// 데이터 로드
const loadOrganizationTodos = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/organizations/members/todos')
    
    if (response.success) {
      organizationMembers.value = (response as any).organizationMembers || []
    } else {
      throw new Error('길드원 숙제 현황을 불러올 수 없습니다.')
    }
  } catch (error) {
    console.error('길드원 숙제 현황 로드 오류:', error)
    alert('길드원 숙제 현황을 불러올 수 없습니다.')
  } finally {
    loading.value = false
  }
}

// 조직원 상세 모달 열기
const openMemberDetail = (member: OrganizationMember) => {
  selectedMember.value = member
  showMemberModal.value = true
}

// 캐릭터별 숙제 가져오기
const getCharacterTodos = (characterId: string) => {
  if (!selectedMember.value) return []
  return selectedMember.value.todos.filter(todo => todo.character_id === characterId)
}

// 진행 종류 라벨
const getProgressTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    dungeon: '던전',
    quest: '퀘스트',
    purchase: '구매',
    exchange: '교환',
    other: '기타'
  }
  return labels[type || 'other'] || '기타'
}

// 반복 주기 라벨
const getRepeatCycleLabel = (cycle?: string) => {
  const labels: Record<string, string> = {
    daily: '일간',
    weekly: '주간',
    weekend: '주말'
  }
  return labels[cycle || 'daily'] || '일간'
}

// 페이지 로드 시 데이터 가져오기
onMounted(async () => {
  // 인증 확인
  const isAuthenticated = await checkAuth()
  if (!isAuthenticated) {
    return
  }
  
  // 자동 토큰 리프레시 시작
  startAutoRefresh()
  
  // 데이터 로드
  await loadOrganizationTodos()
})
</script>

<style scoped>
/* 커스텀 스타일 */
.grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>

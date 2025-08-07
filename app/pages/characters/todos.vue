<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- 캐릭터 선택 버튼들 (최상단) -->
      <div class="mb-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">캐릭터 선택</h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="character in characters"
            :key="character.id"
            @click="selectCharacter(character)"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              selectedCharacter?.id === character.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            ]"
          >
            <div class="flex items-center space-x-2">
              <span class="text-sm">{{ character.name }}</span>
              <span v-if="character.is_main" class="bg-yellow-500 text-yellow-900 px-1.5 py-0.5 rounded-full text-xs font-bold">
                메인
              </span>
            </div>
            <div class="text-xs opacity-75">{{ character.servers?.name }}</div>
          </button>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="space-y-6">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div class="space-y-3">
            <div v-for="j in 3" :key="j" class="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 숙제 목록 -->
      <div v-else-if="selectedCharacter && assignedTodos.length > 0" class="space-y-8">
        <!-- 일간 숙제 -->
        <div v-if="assignedDailyTodos.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs mr-2">
              일간
            </span>
            일간 숙제
          </h3>
          <div class="space-y-3">
            <div
              v-for="todo in assignedDailyTodos"
              :key="todo.id"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                :checked="isTodoCompleted(todo.id)"
                @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                  <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                    {{ getProgressTypeLabel(todo.progress_type) }}
                  </span>
                  <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                    관리자
                  </span>
                </div>
                <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ todo.description }}
                </p>
              </div>
              <button
                @click="removeTodo(todo.id)"
                class="text-red-500 hover:text-red-700 transition-colors"
                title="숙제 제거"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 주간 숙제 -->
        <div v-if="assignedWeeklyTodos.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs mr-2">
              주간
            </span>
            주간 숙제
          </h3>
          <div class="space-y-3">
            <div
              v-for="todo in assignedWeeklyTodos"
              :key="todo.id"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                :checked="isTodoCompleted(todo.id)"
                @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                  <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                    {{ getProgressTypeLabel(todo.progress_type) }}
                  </span>
                  <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                    관리자
                  </span>
                </div>
                <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ todo.description }}
                </p>
              </div>
              <button
                @click="removeTodo(todo.id)"
                class="text-red-500 hover:text-red-700 transition-colors"
                title="숙제 제거"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 주말 숙제 -->
        <div v-if="assignedWeekendTodos.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs mr-2">
              주말
            </span>
            주말 숙제
          </h3>
          <div class="space-y-3">
            <div
              v-for="todo in assignedWeekendTodos"
              :key="todo.id"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                :checked="isTodoCompleted(todo.id)"
                @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                  <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                    {{ getProgressTypeLabel(todo.progress_type) }}
                  </span>
                  <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                    관리자
                  </span>
                </div>
                <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ todo.description }}
                </p>
              </div>
              <button
                @click="removeTodo(todo.id)"
                class="text-red-500 hover:text-red-700 transition-colors"
                title="숙제 제거"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 완료율 표시 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">진행 현황</h3>
          <div class="flex items-center space-x-4">
            <div class="flex-1">
              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>전체 완료율</span>
                <span>{{ completionRate }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: completionRate + '%' }"
                ></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ completedCount }}/{{ assignedCount }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">완료된 숙제</div>
            </div>
          </div>
        </div>

        <!-- 숙제 추가 버튼 -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-blue-800 dark:text-blue-200">
                숙제 추가하기
              </h3>
              <p class="mt-2 text-blue-700 dark:text-blue-300">
                캐릭터에게 숙제을 할당하거나 새로운 숙제을 생성할 수 있습니다.
              </p>
              <div class="mt-4 space-x-3">
                <button
                  @click="openAddTodoModal"
                  class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  숙제 할당하기
                </button>
                <NuxtLink
                  to="/todos"
                  class="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                >
                  숙제 관리로 이동
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 캐릭터 미선택 상태 -->
      <div v-else-if="!selectedCharacter" class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">캐릭터를 선택해주세요</h3>
        <p class="text-gray-600 dark:text-gray-400">위의 캐릭터 버튼을 클릭하여 숙제을 관리할 캐릭터를 선택하세요.</p>
      </div>

      <!-- 숙제 없음 상태 -->
      <div v-else class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">숙제이 없습니다</h3>
        <p class="text-gray-600 dark:text-gray-400">이 캐릭터에 할당된 숙제이 없습니다.</p>
        <div class="mt-4 space-x-3">
          <button
            @click="openAddTodoModal"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            숙제 할당하기
          </button>
          <NuxtLink
            to="/todos"
            class="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
          >
            숙제 관리로 이동
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 숙제 할당 모달 -->
    <div v-if="showAddTodoModal" class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ selectedCharacter?.name }}에게 숙제 할당하기
          </h3>
          <button
            @click="showAddTodoModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 검색 필터 -->
        <div class="mb-6">
          <div class="flex space-x-4 mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="숙제 검색..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              v-model="selectedCycle"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 주기</option>
              <option value="daily">일간</option>
              <option value="weekly">주간</option>
              <option value="weekend">주말</option>
            </select>
          </div>
        </div>

                 <!-- 숙제 목록 -->
         <div class="space-y-3 max-h-96 overflow-y-auto">
           <div
             v-for="todo in filteredTodos"
             :key="todo.id"
             class="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
             @click="toggleTodoSelection(todo.id)"
           >
             <input
               v-if="!isTodoAssigned(todo.id)"
               type="checkbox"
               :value="todo.id"
               v-model="selectedTodoIds"
               @click.stop
               class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mr-3"
             />
             <div v-else class="w-4 h-4 mr-3 flex items-center justify-center">
               <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <div class="flex-1">
               <div class="flex items-center space-x-2 mb-2">
                 <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                 <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                   {{ getProgressTypeLabel(todo.progress_type) }}
                 </span>
                 <span class="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                   {{ getCycleLabel(todo.repeat_cycle) }}
                 </span>
                 <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                   관리자
                 </span>
                 <span v-if="isTodoAssigned(todo.id)" class="bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                   할당됨
                 </span>
               </div>
               <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400">
                 {{ todo.description }}
               </p>
             </div>
           </div>
         </div>

        <!-- 할당된 숙제이 없을 때 -->
        <div v-if="filteredTodos.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">할당할 수 있는 숙제이 없습니다.</p>
        </div>

                 <div class="mt-6 flex justify-between items-center">
           <div class="text-sm text-gray-600 dark:text-gray-400">
             {{ selectedTodoIds.length }}개 숙제 선택됨
           </div>
           <div class="flex space-x-3">
             <button
               @click="showAddTodoModal = false"
               class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md transition-colors"
             >
               닫기
             </button>
             <button
               @click="assignSelectedTodos"
               :disabled="selectedTodoIds.length === 0 || assigning"
               class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
             >
               {{ assigning ? '할당 중...' : '선택한 숙제 할당하기' }}
             </button>
           </div>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

// 타입 정의
interface Todo {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  created_by: string
  is_admin_todo: boolean
  repeat_cycle: 'daily' | 'weekly' | 'weekend'
  progress_type: 'dungeon' | 'quest' | 'purchase' | 'other'
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

interface TodoCharacter {
  id: string
  todo_id: string
  character_id: string
  is_completed: boolean
  completed_at: string | null
  completion_date: string
}

definePageMeta({
  layout: 'default'
})

import { useUserStore } from '~/stores/user'

const { logout } = useAuth()
const userStore = useUserStore()
const charactersStore = useCharactersStore()
const todosStore = useTodosStore()

// 상태 관리
const characters = ref<Character[]>([])
const todos = ref<Todo[]>([])
const todoCharacters = ref<TodoCharacter[]>([])
const selectedCharacter = ref<Character | null>(null)
const loading = ref(false)
const toggling = ref(false)
const removing = ref(false)
const showAddTodoModal = ref(false)
const searchQuery = ref('')
const selectedCycle = ref('')
const assigning = ref(false)
const selectedTodoIds = ref<string[]>([])

// 계산된 속성들 - 할당된 숙제들만 필터링
const assignedTodos = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const assignedTodoIds = todoCharacters.value
    .filter(tc => tc.completion_date === today)
    .map(tc => tc.todo_id)
  
  return todos.value.filter(todo => assignedTodoIds.includes(todo.id))
})

const assignedDailyTodos = computed(() => assignedTodos.value.filter(todo => todo.repeat_cycle === 'daily'))
const assignedWeeklyTodos = computed(() => assignedTodos.value.filter(todo => todo.repeat_cycle === 'weekly'))
const assignedWeekendTodos = computed(() => assignedTodos.value.filter(todo => todo.repeat_cycle === 'weekend'))

const assignedCount = computed(() => todoCharacters.value.filter(tc => {
  const today = new Date().toISOString().split('T')[0]
  return tc.completion_date === today
}).length)

const completedCount = computed(() => todoCharacters.value.filter(tc => {
  const today = new Date().toISOString().split('T')[0]
  return tc.is_completed && tc.completion_date === today
}).length)

const completionRate = computed(() => 
  assignedCount.value > 0 ? Math.round((completedCount.value / assignedCount.value) * 100) : 0
)

// 필터링된 숙제 목록 (모달용)
const filteredTodos = computed(() => {
  let filtered = todos.value

  // 검색어 필터링
  if (searchQuery.value) {
    filtered = filtered.filter(todo => 
      todo.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (todo.description && todo.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // 주기 필터링
  if (selectedCycle.value) {
    filtered = filtered.filter(todo => todo.repeat_cycle === selectedCycle.value)
  }

  return filtered
})

// 캐릭터 목록 로드
const loadCharacters = async () => {
  try {
    const charactersData = await charactersStore.fetchCharacters()
    characters.value = charactersData
  } catch (error) {
    console.error('Error loading characters:', error)
  }
}

// 숙제 목록 로드
const loadTodos = async () => {
  loading.value = true
  try {
    const todosData = await todosStore.fetchTodos()
    todos.value = todosData as unknown as Todo[]
  } catch (error) {
    console.error('Error loading todos:', error)
  } finally {
    loading.value = false
  }
}

// 캐릭터별 숙제 매핑 로드
const loadTodoCharacters = async () => {
  if (!selectedCharacter.value) return

  try {
    const response = await $fetch(`/api/characters/${selectedCharacter.value.id}/todos`, {
      method: 'GET'
    })

    if (response.success) {
      todoCharacters.value = (response.todoCharacters || []) as unknown as TodoCharacter[]
    }
  } catch (error) {
    console.error('Error loading todo characters:', error)
  }
}

// 캐릭터 선택
const selectCharacter = async (character: Character) => {
  selectedCharacter.value = character
  await loadTodoCharacters()
  
  // URL 업데이트
  await router.push({
    query: { character: character.id }
  })
}

// 숙제 완료 상태 확인
const isTodoCompleted = (todoId: string) => {
  const today = new Date().toISOString().split('T')[0]
  return todoCharacters.value.some(tc => 
    tc.todo_id === todoId && 
    tc.is_completed && 
    tc.completion_date === today
  )
}

// 숙제 완료 상태 토글
const toggleTodo = async (todoId: string, isCompleted: boolean) => {
  if (!selectedCharacter.value || toggling.value) return

  toggling.value = true
  try {
    const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}`, {
      method: 'PUT',
      body: {
        is_completed: isCompleted
      }
    })

    if (response.success) {
      await loadTodoCharacters()
    }
  } catch (error) {
    console.error('Error toggling todo:', error)
  } finally {
    toggling.value = false
  }
}

// 숙제 제거
const removeTodo = async (todoId: string) => {
  if (!selectedCharacter.value || removing.value) return

  if (!confirm('정말로 이 숙제을 제거하시겠습니까?')) {
    return
  }

  removing.value = true
  try {
    const today = new Date().toISOString().split('T')[0]
    const todoCharacter = todoCharacters.value.find(tc => 
      tc.todo_id === todoId && tc.completion_date === today
    )

    if (todoCharacter) {
      const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        await loadTodoCharacters()
      }
    }
  } catch (error) {
    console.error('Error removing todo:', error)
  } finally {
    removing.value = false
  }
}

// 진행종류 라벨
const getProgressTypeLabel = (type: string) => {
  const labels = {
    dungeon: '던전',
    quest: '퀘스트',
    purchase: '구매',
    other: '기타'
  }
  return labels[type as keyof typeof labels] || type
}

// 주기 라벨
const getCycleLabel = (cycle: string) => {
  const labels = {
    daily: '일간',
    weekly: '주간',
    weekend: '주말'
  }
  return labels[cycle as keyof typeof labels] || cycle
}

// 숙제이 이미 할당되었는지 확인
const isTodoAssigned = (todoId: string) => {
  const today = new Date().toISOString().split('T')[0]
  return todoCharacters.value.some(tc => 
    tc.todo_id === todoId && tc.completion_date === today
  )
}

// 숙제 할당 (단일)
const assignTodo = async (todoId: string) => {
  if (!selectedCharacter.value || assigning.value) return

  assigning.value = true
  try {
    const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}`, {
      method: 'POST'
    })

    if (response.success) {
      await loadTodoCharacters()
      // 성공 메시지 표시 (선택사항)
      alert('숙제이 성공적으로 할당되었습니다.')
    }
  } catch (error) {
    console.error('Error assigning todo:', error)
    alert('숙제 할당에 실패했습니다.')
  } finally {
    assigning.value = false
  }
}

// 선택된 숙제들 일괄 할당
const assignSelectedTodos = async () => {
  if (!selectedCharacter.value || assigning.value || selectedTodoIds.value.length === 0) return

  assigning.value = true
  try {
    const promises = selectedTodoIds.value.map(todoId => 
      $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value!.id}`, {
        method: 'POST'
      })
    )

    const results = await Promise.all(promises)
    const successCount = results.filter(result => result.success).length

    if (successCount > 0) {
      await loadTodoCharacters()
      selectedTodoIds.value = [] // 선택 초기화
      alert(`${successCount}개의 숙제이 성공적으로 할당되었습니다.`)
    }
  } catch (error) {
    console.error('Error assigning todos:', error)
    alert('숙제 할당 중 오류가 발생했습니다.')
  } finally {
    assigning.value = false
  }
}

// 숙제 선택 토글
const toggleTodoSelection = (todoId: string) => {
  if (isTodoAssigned(todoId)) return // 이미 할당된 숙제은 선택 불가
  
  const index = selectedTodoIds.value.indexOf(todoId)
  if (index > -1) {
    selectedTodoIds.value.splice(index, 1)
  } else {
    selectedTodoIds.value.push(todoId)
  }
}

// 모달 열기 시 선택 초기화
const openAddTodoModal = () => {
  selectedTodoIds.value = []
  showAddTodoModal.value = true
}

// URL 쿼리 파라미터에서 캐릭터 ID 가져오기
const route = useRoute()
const router = useRouter()

// URL 쿼리 파라미터로 캐릭터 자동 선택
const selectCharacterFromQuery = () => {
  const characterId = route.query.character as string
  if (characterId && characters.value.length > 0) {
    const character = characters.value.find(c => c.id === characterId)
    if (character) {
      selectedCharacter.value = character
      loadTodoCharacters()
      return true // 성공적으로 선택됨
    }
  }
  return false // 선택되지 않음
}

// 페이지 로드 시 데이터 가져오기
onMounted(async () => {
  try {
    // 스토어에서 사용자 정보 가져오기
    const user = await userStore.fetchUser()
    if (user) {
      await loadCharacters()
      await loadTodos()
      
      // URL 쿼리 파라미터로 캐릭터 자동 선택
      const characterSelected = selectCharacterFromQuery()
      
      // 쿼리스트링에 캐릭터가 없으면 첫 번째 캐릭터 선택
      if (!characterSelected && characters.value.length > 0 && characters.value[0]) {
        selectCharacter(characters.value[0])
      }
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})
</script> 
<template>
  <div class="space-y-8">
    <!-- 페이지 고유 헤더 -->
    <div class="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold">시스템 숙제 관리 (TODOS 페이지)</h1>
          <p class="mt-1 opacity-90">모든 조직에 적용되는 시스템 숙제를 관리합니다</p>
        </div>
        <div class="flex items-center space-x-2">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span class="text-lg font-semibold">Todo Management</span>
        </div>
      </div>
    </div>

    <!-- 헤더 섹션 -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">시스템 숙제 관리</h2>
        <p class="text-gray-600 dark:text-gray-400 mt-1">모든 조직에 적용되는 시스템 숙제를 관리합니다</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        새 숙제 생성
      </button>
    </div>

    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 숙제</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ todos.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">완료된 숙제</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ completedTodos }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">진행 중</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pendingTodos }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">진행 종류</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ progressTypes.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 필터 및 검색 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="숙제 제목으로 검색..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div class="flex gap-2">
          <select
            v-model="filterProgressType"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">모든 진행 종류</option>
            <option value="dungeon">던전</option>
            <option value="quest">퀘스트</option>
            <option value="purchase">구매</option>
            <option value="exchange">교환</option>
            <option value="other">기타</option>
          </select>
          <select
            v-model="filterRepeatCycle"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">반복 주기를 선택하세요</option>
            <option value="daily">일간</option>
            <option value="weekly">주간</option>
            <option value="weekend">주말</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 숙제 목록 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">시스템 숙제 목록</h2>
      </div>
      
      <div v-if="loading" class="p-6">
        <div class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-center space-x-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          </div>
        </div>
      </div>
      
      <div v-else-if="filteredTodos.length === 0" class="p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">숙제가 없습니다</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">새 시스템 숙제를 생성해보세요.</p>
      </div>
      
      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="todo in filteredTodos" :key="todo.id" class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ todo.title }}</h3>
                                 <span 
                   class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                   :class="getProgressTypeClass(todo.progress_type)"
                 >
                   {{ getProgressTypeLabel(todo.progress_type) }}
                 </span>
                <span 
                  v-if="todo.repeat_cycle !== '없음'"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {{ todo.repeat_cycle }}
                </span>
              </div>
              <p v-if="todo.description" class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ todo.description }}</p>
              <div class="mt-2 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <span>생성일: {{ formatDate(todo.created_at) }}</span>
                <span v-if="todo.organization_id">조직: {{ getOrganizationName(todo.organization_id) }}</span>
              </div>
            </div>
            <div class="flex space-x-2 ml-4">
              <button
                @click="editTodo(todo)"
                class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                수정
              </button>
              <button
                @click="deleteTodo(todo.id)"
                class="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 숙제 생성/수정 모달 -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 overflow-y-auto h-full w-full z-50" style="background-color: rgba(0, 0, 0, 0.5);">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ showEditModal ? '숙제 수정' : '새 숙제 생성' }}
          </h3>
          <form @submit.prevent="showEditModal ? updateTodo() : createTodo()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">숙제 제목</label>
              <input
                v-model="todoForm.title"
                type="text"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="숙제 제목을 입력하세요"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">설명</label>
              <textarea
                v-model="todoForm.description"
                rows="3"
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="숙제 설명을 입력하세요"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">진행 종류</label>
              <select
                v-model="todoForm.progress_type"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">선택하세요</option>
                <option value="dungeon">던전</option>
                <option value="quest">퀘스트</option>
                <option value="purchase">구매</option>
                <option value="exchange">교환</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">목표 반복 횟수</label>
              <input
                v-model.number="todoForm.target_count"
                type="number"
                min="1"
                max="999"
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="1"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                목표 횟수에 도달하면 자동으로 완료됩니다. (1회 = 일반 체크박스)
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">반복 주기</label>
              <select
                v-model="todoForm.repeat_cycle"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">선택하세요</option>
                <option value="없음">없음</option>
                <option value="daily">일간</option>
                <option value="weekly">주간</option>
                <option value="weekend">주말</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">적용 조직</label>
              <select
                v-model="todoForm.organization_id"
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">모든 조직</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">
                  {{ org.name }}
                </option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <span v-if="saving">저장 중...</span>
                <span v-else>{{ showEditModal ? '수정' : '생성' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'admin',
  title: '시스템 숙제 관리',
  description: '모든 조직에 적용되는 시스템 숙제를 관리합니다'
})

// 페이지 고유 메타데이터 설정
useHead({
  title: '시스템 숙제 관리 - 관리자 패널',
  meta: [
    { name: 'description', content: '모든 조직에 적용되는 시스템 숙제를 관리합니다' },
    { property: 'og:title', content: '시스템 숙제 관리' },
    { property: 'og:description', content: '모든 조직에 적용되는 시스템 숙제를 관리합니다' }
  ]
})

const supabase = useSupabase()
const { checkAuth, startAutoRefresh } = useAuth()

interface Todo {
  id: string
  title: string
  description?: string
  progress_type: string
  repeat_cycle: string
  target_count?: number
  organization_id?: string
  created_at: string
  is_admin_todo: boolean
  completed?: boolean
}

interface Organization {
  id: string
  name: string
}

const todos = ref<Todo[]>([])
const organizations = ref<Organization[]>([])
const loading = ref(true)
const saving = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingTodoId = ref<string | null>(null)

const searchQuery = ref('')
const filterProgressType = ref('')
const filterRepeatCycle = ref('')

const todoForm = ref({
  title: '',
  description: '',
  progress_type: '',
  repeat_cycle: '',
  organization_id: '',
  target_count: 1
})

onMounted(async () => {
  // 인증 확인
  const isAuthenticated = await checkAuth()
  if (!isAuthenticated) {
    return
  }
  
  // 자동 토큰 리프레시 시작
  startAutoRefresh()
  
  // 데이터 로드
  loadData()
})

const loadData = async () => {
  try {
    await Promise.all([
      loadTodos(),
      loadOrganizations()
    ])
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const loadTodos = async () => {
  try {
    const response = await $fetch('/api/todos')
    
    if (response.success) {
      // 시스템 todo만 필터링
      todos.value = (response as any).todos.filter((todo: Todo) => todo.is_admin_todo) || []
    } else {
      throw new Error('Failed to load todos')
    }
  } catch (error) {
    console.error('Error loading todos:', error)
  }
}

const loadOrganizations = async () => {
  try {
    const response = await $fetch('/api/organizations')
    
    if (response.success) {
      organizations.value = (response as any).organizations || []
    } else {
      throw new Error('Failed to load organizations')
    }
  } catch (error) {
    console.error('Error loading organizations:', error)
  }
}

const createTodo = async () => {
  saving.value = true
  
  try {
    const response = await $fetch('/api/admin/todos', {
      method: 'POST',
      body: {
        title: todoForm.value.title,
        description: todoForm.value.description,
        progress_type: todoForm.value.progress_type,
        repeat_cycle: todoForm.value.repeat_cycle,
        organization_id: todoForm.value.organization_id || null,
        target_count: todoForm.value.target_count
      }
    })

    if (response.success && (response as any).todo) {
      todos.value.unshift((response as any).todo)
      resetForm()
      closeModal()
      alert('시스템 숙제가 생성되었습니다!')
    } else {
      throw new Error('Todo creation failed')
    }
  } catch (error) {
    console.error('Error creating todo:', error)
    alert('시스템 숙제 생성 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

const editTodo = (todo: Todo) => {
  editingTodoId.value = todo.id
  todoForm.value = {
    title: todo.title,
    description: todo.description || '',
    progress_type: todo.progress_type,
    repeat_cycle: todo.repeat_cycle,
    organization_id: todo.organization_id || '',
    target_count: todo.target_count || 1
  }
  showEditModal.value = true
}

const updateTodo = async () => {
  saving.value = true
  
  try {
    const response = await $fetch(`/api/todos/${editingTodoId.value}`, {
      method: 'PUT',
      body: {
        title: todoForm.value.title,
        description: todoForm.value.description,
        progress_type: todoForm.value.progress_type,
        repeat_cycle: todoForm.value.repeat_cycle,
        organization_id: todoForm.value.organization_id || null
      }
    })

    if (response.success && (response as any).todo) {
      // 목록에서 해당 숙제 업데이트
      const index = todos.value.findIndex(todo => todo.id === editingTodoId.value)
      if (index !== -1) {
        todos.value[index] = (response as any).todo
      }

      resetForm()
      closeModal()
      
      alert('시스템 숙제가 수정되었습니다!')
    } else {
      throw new Error('Todo update failed')
    }
  } catch (error) {
    console.error('Error updating todo:', error)
    alert('시스템 숙제 수정 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

const deleteTodo = async (todoId: string) => {
  if (!confirm('정말로 이 숙제를 삭제하시겠습니까?')) {
    return
  }
  
  try {
    const response = await $fetch(`/api/todos/${todoId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // 목록에서 해당 숙제 제거
      todos.value = todos.value.filter(todo => todo.id !== todoId)
      
      alert('시스템 숙제가 삭제되었습니다!')
    } else {
      throw new Error('Todo deletion failed')
    }
  } catch (error) {
    console.error('Error deleting todo:', error)
    alert('시스템 숙제 삭제 중 오류가 발생했습니다.')
  }
}

const resetForm = () => {
  todoForm.value = {
    title: '',
    description: '',
    progress_type: '',
    repeat_cycle: '',
    organization_id: '',
    target_count: 1
  }
  editingTodoId.value = null
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

const getProgressTypeClass = (progressType: string) => {
  switch (progressType) {
    case 'dungeon':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'quest':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'purchase':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'exchange':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'other':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getProgressTypeLabel = (progressType: string) => {
  switch (progressType) {
    case 'dungeon':
      return '던전'
    case 'quest':
      return '퀘스트'
    case 'purchase':
      return '구매'
    case 'exchange':
      return '교환'
    case 'other':
      return '기타'
    default:
      return progressType
  }
}

const getOrganizationName = (orgId: string) => {
  const org = organizations.value.find(o => o.id === orgId)
  return org ? org.name : '알 수 없음'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

// 계산된 속성들
const filteredTodos = computed(() => {
  let filtered = todos.value

  if (searchQuery.value) {
    filtered = filtered.filter(todo => 
      todo.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (filterProgressType.value) {
    filtered = filtered.filter(todo => todo.progress_type === filterProgressType.value)
  }

  if (filterRepeatCycle.value) {
    filtered = filtered.filter(todo => todo.repeat_cycle === filterRepeatCycle.value)
  }

  return filtered
})

const completedTodos = computed(() => {
  return todos.value.filter(todo => todo.completed).length
})

const pendingTodos = computed(() => {
  return todos.value.filter(todo => !todo.completed).length
})

const progressTypes = computed(() => {
  return [...new Set(todos.value.map(todo => todo.progress_type))]
})
</script>

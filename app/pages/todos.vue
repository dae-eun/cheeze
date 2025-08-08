<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- 헤더 -->
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">숙제 관리</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            새로운 숙제를 생성하고 관리할 수 있습니다.
          </p>
        </div>
        <button
          @click="showAddModal = true"
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          숙제 추가
        </button>
      </div>

      <!-- 숙제 목록 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">숙제 목록</h2>
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

        <div v-else-if="todos.length === 0" class="p-6 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">숙제가 없습니다</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">새로운 숙제를 추가해보세요.</p>
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="todo in todos"
            :key="todo.id"
            class="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ todo.title }}</h3>
                <span
                  :class="getRepeatCycleClass(todo)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getRepeatCycleText(todo.repeat_cycle) }}
                </span>
                <span
                  :class="{
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': todo.progress_type === 'dungeon',
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': todo.progress_type === 'quest',
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': todo.progress_type === 'purchase',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': todo.progress_type === 'exchange',
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': todo.progress_type === 'other'
                  }"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getProgressTypeText(todo.progress_type) }}
                </span>
                <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                  관리자
                </span>
              </div>
              <p v-if="todo.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ todo.description }}
              </p>
            </div>
            
            <div class="flex items-center space-x-2">
              <button
                v-if="!todo.is_admin_todo || isSystemUser"
                @click="editTodo(todo)"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                :title="todo.is_admin_todo && !isSystemUser ? '시스템 숙제는 시스템 계정만 수정 가능합니다' : '수정'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                v-else
                class="text-gray-300 cursor-not-allowed"
                title="시스템 숙제는 시스템 계정만 수정 가능합니다"
                disabled
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
               <button
                 v-if="canDeleteTodo(todo)"
                 @click="deleteTodo(todo.id)"
                 class="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                 :title="todo.is_admin_todo && !isSystemUser ? '시스템 숙제는 시스템 계정만 삭제 가능합니다' : '삭제'"
               >
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
               </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 캐릭터별 숙제 관리 링크 -->
      <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-blue-800 dark:text-blue-200">
              캐릭터별 숙제 관리
            </h3>
            <p class="mt-2 text-blue-700 dark:text-blue-300">
              생성된 숙제를 각 캐릭터에 할당하고 완료 상태를 관리하려면 캐릭터별 숙제 관리 페이지를 이용하세요.
            </p>
            <div class="mt-4">
              <NuxtLink
                to="/characters/todos"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                캐릭터별 숙제 관리로 이동
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 숙제 추가/수정 모달 -->
    <div v-if="showAddModal" class="fixed inset-0 overflow-y-auto h-full w-full z-50" style="background-color: rgba(0, 0, 0, 0.5);">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ editingTodo ? '숙제 수정' : '숙제 추가' }}
          </h3>
          
          <form @submit.prevent="editingTodo ? updateTodo() : addTodo()">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  제목 *
                </label>
                <input
                  v-model="todoForm.title"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="숙제 제목을 입력하세요"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  v-model="todoForm.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="숙제 설명을 입력하세요"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  반복 주기 *
                </label>
                <select
                  v-model="todoForm.repeat_cycle"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">반복 주기를 선택하세요</option>
                  <option value="daily">일간</option>
                  <option value="weekly">주간</option>
                  <option value="weekend">월간</option>
                </select>
              </div>

                             <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   진행 종류 *
                 </label>
                 <select
                   v-model="todoForm.progress_type"
                   required
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                 >
                   <option value="">진행 종류를 선택하세요</option>
                   <option value="dungeon">던전</option>
                   <option value="quest">퀘스트</option>
                   <option value="purchase">구매</option>
                   <option value="exchange">교환</option>
                   <option value="other">기타</option>
                 </select>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   목표 반복 횟수
                 </label>
                 <input
                   v-model.number="todoForm.target_count"
                   type="number"
                   min="1"
                   max="999"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                   placeholder="1"
                 />
                 <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                   목표 횟수에 도달하면 자동으로 완료됩니다.
                 </p>
               </div>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="adding"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
              >
                {{ adding ? '처리 중...' : (editingTodo ? '수정' : '추가') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Todo {
  id: string
  title: string
  description?: string
  repeat_cycle: 'daily' | 'weekly' | 'weekend'
  progress_type: 'dungeon' | 'quest' | 'purchase' | 'exchange' | 'other'
  target_count?: number
  is_admin_todo: boolean
  organization_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface TodoForm {
  title: string
  description: string
  repeat_cycle: 'daily' | 'weekly' | 'weekend' | ''
  progress_type: 'dungeon' | 'quest' | 'purchase' | 'exchange' | 'other' | ''
  target_count: number
}

definePageMeta({
  layout: 'default'
})

const { $supabase } = useNuxtApp()
const userStore = useUserStore()

const todos = ref<Todo[]>([])
const loading = ref(true)
const adding = ref(false)
const showAddModal = ref(false)
const editingTodo = ref<Todo | null>(null)

// 시스템 사용자 여부 확인
const isSystemUser = computed(() => {
  return userStore.user?.organization_id === null
})

const todoForm = ref<TodoForm>({
  title: '',
  description: '',
  repeat_cycle: '',
  progress_type: '',
  target_count: 1
})

// 숙제 목록 로드
const loadTodos = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/todos')
    
    if (response.success) {
      todos.value = response.todos as unknown as Todo[] || []
    } else {
      throw new Error('숙제 목록을 불러올 수 없습니다.')
    }
  } catch (error) {
    console.error('숙제 목록 로드 오류:', error)
    alert('숙제 목록을 불러올 수 없습니다.')
  } finally {
    loading.value = false
  }
}

// 숙제 추가
const addTodo = async () => {
  if (!todoForm.value.title || !todoForm.value.repeat_cycle || !todoForm.value.progress_type) {
    alert('필수 항목을 모두 입력해주세요.')
    return
  }

  try {
    adding.value = true
    
    // 폼 데이터를 미리 저장 (closeModal() 호출 전에)
    const formData = {
      title: todoForm.value.title,
      description: todoForm.value.description,
      repeat_cycle: todoForm.value.repeat_cycle,
      progress_type: todoForm.value.progress_type
    }
    
    // Optimistic Update: 서버 응답 전에 UI 먼저 업데이트
    const newTodo: Todo = {
      id: `temp-${Date.now()}`, // 임시 ID
      title: formData.title,
      description: formData.description,
      repeat_cycle: formData.repeat_cycle as 'daily' | 'weekly' | 'weekend',
      progress_type: formData.progress_type as 'dungeon' | 'quest' | 'purchase' | 'exchange' | 'other',
      is_admin_todo: false,
      organization_id: userStore.user?.organization_id,
      created_by: userStore.user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // UI에 즉시 추가
    todos.value.unshift(newTodo)
    closeModal()
    
    // 서버에 실제 요청 (저장된 폼 데이터 사용)
    const response = await $fetch('/api/todos', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      // 성공 시 임시 데이터를 실제 데이터로 교체 (API 응답에 todo가 있으면 사용, 없으면 그대로 유지)
      if ((response as any).todo) {
        const serverTodo = (response as any).todo as Todo
        const index = todos.value.findIndex(t => t.id === newTodo.id)
        if (index !== -1) {
          todos.value[index] = serverTodo
        }
      }
    } else {
      // 실패 시 임시 데이터 제거
      todos.value = todos.value.filter(t => t.id !== newTodo.id)
      throw new Error('숙제 추가에 실패했습니다.')
    }
  } catch (error) {
    console.error('숙제 추가 오류:', error)
    alert('숙제 추가에 실패했습니다.')
  } finally {
    adding.value = false
  }
}

// 숙제 수정
const updateTodo = async () => {
  if (!editingTodo.value || !todoForm.value.title || !todoForm.value.repeat_cycle || !todoForm.value.progress_type) {
    alert('필수 항목을 모두 입력해주세요.')
    return
  }

  try {
    adding.value = true
    
    // 폼 데이터를 미리 저장 (closeModal() 호출 전에)
    const formData = {
      title: todoForm.value.title,
      description: todoForm.value.description,
      repeat_cycle: todoForm.value.repeat_cycle,
      progress_type: todoForm.value.progress_type
    }
    
    // Optimistic Update: 서버 응답 전에 UI 먼저 업데이트
    const originalTodo = { ...editingTodo.value }
    const updatedTodo = {
      ...editingTodo.value,
      title: formData.title,
      description: formData.description,
      repeat_cycle: formData.repeat_cycle as 'daily' | 'weekly' | 'weekend',
             progress_type: formData.progress_type as 'dungeon' | 'quest' | 'purchase' | 'exchange' | 'other',
      updated_at: new Date().toISOString()
    }
    
    // UI에 즉시 업데이트
    const index = todos.value.findIndex(t => t.id === editingTodo.value!.id)
    if (index !== -1) {
      todos.value[index] = updatedTodo
    }
    closeModal()
    
    // 서버에 실제 요청 (저장된 폼 데이터 사용)
    const response = await $fetch(`/api/todos/${editingTodo.value.id}`, {
      method: 'PUT',
      body: formData
    })

    if (response.success) {
      // 성공 시 서버 응답으로 업데이트 (필요한 경우)
      if ((response as any).todo) {
        const serverTodo = (response as any).todo as Todo
        const index = todos.value.findIndex(t => t.id === editingTodo.value!.id)
        if (index !== -1) {
          todos.value[index] = serverTodo
        }
      }
    } else {
      // 실패 시 원래 데이터로 복원
      const index = todos.value.findIndex(t => t.id === editingTodo.value!.id)
      if (index !== -1) {
        todos.value[index] = originalTodo
      }
      throw new Error('숙제 수정에 실패했습니다.')
    }
  } catch (error) {
    console.error('숙제 수정 오류:', error)
    alert('숙제 수정에 실패했습니다.')
  } finally {
    adding.value = false
  }
}

// 숙제 삭제
const deleteTodo = async (todoId: string) => {
  const todo = todos.value.find(t => t.id === todoId)
  if (!todo) return

  // 권한 체크
  const canDelete = userStore.user?.id === todo.created_by || (todo.is_admin_todo && isSystemUser.value)
  if (!canDelete) {
    if (todo.is_admin_todo) {
      alert('시스템 숙제는 시스템 계정만 삭제할 수 있습니다.')
    } else {
      alert('자신이 만든 숙제만 삭제할 수 있습니다.')
    }
    return
  }

  if (!confirm('정말로 이 숙제를 삭제하시겠습니까?')) {
    return
  }

  try {
    // Optimistic Update: 서버 응답 전에 UI 먼저 업데이트
    const deletedTodo = { ...todo }
    todos.value = todos.value.filter(t => t.id !== todoId)
    
    // 서버에 실제 요청
    const response = await $fetch(`/api/todos/${todoId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // 성공 시 이미 UI에서 제거됨
    } else {
      // 실패 시 원래 데이터로 복원
      todos.value.push(deletedTodo)
      throw new Error('숙제 삭제에 실패했습니다.')
    }
  } catch (error) {
    console.error('숙제 삭제 오류:', error)
    alert('숙제 삭제에 실패했습니다.')
  }
}

// 각 숙제별 삭제 권한을 computed로 계산
const todoDeletePermissions = computed(() => {
  console.log('todoDeletePermissions computed 실행:', {
    userId: userStore.user?.id,
    userType: typeof userStore.user?.id,
    isSystemUser: isSystemUser.value,
    todosCount: todos.value.length
  })
  
  if (!userStore.user?.id) {
    console.log('사용자 ID가 없음, 빈 Map 반환')
    return new Map()
  }
  
  const permissions = new Map<string, boolean>()
  
  todos.value.forEach(todo => {
    let canDelete = false
    if (todo.is_admin_todo) {
      canDelete = isSystemUser.value
    } else {
      canDelete = userStore.user!.id === todo.created_by
    }
    
    permissions.set(todo.id, canDelete)
    
    console.log(`Todo ${todo.id} (${todo.title}):`, {
      isAdminTodo: todo.is_admin_todo,
      createdBy: todo.created_by,
      currentUserId: userStore.user!.id,
      userIdMatch: userStore.user!.id === todo.created_by,
      canDelete: canDelete
    })
  })
  
  console.log('최종 permissions Map:', Object.fromEntries(permissions))
  return permissions
})

// 숙제 삭제 권한 확인
const canDeleteTodo = (todo: Todo) => {
  const result = todoDeletePermissions.value.get(todo.id) || false
  console.log(`canDeleteTodo(${todo.id}): ${result}`)
  return result
}

// 숙제 수정 모드로 전환
const editTodo = (todo: Todo) => {
  // 시스템 숙제인지 확인
  if (todo.is_admin_todo && !isSystemUser.value) {
    alert('시스템 숙제는 시스템 계정만 수정할 수 있습니다.')
    return
  }

  editingTodo.value = todo
  todoForm.value = {
    title: todo.title,
    description: todo.description || '',
    repeat_cycle: todo.repeat_cycle,
    progress_type: todo.progress_type,
    target_count: todo.target_count || 1
  }
  showAddModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  editingTodo.value = null
  todoForm.value = {
    title: '',
    description: '',
    repeat_cycle: '',
    progress_type: '',
    target_count: 1
  }
}

// 반복 주기 텍스트 변환
const getRepeatCycleText = (cycle: string) => {
  const cycleMap: Record<string, string> = {
    'daily': '일간',
    'weekly': '주간',
    'weekend': '월간'
  }
  return cycleMap[cycle] || cycle
}

// 반복 주기별 배경색 클래스
const getRepeatCycleClass = (todo: Todo) => {
  return {
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': todo.repeat_cycle === 'daily',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': todo.repeat_cycle === 'weekly',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': todo.repeat_cycle === 'weekend'
  }
}

// 진행 종류 텍스트 변환
const getProgressTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    dungeon: '던전',
    quest: '퀘스트',
    purchase: '구매',
    exchange: '교환',
    other: '기타'
  }
  return typeMap[type] || type
}

// 페이지 로드 시 숙제 목록 가져오기
onMounted(() => {
  loadTodos()
})

// 사용자 정보가 로드될 때까지 기다린 후 숙제 목록 다시 로드
watch(() => userStore.user?.id, (newUserId, oldUserId) => {
  console.log('User ID watch triggered:', {
    oldUserId,
    newUserId,
    todosLength: todos.value.length,
    userValue: userStore.user
  })
  
  if (newUserId && todos.value.length > 0) {
    console.log('User loaded, forcing reactivity update')
    // 강제로 반응성 업데이트를 트리거하기 위해 todos를 다시 할당
    const currentTodos = [...todos.value]
    todos.value = []
    nextTick(() => {
      todos.value = currentTodos
    })
  }
})
</script> 
import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

interface Todo {
  id: string
  title: string
  description?: string
  repeat_cycle: 'daily' | 'weekly' | 'weekend'
  progress_type: 'dungeon' | 'quest' | 'purchase' | 'other'
  is_admin_todo: boolean
  organization_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const isLoading = ref(false)
  const lastFetched = ref<number | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5분

  // 캐시가 유효한지 확인
  const isCacheValid = () => {
    if (!lastFetched.value) return false
    return Date.now() - lastFetched.value < CACHE_DURATION
  }

  // 숙제 목록 가져오기
  const fetchTodos = async (force = false): Promise<Todo[]> => {
    // 캐시가 유효하고 강제 새로고침이 아니면 캐시된 데이터 반환
    if (!force && isCacheValid() && todos.value.length > 0) {
      console.log('Using cached todos data')
      return todos.value
    }

    // 이미 로딩 중이면 기다림
    if (isLoading.value) {
      console.log('Todos fetch already in progress, waiting...')
      while (isLoading.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return todos.value
    }

    try {
      isLoading.value = true
      console.log('Fetching todos data from API...')
      
      const response = await $fetch('/api/todos', {
        method: 'GET'
      })

      if (response.success && response.todos) {
        todos.value = response.todos as Todo[]
        lastFetched.value = Date.now()
        console.log('Todos data cached:', todos.value.length, 'todos')
        return todos.value
      } else {
        todos.value = []
        lastFetched.value = null
        return []
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error)
      todos.value = []
      lastFetched.value = null
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 숙제 추가
  const addTodo = async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const response = await $fetch('/api/todos', {
        method: 'POST',
        body: todoData
      })

      if (response.success) {
        // 캐시 무효화하여 다음 요청 시 새로 가져오기
        lastFetched.value = null
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to add todo:', error)
      return false
    }
  }

  // 숙제 수정
  const updateTodo = async (id: string, todoData: Partial<Todo>): Promise<boolean> => {
    try {
      const response = await $fetch(`/api/todos/${id}`, {
        method: 'PUT',
        body: todoData
      })

      if (response.success) {
        // 캐시 무효화
        lastFetched.value = null
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update todo:', error)
      return false
    }
  }

  // 숙제 삭제
  const deleteTodo = async (id: string): Promise<boolean> => {
    try {
      const response = await $fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        // 캐시 무효화
        lastFetched.value = null
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete todo:', error)
      return false
    }
  }

  // 숙제 정보 초기화
  const clearTodos = () => {
    todos.value = []
    lastFetched.value = null
  }

  // 현재 숙제 목록 반환 (캐시 확인 없이)
  const getCurrentTodos = () => todos.value

  return {
    todos: readonly(todos),
    isLoading: readonly(isLoading),
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    clearTodos,
    getCurrentTodos,
    isCacheValid
  }
})

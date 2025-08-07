<template>
  <div class="space-y-8">
    <!-- 헤더 섹션 -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">조직 관리</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">조직을 생성하고 관리할 수 있습니다</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        새 조직 생성
      </button>
    </div>

    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 조직 수</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ organizations.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 사용자 수</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalUsers }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">시스템 숙제</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ systemTodos.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 조직 목록 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">조직 목록</h2>
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
      
      <div v-else-if="organizations.length === 0" class="p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">조직이 없습니다</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">새 조직을 생성해보세요.</p>
      </div>
      
      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="org in organizations" :key="org.id" class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ org.name }}</h3>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  활성
                </span>
              </div>
              <div class="mt-2 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <span>ID: {{ org.id }}</span>
                <span>생성일: {{ formatDate(org.created_at) }}</span>
                <span>사용자: {{ org.user_count || 0 }}명</span>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{{ org.invite_code }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">초대코드</p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="regenerateInviteCode(org.id)"
                  :disabled="regenerating === org.id"
                  class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <span v-if="regenerating === org.id">갱신 중...</span>
                  <span v-else>코드 갱신</span>
                </button>
                <button
                  @click="showSystemTodoModal(org.id)"
                  class="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  숙제 생성
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 조직 생성 모달 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">새 조직 생성</h3>
          <form @submit.prevent="createOrganization" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">조직명</label>
              <input
                v-model="newOrg.name"
                type="text"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="조직명을 입력하세요"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showCreateModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <span v-if="creating">생성 중...</span>
                <span v-else>생성</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 시스템 숙제 생성 모달 -->
    <div v-if="showTodoModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">시스템 숙제 생성</h3>
          <form @submit.prevent="createSystemTodo" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">숙제 제목</label>
              <input
                v-model="newTodo.title"
                type="text"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="숙제 제목을 입력하세요"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">설명</label>
              <textarea
                v-model="newTodo.description"
                rows="3"
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="숙제 설명을 입력하세요"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">진행 종류</label>
              <select
                v-model="newTodo.progress_type"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">선택하세요</option>
                <option value="아르바이트">아르바이트</option>
                <option value="던전">던전</option>
                <option value="퀘스트">퀘스트</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">반복 주기</label>
              <select
                v-model="newTodo.repeat_cycle"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">선택하세요</option>
                <option value="없음">없음</option>
                <option value="일간">일간</option>
                <option value="주간">주간</option>
                <option value="월간">월간</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showTodoModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="creatingTodo"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <span v-if="creatingTodo">생성 중...</span>
                <span v-else>생성</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const supabase = useSupabase()

interface Organization {
  id: string
  name: string
  invite_code: string
  created_at: string
  user_count?: number
}

interface SystemTodo {
  id: string
  title: string
  description: string
  progress_type: string
  repeat_cycle: string
  is_admin_todo: boolean
  organization_id: string | null
  created_at: string
}

const organizations = ref<Organization[]>([])
const systemTodos = ref<SystemTodo[]>([])
const totalUsers = ref(0)
const loading = ref(true)
const creating = ref(false)
const creatingTodo = ref(false)
const regenerating = ref<string | null>(null)
const showCreateModal = ref(false)
const showTodoModal = ref(false)
const selectedOrgId = ref<string | null>(null)

const newOrg = ref({
  name: ''
})

const newTodo = ref({
  title: '',
  description: '',
  progress_type: '',
  repeat_cycle: ''
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  try {
    await Promise.all([
      loadOrganizations(),
      loadSystemTodos(),
      loadUserCount()
    ])
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const loadOrganizations = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        users:users(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    organizations.value = data?.map(org => ({
      ...org,
      user_count: org.users?.[0]?.count || 0
    })) || []
  } catch (error) {
    console.error('Error loading organizations:', error)
  }
}

const loadSystemTodos = async () => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('is_admin_todo', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    systemTodos.value = data || []
  } catch (error) {
    console.error('Error loading system todos:', error)
  }
}

const loadUserCount = async () => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    totalUsers.value = count || 0
  } catch (error) {
    console.error('Error loading user count:', error)
  }
}

const createOrganization = async () => {
  creating.value = true
  
  try {
    // 초대코드 생성 (6자리 랜덤 문자열)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: newOrg.value.name,
        invite_code: inviteCode
      })
      .select()
      .maybeSingle()

    if (error) throw error

    if (!data) {
      throw new Error('Organization creation failed: no data returned')
    }

    organizations.value.unshift({ ...data, user_count: 0 })
    newOrg.value.name = ''
    showCreateModal.value = false
    
    alert(`조직이 생성되었습니다! 초대코드: ${data.invite_code}`)
  } catch (error) {
    console.error('Error creating organization:', error)
    alert('조직 생성 중 오류가 발생했습니다.')
  } finally {
    creating.value = false
  }
}

const regenerateInviteCode = async (orgId: string) => {
  regenerating.value = orgId
  
  try {
    const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data, error } = await supabase
      .from('organizations')
      .update({ invite_code: newInviteCode })
      .eq('id', orgId)
      .select()
      .maybeSingle()

    if (error) throw error

    if (!data) {
      throw new Error('Failed to update invite code')
    }

    // 목록에서 해당 조직 업데이트
    const index = organizations.value.findIndex(org => org.id === orgId)
    if (index !== -1 && organizations.value[index]) {
      organizations.value[index].invite_code = newInviteCode
    }
    
    alert(`초대코드가 갱신되었습니다! 새로운 코드: ${newInviteCode}`)
  } catch (error) {
    console.error('Error regenerating invite code:', error)
    alert('초대코드 갱신 중 오류가 발생했습니다.')
  } finally {
    regenerating.value = null
  }
}

const showSystemTodoModal = (orgId: string) => {
  selectedOrgId.value = orgId
  showTodoModal.value = true
}

const createSystemTodo = async () => {
  creatingTodo.value = true
  
  try {
    const response = await $fetch('/api/admin/todos', {
      method: 'POST',
      body: {
        title: newTodo.value.title,
        description: newTodo.value.description,
        progress_type: newTodo.value.progress_type,
        repeat_cycle: newTodo.value.repeat_cycle,
        organization_id: selectedOrgId.value
      }
    })

    if (response.success && 'todo' in response && response.todo) {
      systemTodos.value.unshift(response.todo as SystemTodo)
      newTodo.value = { title: '', description: '', progress_type: '', repeat_cycle: '' }
      showTodoModal.value = false
      selectedOrgId.value = null
      alert('시스템 숙제이 생성되었습니다!')
    } else {
      throw new Error('Todo creation failed')
    }
  } catch (error) {
    console.error('Error creating system todo:', error)
    alert('시스템 숙제 생성 중 오류가 발생했습니다.')
  } finally {
    creatingTodo.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}
</script> 
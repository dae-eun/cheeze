<template>
  <div class="space-y-8">
    <!-- 페이지 고유 헤더 -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold">사용자 관리</h1>
          <p class="mt-1 opacity-90">모든 사용자를 조회하고 관리합니다</p>
        </div>
        <div class="flex items-center space-x-2">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span class="text-lg font-semibold">User Management</span>
        </div>
      </div>
    </div>

    <!-- 헤더 섹션 -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">사용자 관리</h2>
        <p class="text-gray-600 dark:text-gray-400 mt-1">모든 사용자를 조회하고 관리합니다</p>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">총 사용자</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ users.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">조직별 사용자</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ organizationCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">캐릭터 수</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalCharacters }}</p>
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
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">최근 가입</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ recentUsers }}</p>
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
            placeholder="이름 또는 이메일로 검색..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div class="flex gap-2">
          <select
            v-model="filterOrganization"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">모든 조직</option>
            <option v-for="org in organizations" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
          <select
            v-model="sortBy"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="created_at">가입일순</option>
            <option value="name">이름순</option>
            <option value="email">이메일순</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 사용자 목록 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">사용자 목록</h2>
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
      
      <div v-else-if="filteredUsers.length === 0" class="p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">사용자가 없습니다</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">조건을 변경해보세요.</p>
      </div>
      
      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="user in filteredUsers" :key="user.id" class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">{{ user.name?.charAt(0) || 'U' }}</span>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ user.name }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>가입일: {{ formatDate(user.created_at) }}</span>
                  <span>조직: {{ getOrganizationName(user.organization_id) }}</span>
                  <span>캐릭터: {{ user.character_count || 0 }}개</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="viewUserDetails(user)"
                class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                상세보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 사용자 상세 모달 -->
    <div v-if="showUserModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">사용자 상세 정보</h3>
            <button
              @click="showUserModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="selectedUser" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedUser.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ selectedUser.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">조직</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ getOrganizationName(selectedUser.organization_id) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">가입일</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(selectedUser.created_at) }}</p>
            </div>
            
            <div v-if="selectedUser.characters && selectedUser.characters.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">캐릭터 목록</label>
              <div class="mt-2 space-y-2">
                <div 
                  v-for="character in selectedUser.characters" 
                  :key="character.id"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ character.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ getServerName(character.server_id) }}</p>
                  </div>
                  <span 
                    v-if="character.is_main"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    메인
                  </span>
                </div>
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
  layout: 'admin',
  title: '사용자 관리',
  description: '모든 사용자를 조회하고 관리합니다'
})

// 페이지 고유 메타데이터 설정
useHead({
  title: '사용자 관리 - 관리자 패널',
  meta: [
    { name: 'description', content: '모든 사용자를 조회하고 관리합니다' },
    { property: 'og:title', content: '사용자 관리' },
    { property: 'og:description', content: '모든 사용자를 조회하고 관리합니다' }
  ]
})

const supabase = useSupabase()
const { checkAuth, startAutoRefresh } = useAuth()

interface User {
  id: string
  name: string
  email: string
  organization_id: string | null
  created_at: string
  character_count?: number
  characters?: Array<{
    id: string
    name: string
    server_id: string
    is_main: boolean
    servers?: {
      name: string
    }
  }>
}

interface Organization {
  id: string
  name: string
}

const users = ref<User[]>([])
const organizations = ref<Organization[]>([])
const loading = ref(true)
const showUserModal = ref(false)
const selectedUser = ref<User | null>(null)

const searchQuery = ref('')
const filterOrganization = ref('')
const sortBy = ref('created_at')

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
    await loadUsers()
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await $fetch('/api/admin/users', {
      method: 'GET',
      query: {
        search: searchQuery.value,
        organization_id: filterOrganization.value,
        sort_by: sortBy.value,
        sort_order: 'desc',
        page: 1,
        limit: 100
      }
    })

    if (response.success) {
      users.value = response.users || []
      organizations.value = response.organizations || []
    }
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const loadOrganizations = async () => {
  // loadUsers에서 이미 조직 정보를 함께 가져오므로 별도 호출 불필요
}

const viewUserDetails = (user: User) => {
  selectedUser.value = user
  showUserModal.value = true
}

const getOrganizationName = (orgId: string | null) => {
  if (!orgId) return '알 수 없음'
  const org = organizations.value.find(o => o.id === orgId)
  return org ? org.name : '알 수 없음'
}

const getServerName = (serverId: string) => {
  if (!selectedUser.value?.characters) return ''
  const character = selectedUser.value.characters.find(c => c.server_id === serverId)
  return character?.servers?.name || '알 수 없음'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

// 검색과 필터링이 변경될 때마다 데이터 다시 로드
watch([searchQuery, filterOrganization, sortBy], () => {
  loadUsers()
}, { debounce: 300 })

// 계산된 속성들
const filteredUsers = computed(() => {
  return users.value
})

const organizationCount = computed(() => {
  return [...new Set(users.value.map(user => user.organization_id))].length
})

const totalCharacters = computed(() => {
  return users.value.reduce((total, user) => total + (user.character_count || 0), 0)
})

const recentUsers = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  return users.value.filter(user => new Date(user.created_at) > oneWeekAgo).length
})
</script>

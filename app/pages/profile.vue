<template>
     <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
     <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                             <!-- 계정 정보 -->
         <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
           <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">계정 정보</h2>
          
                    <div v-if="loadingUserInfo" class="space-y-4">
             <div class="animate-pulse">
               <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
               <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
             </div>
             <div class="animate-pulse">
               <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
               <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
             </div>
           </div>
           
                       <div v-else class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
                  <input
                    v-model="userInfo.name"
                    type="text"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="!isEditingUser"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
                  <input
                    v-model="userInfo.email"
                    type="email"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled
                  />
                </div>
              </div>
            </div>
        </div>

                <!-- 캐릭터 정보 -->
         <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
           <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">캐릭터 정보</h2>

           <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           <!-- 메인 캐릭터 -->
              <div v-if="mainCharacter" class="p-4 rounded-lg border-2 border-blue-200 dark:border-blue-500 main-character-card">
                                 <div class="flex justify-between items-center mb-3">
                   <h3 class="text-sm font-medium text-blue-800 dark:text-yellow-300">메인 캐릭터</h3>
                   <button
                     @click="editCharacter(mainCharacter)"
                     class="text-blue-600 hover:text-blue-800 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm"
                   >
                     수정
                   </button>
                 </div>
                <div class="space-y-2">
                  <div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">서버:</span>
                    <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ getServerName(mainCharacter.server_id) }}</span>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">캐릭터명:</span>
                    <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ mainCharacter.name }}</span>
                  </div>
                </div>
              </div>

              <!-- 서브 캐릭터들 -->
              <div v-for="character in subCharacters" :key="character.id" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
               <div class="flex justify-between items-center mb-3">
                 <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">서브 캐릭터</h3>
                 <div class="flex space-x-2">
                                       <button
                      @click="editCharacter(character)"
                      class="text-blue-600 hover:text-blue-800 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm"
                    >
                      수정
                    </button>
                   <button
                     @click="deleteCharacter(character.id)"
                     class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                   >
                     삭제
                   </button>
                 </div>
               </div>
               <div class="space-y-2">
                 <div>
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">서버:</span>
                   <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ getServerName(character.server_id) }}</span>
                 </div>
                 <div>
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">캐릭터명:</span>
                   <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ character.name }}</span>
                 </div>
               </div>
             </div>

             <!-- 캐릭터 추가 카드 -->
             <div 
               @click="addNewCharacter"
               class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors min-h-[120px]"
             >
               <div class="text-gray-400 dark:text-gray-500 mb-2">
                 <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                 </svg>
               </div>
               <p class="text-sm text-gray-500 dark:text-gray-400 text-center">캐릭터 추가</p>
             </div>
           </div>
         </div>
    </div>

                   <!-- 캐릭터 편집 모달 -->
      <div v-if="showCharacterModal" class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ editingCharacter ? '캐릭터 수정' : '캐릭터 추가' }}
          </h3>
          
                   <form @submit.prevent="saveCharacter" class="space-y-4">
             <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">서버 *</label>
                               <div class="relative">
                  <select
                    v-model="characterForm.serverId"
                    required
                    class="custom-select mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">서버를 선택하세요</option>
                    <option v-for="server in servers" :key="server.id" :value="server.id">
                      {{ server.name }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
             </div>
             
             <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">캐릭터명 *</label>
               <input
                 v-model="characterForm.name"
                 type="text"
                 required
                 class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                 placeholder="캐릭터명을 입력하세요"
               />
             </div>
            
            

                       <div>
               <label class="flex items-center">
                 <input
                   v-model="characterForm.isMain"
                   type="checkbox"
                   class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                 />
                 <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">메인 캐릭터로 설정</span>
               </label>
             </div>

            <div class="flex space-x-3">
              <button
                type="submit"
                :disabled="savingCharacter"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {{ savingCharacter ? '저장 중...' : '저장' }}
              </button>
              <button
                type="button"
                @click="closeCharacterModal"
                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

// 타입 정의
interface User {
  id: string
  email: string
  name: string
  organization_id?: string
}

interface UserInfo {
  name: string
  email: string
}

interface Character {
  id: string
  name: string
  server_id: string
  is_main: boolean
  user_id: string
}

interface Server {
  id: string
  name: string
}

interface CharacterForm {
  name: string
  serverId: string
  isMain: boolean
}

definePageMeta({
  layout: 'default'
})

const supabase = useSupabase()
const { startAutoRefresh } = useAuth()
const userStore = useUserStore()
const charactersStore = useCharactersStore()

// 사용자 정보
const userInfo = ref<UserInfo>({
  name: '',
  email: ''
})

const isEditingUser = ref(false)
const savingUser = ref(false)
const originalUserInfo = ref<UserInfo>({
  name: '',
  email: ''
})
const loadingUserInfo = ref(false)

// 캐릭터 정보
const characters = ref<Character[]>([])
const mainCharacter = computed(() => characters.value.find(c => c.is_main))
const subCharacters = computed(() => characters.value.filter(c => !c.is_main))

// 서버 목록
const servers = ref<Server[]>([])

// 캐릭터 모달
const showCharacterModal = ref(false)
const editingCharacter = ref<Character | null>(null)
const savingCharacter = ref(false)
const characterForm = ref<CharacterForm>({
  name: '',
  serverId: '',
  isMain: false
})

// 데이터 로드
const loadUserInfo = async () => {
  const currentUser = userStore.getCurrentUser()
  if (!currentUser) {
    console.log('No user found, skipping loadUserInfo')
    return
  }

  console.log('Loading user info for user ID:', currentUser.id)
  loadingUserInfo.value = true
  try {
    const response = await $fetch(`/api/users/${currentUser.id}`, {
      method: 'GET'
    })

    console.log('User info API response:', response)

    if (response.success) {
      console.log('Setting user info:', response.user)
      userInfo.value = { 
        name: response.user.name, 
        email: response.user.email 
      }
      originalUserInfo.value = { 
        name: response.user.name, 
        email: response.user.email 
      }
    } else {
      console.error('User API returned error:', response)
    }
  } catch (error) {
    console.error('Error loading user info:', error)
  } finally {
    loadingUserInfo.value = false
  }
}

const loadCharacters = async () => {
  try {
    console.log('Loading characters from store...')
    const charactersData = await charactersStore.fetchCharacters()
    characters.value = charactersData
    console.log('Characters loaded from store:', characters.value)
  } catch (error) {
    console.error('Error loading characters:', error)
  }
}

// 서버 목록 로드
const loadServers = async () => {
  try {
    const { data, error: serverError } = await supabase
      .from('servers')
      .select('id, name')
      .order('name')
    
    if (serverError) throw serverError
    servers.value = data || []
  } catch (err) {
    console.error('Error loading servers:', err)
  }
}

// 서버 ID로 서버명 가져오기
const getServerName = (serverId: string): string => {
  const server = servers.value.find(s => s.id === serverId)
  return server ? server.name : '알 수 없음'
}

// 사용자 정보 편집
const startEditUser = () => {
  isEditingUser.value = true
}

const cancelEditUser = () => {
  userInfo.value = { ...originalUserInfo.value }
  isEditingUser.value = false
}

const saveUserInfo = async () => {
  if (!user.value) return

  savingUser.value = true
  try {
    const response = await $fetch(`/api/users/${user.value.id}`, {
      method: 'PUT',
      body: {
        name: userInfo.value.name
      }
    })

    console.log('User update API response:', response)

    if (response.success) {
      originalUserInfo.value = { ...userInfo.value }
      isEditingUser.value = false
    } else {
      console.error('User update API returned error:', response)
    }
  } catch (error) {
    console.error('Error updating user info:', error)
  } finally {
    savingUser.value = false
  }
}

// 캐릭터 관리
const addNewCharacter = () => {
  editingCharacter.value = null
  characterForm.value = {
    name: '',
    serverId: '',
    isMain: false
  }
  showCharacterModal.value = true
}

const editCharacter = (character: Character) => {
  editingCharacter.value = character
  characterForm.value = {
    name: character.name,
    serverId: character.server_id,
    isMain: character.is_main
  }
  showCharacterModal.value = true
}

const closeCharacterModal = () => {
  showCharacterModal.value = false
  editingCharacter.value = null
  characterForm.value = {
    name: '',
    serverId: '',
    isMain: false
  }
}

const saveCharacter = async () => {
  if (!user.value) return

  savingCharacter.value = true
  try {
    if (editingCharacter.value) {
      // 캐릭터 수정
      const response = await $fetch(`/api/characters/${editingCharacter.value.id}`, {
        method: 'PUT',
        body: {
          name: characterForm.value.name,
          server_id: characterForm.value.serverId,
          is_main: characterForm.value.isMain
        }
      })

      if (!response.success) {
        throw new Error('캐릭터 수정에 실패했습니다.')
      }
    } else {
      // 새 캐릭터 추가
      const response = await $fetch('/api/characters', {
        method: 'POST',
        body: {
          user_id: user.value.id,
          name: characterForm.value.name,
          server_id: characterForm.value.serverId,
          is_main: characterForm.value.isMain
        }
      })

      if (!response.success) {
        throw new Error('캐릭터 추가에 실패했습니다.')
      }
    }

    await loadCharacters()
    closeCharacterModal()
  } catch (error) {
    console.error('Error saving character:', error)
  } finally {
    savingCharacter.value = false
  }
}

const deleteCharacter = async (characterId: string) => {
  if (!confirm('정말로 이 캐릭터를 삭제하시겠습니까?')) return

  try {
    const response = await $fetch(`/api/characters/${characterId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      await loadCharacters()
    } else {
      console.error('Error deleting character:', response)
    }
  } catch (error) {
    console.error('Error deleting character:', error)
  }
}

// 페이지 로드 시 데이터 가져오기
onMounted(async () => {
  try {
    console.log('Profile page mounted, loading data...')
    
    // 스토어에서 사용자 정보 가져오기
    const user = await userStore.fetchUser()
    console.log('User loaded from store:', user)
    
    if (user) {
      console.log('User authenticated, loading data...')
      // 순차적으로 로드하여 각각의 성공/실패를 확인
      await loadUserInfo()
      await loadCharacters()
      await loadServers()
      
      // 자동 토큰 리프레시 시작
      startAutoRefresh()
    } else {
      console.log('No authenticated user found')
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})
</script>

<style scoped>
.main-character-card {
  background-color: #f0f9ff; /* bg-blue-50 */
}

.dark .main-character-card {
  background-color: #374151 !important; /* bg-gray-700 */
}

/* 다크모드에서 노란색 글씨 강제 적용 */
.dark .main-character-card h3 {
  color: #fde047 !important; /* text-yellow-300 */
}

.dark .main-character-card button {
  color: #facc15 !important; /* text-yellow-400 */
}

.dark .main-character-card button:hover {
  color: #fde047 !important; /* text-yellow-300 */
}

/* 서브 캐릭터 수정 버튼도 노란색으로 */
.dark .bg-gray-700 button:first-child {
  color: #facc15 !important; /* text-yellow-400 */
}

.dark .bg-gray-700 button:first-child:hover {
  color: #fde047 !important; /* text-yellow-300 */
}

/* 커스텀 드롭다운 스타일 */
.custom-select {
  background-image: none !important;
}

.custom-select option {
  background-color: #ffffff;
  color: #374151;
  padding: 8px 12px;
}

.dark .custom-select option {
  background-color: #374151;
  color: #f9fafb;
}

.custom-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .custom-select:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

/* 드롭다운 화살표 아이콘 애니메이션 */
.custom-select:focus + div svg {
  transform: rotate(180deg);
  transition: transform 0.2s ease-in-out;
}

.custom-select + div svg {
  transition: transform 0.2s ease-in-out;
}
</style> 
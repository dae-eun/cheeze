import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

interface Character {
  id: string
  name: string
  server_id: string
  is_main: boolean
  created_at: string
  updated_at: string
  servers: {
    name: string
  }
}

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref<Character[]>([])
  const isLoading = ref(false)
  const lastFetched = ref<number | null>(null)
  const CACHE_DURATION = 10 * 60 * 1000 // 10분

  // 캐시가 유효한지 확인
  const isCacheValid = () => {
    if (!lastFetched.value) return false
    return Date.now() - lastFetched.value < CACHE_DURATION
  }

  // 캐릭터 목록 가져오기
  const fetchCharacters = async (force = false): Promise<Character[]> => {
    // 캐시가 유효하고 강제 새로고침이 아니면 캐시된 데이터 반환
    if (!force && isCacheValid() && characters.value.length > 0) {
      console.log('Using cached characters data')
      return characters.value
    }

    // 이미 로딩 중이면 기다림
    if (isLoading.value) {
      console.log('Characters fetch already in progress, waiting...')
      while (isLoading.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return characters.value
    }

    try {
      isLoading.value = true
      console.log('Fetching characters data from API...')
      
      const response = await $fetch('/api/characters', {
        method: 'GET'
      })

      if (response.success && response.characters) {
        characters.value = response.characters as Character[]
        lastFetched.value = Date.now()
        console.log('Characters data cached:', characters.value.length, 'characters')
        return characters.value
      } else {
        characters.value = []
        lastFetched.value = null
        return []
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error)
      characters.value = []
      lastFetched.value = null
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 메인 캐릭터 가져오기
  const getMainCharacter = (): Character | null => {
    return characters.value.find(char => char.is_main) || null
  }

  // 캐릭터 정보 초기화
  const clearCharacters = () => {
    characters.value = []
    lastFetched.value = null
  }

  // 현재 캐릭터 목록 반환 (캐시 확인 없이)
  const getCurrentCharacters = () => characters.value

  return {
    characters: readonly(characters),
    isLoading: readonly(isLoading),
    fetchCharacters,
    getMainCharacter,
    clearCharacters,
    getCurrentCharacters,
    isCacheValid
  }
})

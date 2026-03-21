<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/quiz"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ room?.title || '퀴즈 방' }}
      </h1>
      <span
        :class="[
          'px-3 py-1 rounded-full text-sm font-medium',
          room?.status === 'ended'
            ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
            : room?.status === 'playing'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        ]"
      >
        {{ statusText(room?.status) }}
      </span>
    </div>

    <div v-if="loading && !room" class="flex justify-center items-center py-24">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="room">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p v-if="room.description" class="text-gray-600 dark:text-gray-400 mb-4">{{ room.description }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">문제 수: {{ problems.length }}개</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-if="isCreator"
          :to="`/quiz/${id}/manage`"
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          문제 관리
        </NuxtLink>
        <NuxtLink
          v-if="isCreator"
          :to="`/quiz/${id}/results`"
          class="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
        >
          결과 보기
        </NuxtLink>
        <NuxtLink
          :to="`/quiz/${id}/ranking`"
          class="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md"
        >
          랭킹
        </NuxtLink>
        <NuxtLink
          v-if="!isCreator || canPlay"
          :to="`/quiz/${id}/play`"
          class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          {{ hasCompleted ? '결과 보기' : '플레이' }}
        </NuxtLink>
      </div>

      <div v-if="!isCreator && hasCompleted" class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
        <p class="text-sm text-blue-800 dark:text-blue-200">이미 참여 완료했습니다. 결과를 확인해보세요.</p>
        <NuxtLink :to="`/quiz/${id}/result`" class="mt-2 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          내 결과 보기 →
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const userStore = useUserStore()
const room = ref<any>(null)
const problems = ref<any[]>([])
const loading = ref(true)
const playConfig = ref<any>(null)

const isCreator = computed(() => room.value && userStore.user && room.value.created_by === userStore.user.id)
const canPlay = computed(() => playConfig.value?.canPlay ?? false)
const hasCompleted = computed(() => playConfig.value?.existingSession?.status === 'completed')

function statusText(s?: string) {
  return { preparing: '준비중', playing: '진행중', ended: '종료됨' }[s || ''] || s
}

async function fetchData() {
  loading.value = true
  try {
    const [roomRes, configRes] = await Promise.all([
      $fetch<{ room: any; problems: any[] }>(`/api/quiz/rooms/${id.value}`),
      $fetch<{ canPlay: boolean; hasExistingSession: boolean; existingSession: any }>(`/api/quiz/rooms/${id.value}/play-config`).catch(() => null)
    ])
    room.value = roomRes.room
    problems.value = roomRes.problems || []
    playConfig.value = configRes
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  userStore.fetchUser()
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <NuxtLink :to="`/quiz/${id}`" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">참여 결과</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">참여자</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">점수</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">정답</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">소요 시간</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">완료 시각</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="r in results" :key="r.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td class="px-4 py-3 text-gray-900 dark:text-white">{{ r.userName }}</td>
            <td class="px-4 py-3 text-right text-gray-900 dark:text-white">{{ r.total_score }}</td>
            <td class="px-4 py-3 text-right text-gray-900 dark:text-white">{{ r.total_solved_count }}</td>
            <td class="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{{ formatElapsed(r.total_elapsed_ms) }}</td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ formatDate(r.finished_at) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="results.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">참여 결과가 없습니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const results = ref<any[]>([])
const loading = ref(true)

function formatElapsed(ms: number) {
  if (!ms) return '-'
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}분 ${s}초`
}

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleString('ko-KR')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await $fetch<{ results: any[] }>(`/api/quiz/rooms/${id.value}/results`)
    results.value = res.results || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

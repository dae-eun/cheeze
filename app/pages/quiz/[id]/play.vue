<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <div v-if="phase === 'entry'" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">{{ room?.title }}</h2>
      <p v-if="room?.description" class="text-gray-600 dark:text-gray-400 mb-4">{{ room.description }}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">문제 {{ config?.problemCount || 0 }}개 · 1인 1회 참여</p>
      <button
        v-if="config?.canPlay && config?.canStartNew"
        @click="startPlay"
        :disabled="starting"
        class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50"
      >
        {{ starting ? '시작 중...' : '시작하기' }}
      </button>
      <div v-else-if="config?.existingSession?.status === 'completed'" class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <p class="text-blue-800 dark:text-blue-200">이미 참여 완료했습니다.</p>
        <NuxtLink :to="`/quiz/${id}/result`" class="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline">결과 보기 →</NuxtLink>
      </div>
      <div v-else-if="!config?.canPlay" class="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
        <p class="text-amber-800 dark:text-amber-200">현재 플레이 가능한 시간이 아닙니다.</p>
      </div>
      <div v-else-if="config?.existingSession?.status === 'playing'" class="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
        <p class="text-green-800 dark:text-green-200">진행 중인 세션이 있습니다.</p>
        <button @click="resumePlay" :disabled="starting" class="mt-2 px-4 py-2 bg-green-600 text-white rounded-md">이어하기</button>
      </div>
    </div>

    <div v-else-if="phase === 'playing' && currentProblem" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <span class="text-gray-600 dark:text-gray-400">문제 {{ currentOrderNo }} / {{ totalProblems }}</span>
        <div class="flex gap-4">
          <span class="text-amber-600 dark:text-amber-400 font-medium">남은 시간: {{ formatTime(timeLeft) }}</span>
          <span class="text-gray-600 dark:text-gray-400">클릭 {{ remainingClicks }}회</span>
        </div>
      </div>
      <p v-if="currentProblem.title" class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ currentProblem.title }}</p>
      <p v-if="currentProblem.description" class="text-gray-600 dark:text-gray-400 mb-4">{{ currentProblem.description }}</p>

      <div v-if="feedback === 'correct'" class="mb-4 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
        정답!
      </div>

      <div v-if="showNextPrompt" class="mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
        <p class="text-green-800 dark:text-green-200 font-medium">정답입니다! 클릭하여 다음 문제로</p>
        <button @click="goNext" class="mt-2 px-6 py-2 bg-green-600 text-white rounded-md">다음 문제</button>
      </div>

      <div
        v-else
        ref="imageContainerRef"
        class="relative inline-block max-w-full cursor-crosshair"
        @click="onImageClick"
        @touchend.prevent="onTouchEnd"
      >
        <img
          ref="imageRef"
          :src="currentProblem.image_url"
          alt="문제"
          class="max-w-full h-auto block select-none pointer-events-none"
          draggable="false"
        />
        <div
          v-for="(marker, i) in clickMarkers"
          :key="i"
          class="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 pointer-events-none animate-pulse"
          :class="marker.correct ? 'bg-green-500/90 border-green-600 shadow-lg shadow-green-500/50' : 'bg-red-500/90 border-red-600 shadow-lg shadow-red-500/50'"
          :style="{ left: marker.xPercent + '%', top: marker.yPercent + '%' }"
        />
      </div>

      <!-- 오답 토스트 -->
      <Transition name="toast">
        <div
          v-if="toastMessage"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg bg-red-600/95 text-white font-medium shadow-lg z-50"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </div>

    <div v-else-if="phase === 'completed'" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">완료!</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">모든 문제를 풀었습니다.</p>
      <div class="flex justify-center gap-4">
        <NuxtLink :to="`/quiz/${id}/result`" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md">결과 보기</NuxtLink>
        <NuxtLink :to="`/quiz/${id}/ranking`" class="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-md">랭킹</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const phase = ref<'entry' | 'playing' | 'completed'>('entry')
const config = ref<any>(null)
const room = ref<any>(null)
const session = ref<any>(null)
const orders = ref<any[]>([])
const results = ref<any[]>([])
const currentOrderNo = ref(1)
const currentProblem = ref<any>(null)
const totalProblems = ref(0)
const remainingClicks = ref(5)
const timeLeft = ref(0)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
const feedback = ref<'correct' | 'wrong' | null>(null)
const showNextPrompt = ref(false)
const starting = ref(false)
const clickProcessing = ref(false)
const lastTouchTime = ref(0)
const clickMarkers = ref<{ xPercent: number; yPercent: number; correct: boolean }[]>([])
const imageRef = ref<HTMLImageElement | null>(null)
const imageContainerRef = ref<HTMLElement | null>(null)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, duration = 2000) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMessage.value = msg
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
    toastTimer = null
  }, duration)
}

async function fetchConfig() {
  const res = await $fetch<any>(`/api/quiz/rooms/${id.value}/play-config`)
  config.value = res
  room.value = res.room
  return res
}

async function startPlay() {
  starting.value = true
  try {
    const res = await $fetch<{ session: any; resumed?: boolean }>(`/api/quiz/rooms/${id.value}/sessions`, { method: 'POST' })
    session.value = res.session
    await loadSessionState()
    phase.value = 'playing'
    await loadCurrentProblem()
  } catch (e: any) {
    alert(e.data?.statusMessage || '시작 실패')
  } finally {
    starting.value = false
  }
}

async function resumePlay() {
  starting.value = true
  try {
    const res = await $fetch<{ session: any; resumed?: boolean }>(`/api/quiz/rooms/${id.value}/sessions`, { method: 'POST' })
    session.value = res.session
    await loadSessionState()
    phase.value = 'playing'
    await loadCurrentProblem()
  } catch (e: any) {
    alert(e.data?.statusMessage || '이어하기 실패')
  } finally {
    starting.value = false
  }
}

async function loadSessionState() {
  const res = await $fetch<any>(`/api/quiz/sessions/${session.value.id}`)
  orders.value = res.orders || []
  results.value = res.results || []
  totalProblems.value = orders.value.length
  const completedOrderNos = new Set(results.value.map((r: any) => r.order_no))
  const nextOrder = orders.value.find((o: any) => !completedOrderNos.has(o.order_no))
  currentOrderNo.value = nextOrder ? nextOrder.order_no : totalProblems.value
}

async function loadCurrentProblem() {
  const order = orders.value.find((o: any) => o.order_no === currentOrderNo.value)
  if (!order) {
    phase.value = 'completed'
    await completeSession()
    return
  }
  const res = await $fetch<{ problem: any; totalProblems: number }>(`/api/quiz/sessions/${session.value.id}/problems/${order.problem_id}`)
  currentProblem.value = res.problem
  totalProblems.value = res.totalProblems
  remainingClicks.value = currentProblem.value.click_limit
  timeLeft.value = currentProblem.value.time_limit_sec
  feedback.value = null
  showNextPrompt.value = false
  clickMarkers.value = []
  startTimer()
}

function startTimer() {
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerInterval.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      if (timerInterval.value) clearInterval(timerInterval.value)
      handleTimeout()
    }
  }, 1000)
}

async function handleTimeout() {
  feedback.value = 'wrong'
  await goNext()
}

function getNormalizedCoords(clientX: number, clientY: number) {
  if (!imageRef.value || !imageContainerRef.value) return null
  const rect = imageRef.value.getBoundingClientRect()
  const x = (clientX - rect.left) / rect.width
  const y = (clientY - rect.top) / rect.height
  if (x < 0 || x > 1 || y < 0 || y > 1) return null
  return { x, y }
}

async function onImageClick(e: MouseEvent) {
  if (Date.now() - lastTouchTime.value < 400) return
  if (showNextPrompt.value || feedback.value === 'correct' || clickProcessing.value) return
  const coords = getNormalizedCoords(e.clientX, e.clientY)
  if (!coords) return
  await submitClick(coords.x, coords.y)
}

function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t) return
  lastTouchTime.value = Date.now()
  if (showNextPrompt.value || feedback.value === 'correct' || clickProcessing.value) return
  const coords = getNormalizedCoords(t.clientX, t.clientY)
  if (!coords) return
  submitClick(coords.x, coords.y)
}

async function submitClick(x: number, y: number) {
  if (!currentProblem.value || !session.value || clickProcessing.value) return
  clickProcessing.value = true
  try {
    const res = await $fetch<{ correct: boolean; remainingClicks: number; earnedScore?: number }>(`/api/quiz/sessions/${session.value.id}/click`, {
      method: 'POST',
      body: { problemId: currentProblem.value.id, normalizedX: x, normalizedY: y }
    })
    clickMarkers.value = [...clickMarkers.value, { xPercent: x * 100, yPercent: y * 100, correct: res.correct }]
    remainingClicks.value = res.remainingClicks
    feedback.value = res.correct ? 'correct' : 'wrong'
    if (res.correct) {
      if (timerInterval.value) clearInterval(timerInterval.value)
      showNextPrompt.value = true
    } else {
      showToast('오답', 2000)
      if (res.remainingClicks <= 0) {
        setTimeout(() => goNext(), 500)
      }
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '오류')
  } finally {
    clickProcessing.value = false
  }
}

async function goNext() {
  showNextPrompt.value = false
  feedback.value = null
  const resultRes = await $fetch<any>(`/api/quiz/sessions/${session.value.id}`)
  results.value = resultRes.results || []
  const completedOrderNos = new Set(results.value.map((r: any) => r.order_no))
  const nextOrder = orders.value.find((o: any) => !completedOrderNos.has(o.order_no))
  if (nextOrder) {
    currentOrderNo.value = nextOrder.order_no
    await loadCurrentProblem()
  } else {
    phase.value = 'completed'
    await completeSession()
  }
}

async function completeSession() {
  try {
    await $fetch(`/api/quiz/sessions/${session.value.id}/complete`, { method: 'POST' })
  } catch (e) {
    console.error(e)
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

onMounted(async () => {
  await fetchConfig()
  if (config.value?.existingSession?.status === 'playing') {
    const sessionRes = await $fetch<any>(`/api/quiz/rooms/${id.value}/sessions`, { method: 'POST' })
    session.value = sessionRes.session
    if (sessionRes.resumed) {
      await loadSessionState()
      phase.value = 'playing'
      await loadCurrentProblem()
    }
  }
})

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>

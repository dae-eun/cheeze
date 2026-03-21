<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/betting"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ room?.title || '배팅 방' }}
      </h1>
      <span
        v-if="room?.ended_at"
        class="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
      >
        게임 종료됨
      </span>
      <span
        v-else-if="room?.payout_mode === 'double'"
        class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      >
        2배 모드
      </span>
    </div>

    <div v-if="loading && !room" class="flex justify-center items-center py-24">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="room">
      <!-- 참가자 섹션 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">참가자</h3>
          <button
            v-if="canJoin"
            @click="joinRoom"
            :disabled="joining"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50"
          >
            {{ joining ? '참가 중...' : '참가하기' }}
          </button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="p in participants"
            :key="p.id"
            class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <span class="text-gray-900 dark:text-white">{{ getUserName(p.user_id) }}</span>
            <span class="text-gray-600 dark:text-gray-400">{{ p.balance?.toLocaleString() }}칩</span>
          </li>
        </ul>
        <p v-if="participants.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">아직 참가자가 없습니다.</p>
      </div>

      <!-- 현재 라운드 상태 -->
      <div v-if="currentRound" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ roundStatusText }}
          </h3>
          <span
            v-if="currentRound.status === 'betting' || currentRound.status === 'result_pending'"
            class="px-3 py-1 rounded-full text-sm font-medium"
            :class="currentRound.status === 'betting' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'"
          >
            {{ currentRound.status === 'betting' ? '배팅 중' : '결과 대기' }}
          </span>
          <span v-else class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            결과: {{ formatChoice(currentRound.result) }}
          </span>
        </div>

        <!-- 배팅 타이머 -->
        <div v-if="currentRound.status === 'betting' && timeLeft >= 0" class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          배팅 종료까지 {{ formatTimeLeft(timeLeft) }}
        </div>

        <!-- 이월 잭팟 -->
        <div v-if="room?.distribution_method === 'carry_over' && (room?.carry_over_balance ?? 0) > 0" class="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <span class="text-sm font-medium text-amber-800 dark:text-amber-200">이월 잭팟</span>
          <span class="ml-2 text-lg font-bold text-amber-600 dark:text-amber-400">{{ (room?.carry_over_balance ?? 0).toLocaleString() }}칩</span>
        </div>

        <!-- 배팅 현황 -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">배팅 현황</h4>
          <div v-if="bets.length === 0" class="text-sm text-gray-500 dark:text-gray-400">아직 배팅이 없습니다.</div>
          <TransitionGroup
            v-else
            name="bet-stack"
            tag="ul"
            class="space-y-2"
          >
            <li
              v-for="bet in bets"
              :key="bet.id"
              class="bet-stack-item flex justify-between items-center py-1"
            >
              <span class="text-gray-900 dark:text-white">{{ getUserName(bet.user_id) }}</span>
              <span class="text-gray-600 dark:text-gray-400">{{ formatChoice(bet.choice) }} - {{ bet.amount }}칩</span>
            </li>
          </TransitionGroup>
          <p v-if="bets.length > 0" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            총 {{ totalBetAmount }}칩
            <span v-if="room?.distribution_method === 'carry_over' && (room?.carry_over_balance ?? 0) > 0" class="text-amber-600 dark:text-amber-400">
              + 이월 {{ (room?.carry_over_balance ?? 0).toLocaleString() }}칩
            </span>
          </p>
          <div
            v-if="myBet && (currentRound.status === 'betting' || currentRound.status === 'result_pending')"
            class="mt-3 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
          >
            <p class="text-sm">
              <span class="font-medium text-blue-800 dark:text-blue-200">내 배팅</span>
              <span class="text-blue-700 dark:text-blue-300"> {{ formatChoice(myBet.choice) }} {{ myBet.amount.toLocaleString() }}칩</span>
              <span class="text-blue-600 dark:text-blue-400"> · 예상 획득 약 {{ myEstimatedPayout.toLocaleString() }}칩</span>
            </p>
          </div>
        </div>

        <!-- 당첨자 -->
        <div v-if="currentRound.status === 'closed' && payouts.length" class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">당첨자</h4>
          <ul class="space-y-2">
            <li v-for="p in payouts" :key="p.id" class="flex justify-between items-center py-1">
              <span class="text-gray-900 dark:text-white">{{ getUserName(p.user_id) }}</span>
              <span class="text-green-600 dark:text-green-400 font-medium">+{{ p.amount }}칩</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 관리자: 게임 종료 -->
      <div v-if="canEndGame" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <button
          @click="endGame"
          :disabled="endingGame"
          class="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {{ endingGame ? '종료 중...' : '게임 종료' }}
        </button>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">게임을 종료하면 새 라운드 시작 및 참가가 불가능합니다.</p>
      </div>

      <!-- 관리자: 라운드 시작 / 새 라운드 -->
      <div v-if="canStartRound" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ currentRound?.status === 'closed' ? '새 라운드 시작' : '라운드 시작' }}
          </h3>
          <button
            @click="showRoundModal = true"
            :disabled="startingRound"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {{ startingRound ? '시작 중...' : '라운드 시작' }}
          </button>
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">배팅 시간을 설정하고 라운드를 시작합니다.</p>
      </div>

      <!-- 관리자: 배팅 마감 -->
      <div v-if="canEndBetting" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <button
          @click="endBetting"
          :disabled="endingBetting"
          class="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {{ endingBetting ? '마감 중...' : '배팅 마감' }}
        </button>
      </div>

      <!-- 배팅 폼 -->
      <div v-if="canBet" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">배팅하기</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">내 잔액: {{ myBalance }}칩</p>
        <form @submit.prevent="placeBet" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">선택</label>
            <div class="flex gap-2">
              <button
                v-for="c in ['win', 'lose', 'draw']"
                :key="c"
                type="button"
                :class="[
                  'flex-1 py-2 px-3 rounded-md font-medium transition-colors',
                  betForm.choice === c
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
                @click="betForm.choice = c"
              >
                {{ formatChoice(c) }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">금액</label>
            <input
              v-model.number="betForm.amount"
              type="number"
              :min="1"
              :max="myBalance"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="배팅 금액"
            />
          </div>
          <div v-if="betForm.amount >= 1" class="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-sm">
            <p class="font-medium text-gray-700 dark:text-gray-300 mb-2">예상 획득금 (결과 일치 시)</p>
            <div class="space-y-1">
              <p
                v-for="c in ['win', 'lose', 'draw']"
                :key="c"
                class="flex justify-between"
                :class="betForm.choice === c ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'"
              >
                <span>{{ formatChoice(c) }}</span>
                <span class="text-green-600 dark:text-green-400">약 {{ estimatedPayouts[c as 'win'|'lose'|'draw'].toLocaleString() }}칩</span>
              </p>
            </div>
          </div>
          <button
            type="submit"
            :disabled="betting"
            class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {{ betting ? '배팅 중...' : '배팅' }}
          </button>
        </form>
      </div>

      <!-- 관리자: 결과 확정 -->
      <div v-if="canSetResult" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">결과 확정</h3>
        <div class="flex gap-2 mb-4">
          <button
            v-for="c in ['win', 'lose', 'draw']"
            :key="c"
            type="button"
            :class="[
              'flex-1 py-2 px-3 rounded-md font-medium transition-colors',
              resultForm === c
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
            @click="resultForm = c"
          >
            {{ formatChoice(c) }}
          </button>
        </div>
        <button
          type="button"
          :disabled="settingResult"
          class="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50"
          @click="setResult"
        >
          {{ settingResult ? '확정 중...' : '결과 확정' }}
        </button>
      </div>
    </template>

    <div v-else class="text-center text-gray-500 dark:text-gray-400">
      방을 찾을 수 없습니다.
    </div>

    <!-- 라운드 시작 모달 (배팅 시간 입력) -->
    <div
      v-if="showRoundModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showRoundModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">라운드 시작</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">배팅 시간 (분)</label>
            <input
              v-model.number="roundDuration"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="5"
            />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            @click="showRoundModal = false"
          >
            취소
          </button>
          <button
            type="button"
            @click="startRound"
            :disabled="startingRound || roundDuration < 1"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {{ startingRound ? '시작 중...' : '시작' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bet-stack-item {
  transition: all 0.25s ease;
}
.bet-stack-enter-active {
  transition: all 0.3s ease-out;
}
.bet-stack-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.bet-stack-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.bet-stack-move {
  transition: transform 0.25s ease;
}
</style>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const roomId = computed(() => route.params.id as string)

const room = ref<any>(null)
const participants = ref<any[]>([])
const currentRound = ref<any>(null)
const bets = ref<any[]>([])
const payouts = ref<any[]>([])
const userNames = ref<Record<string, string>>({})
const loading = ref(true)
const joining = ref(false)
const betting = ref(false)
const settingResult = ref(false)
const endingBetting = ref(false)
const endingGame = ref(false)
const startingRound = ref(false)
const showRoundModal = ref(false)
const roundDuration = ref(5)
const betForm = ref({ choice: 'win' as 'win' | 'lose' | 'draw', amount: 1000 })
const resultForm = ref<'win' | 'lose' | 'draw'>('win')
const timeLeft = ref(0)
let timerId: ReturnType<typeof setInterval> | null = null

const userStore = useUserStore()
const currentUser = computed(() => userStore.getCurrentUser())

const isManager = computed(() => room.value?.created_by === currentUser.value?.id)

const isEnded = computed(() => !!room.value?.ended_at)

const canJoin = computed(() => {
  if (!room.value || !currentUser.value || isEnded.value) return false
  if (room.value.created_by === currentUser.value.id) return false
  if (participants.value.some((p) => p.user_id === currentUser.value?.id)) return false
  return true
})

const canStartRound = computed(() => {
  return isManager.value && !isEnded.value && (!currentRound.value || currentRound.value.status === 'closed')
})

const canEndGame = computed(() => {
  if (!isManager.value || isEnded.value) return false
  const hasActiveRound = currentRound.value && (currentRound.value.status === 'betting' || currentRound.value.status === 'result_pending')
  return !hasActiveRound
})

const canEndBetting = computed(() => {
  return isManager.value && currentRound.value?.status === 'betting'
})

const canBet = computed(() => {
  if (!room.value || !currentRound.value || currentRound.value.status !== 'betting') return false
  if (room.value.created_by === currentUser.value?.id) return false
  if (bets.value.some((b) => b.user_id === currentUser.value?.id)) return false
  if (timeLeft.value < 0) return false
  return true
})

const canSetResult = computed(() => {
  return isManager.value && currentRound.value?.status === 'result_pending'
})

const myBalance = computed(() => {
  const p = participants.value.find((x) => x.user_id === currentUser.value?.id)
  return p?.balance ?? 0
})

const totalBetAmount = computed(() => bets.value.reduce((s, b) => s + b.amount, 0))

function getEstimatedPayoutForBet(choice: string, amount: number): number {
  if (!amount || amount < 1 || !room.value) return 0
  const carryOver = room.value.carry_over_balance ?? 0
  const roundPool = totalBetAmount.value
  const totalPool = carryOver + roundPool
  const feePercent = room.value.fee_percent ?? 0
  const fee = Math.floor((roundPool * feePercent) / 100)
  const distributable = totalPool - fee
  const totalWinningAmount = bets.value.filter((b) => b.choice === choice).reduce((s, b) => s + b.amount, 0)
  if (totalWinningAmount <= 0) return 0
  const isDoubleMode = room.value.payout_mode === 'double'
  const totalTargetPayout = totalWinningAmount * 2
  if (isDoubleMode && distributable >= totalTargetPayout) return amount * 2
  return Math.floor((distributable * amount) / totalWinningAmount)
}

function getEstimatedPayout(choice: 'win' | 'lose' | 'draw'): number {
  const amount = betForm.value.amount
  if (!amount || amount < 1) return 0
  const roundPool = totalBetAmount.value + amount
  const carryOver = room.value?.carry_over_balance ?? 0
  const totalPool = carryOver + roundPool
  const feePercent = room.value?.fee_percent ?? 0
  const fee = Math.floor((roundPool * feePercent) / 100)
  const distributable = totalPool - fee
  const winningAmount = bets.value.filter((b) => b.choice === choice).reduce((s, b) => s + b.amount, 0)
  const totalWinningAmount = winningAmount + amount
  if (totalWinningAmount <= 0) return 0
  const isDoubleMode = room.value?.payout_mode === 'double'
  const totalTargetPayout = totalWinningAmount * 2
  if (isDoubleMode && distributable >= totalTargetPayout) return amount * 2
  return Math.floor((distributable * amount) / totalWinningAmount)
}

const estimatedPayouts = computed(() => ({
  win: getEstimatedPayout('win'),
  lose: getEstimatedPayout('lose'),
  draw: getEstimatedPayout('draw')
}))

const myBet = computed(() =>
  bets.value.find((b) => b.user_id === currentUser.value?.id)
)

const myEstimatedPayout = computed(() => {
  const bet = myBet.value
  if (!bet || !room.value) return 0
  return getEstimatedPayoutForBet(bet.choice, bet.amount)
})

const roundStatusText = computed(() => {
  if (!currentRound.value) return ''
  if (currentRound.value.status === 'betting') return `배팅 중 (${currentRound.value.betting_duration_minutes}분)`
  if (currentRound.value.status === 'result_pending') return '결과 대기'
  return `결과: ${formatChoice(currentRound.value.result)}`
})

function formatChoice(c: string) {
  const map: Record<string, string> = { win: '승', lose: '패', draw: '무승부' }
  return map[c] || c
}

function formatTimeLeft(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}분 ${s}초`
}

function getUserName(userId: string) {
  if (userId === currentUser.value?.id) return currentUser.value?.name || '나'
  return userNames.value[userId] || `사용자 ${userId.slice(0, 8)}`
}

function updateTimer() {
  if (!currentRound.value || currentRound.value.status !== 'betting') return
  const ends = new Date(currentRound.value.ends_at).getTime()
  const now = Date.now()
  timeLeft.value = Math.max(0, Math.floor((ends - now) / 1000))
  if (timeLeft.value <= 0 && timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

async function fetchRoom(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true
  try {
    const res = await $fetch<{ success: boolean; room: any }>(`/api/betting/rooms/${roomId.value}`)
    room.value = res.room
    participants.value = res.room.participants || []
    currentRound.value = res.room.currentRound || null
    bets.value = res.room.bets || []
    payouts.value = res.room.payouts || []
    betForm.value.amount = Math.max(1, Math.floor((res.room?.initial_funds || 10000) / 10))
    const ids = new Set([
      res.room.created_by,
      ...participants.value.map((p: any) => p.user_id),
      ...bets.value.map((b: any) => b.user_id),
      ...payouts.value.map((p: any) => p.user_id)
    ])
    await fetchUserNames([...ids])
    updateTimer()
  } catch (e) {
    console.error(e)
    room.value = null
  } finally {
    loading.value = false
  }
}

async function fetchUserNames(ids: string[]) {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return
  try {
    const promises = unique.map((id) =>
      $fetch<{ success: boolean; user: { id: string; name: string } }>(`/api/users/${id}`)
    )
    const results = await Promise.all(promises)
    const map: Record<string, string> = {}
    results.forEach((r) => {
      if (r.success && r.user) map[r.user.id] = r.user.name
    })
    userNames.value = { ...userNames.value, ...map }
  } catch {
    // ignore
  }
}

const { subscribe, unsubscribe } = useBettingRealtime()

onMounted(async () => {
  await fetchRoom()
  if (room.value && currentUser.value?.organization_id) {
    subscribe(room.value.organization_id, roomId.value, (event) => {
      if (event.event === 'participant_joined') {
        fetchRoom({ silent: true })
      } else if (event.event === 'round_started') {
        fetchRoom({ silent: true })
        if (timerId) clearInterval(timerId)
        timerId = setInterval(updateTimer, 1000)
      } else if (event.event === 'betting_ended') {
        fetchRoom({ silent: true })
      } else if (event.event === 'bet_placed') {
        bets.value = [...bets.value, event.payload.bet]
        fetchUserNames([event.payload.bet.user_id])
      } else if (event.event === 'result_announced' || event.event === 'payout_completed') {
        fetchRoom({ silent: true })
      } else if (event.event === 'game_ended') {
        fetchRoom({ silent: true })
      }
    })
  }
  if (currentRound.value?.status === 'betting') {
    timerId = setInterval(updateTimer, 1000)
  }
})

onUnmounted(() => {
  unsubscribe()
  if (timerId) clearInterval(timerId)
})

async function joinRoom() {
  joining.value = true
  try {
    await $fetch(`/api/betting/rooms/${roomId.value}/join`, { method: 'POST' })
    await fetchRoom({ silent: true })
  } catch (e: any) {
    alert(e.data?.message || '참가에 실패했습니다.')
  } finally {
    joining.value = false
  }
}

async function startRound() {
  if (roundDuration.value < 1) return
  startingRound.value = true
  try {
    await $fetch(`/api/betting/rooms/${roomId.value}/rounds/start`, {
      method: 'POST',
      body: { betting_duration_minutes: roundDuration.value }
    })
    showRoundModal.value = false
    roundDuration.value = 5
    await fetchRoom({ silent: true })
    timerId = setInterval(updateTimer, 1000)
  } catch (e: any) {
    alert(e.data?.message || '라운드 시작에 실패했습니다.')
  } finally {
    startingRound.value = false
  }
}

async function endBetting() {
  if (!currentRound.value) return
  endingBetting.value = true
  try {
    await $fetch(`/api/betting/rooms/${roomId.value}/rounds/${currentRound.value.id}/end-betting`, {
      method: 'POST'
    })
    await fetchRoom({ silent: true })
  } catch (e: any) {
    alert(e.data?.message || '배팅 마감에 실패했습니다.')
  } finally {
    endingBetting.value = false
  }
}

async function placeBet() {
  if (betForm.value.amount < 1 || betForm.value.amount > myBalance.value) {
    alert('잔액 범위 내에서 배팅해주세요.')
    return
  }
  betting.value = true
  try {
    const res = await $fetch<{ success: boolean; bet: any }>(
      `/api/betting/rooms/${roomId.value}/rounds/${currentRound.value.id}/bets`,
      {
        method: 'POST',
        body: { choice: betForm.value.choice, amount: betForm.value.amount }
      }
    )
    bets.value = [...bets.value, res.bet]
    await fetchRoom({ silent: true })
  } catch (e: any) {
    alert(e.data?.message || '배팅에 실패했습니다.')
  } finally {
    betting.value = false
  }
}

async function endGame() {
  endingGame.value = true
  try {
    await $fetch(`/api/betting/rooms/${roomId.value}/end`, { method: 'POST' })
    await fetchRoom({ silent: true })
  } catch (e: any) {
    alert(e.data?.message || '게임 종료에 실패했습니다.')
  } finally {
    endingGame.value = false
  }
}

async function setResult() {
  if (!currentRound.value) return
  settingResult.value = true
  try {
    await $fetch(`/api/betting/rooms/${roomId.value}/rounds/${currentRound.value.id}/result`, {
      method: 'POST',
      body: { result: resultForm.value }
    })
    await fetchRoom({ silent: true })
  } catch (e: any) {
    alert(e.data?.message || '결과 확정에 실패했습니다.')
  } finally {
    settingResult.value = false
  }
}
</script>

export type BettingRealtimeEvent =
  | { event: 'participant_joined'; payload: { participant: { user_id: string; balance: number } } }
  | { event: 'round_started'; payload: { round: { id: string; betting_duration_minutes: number; started_at: string; ends_at: string; status: string } } }
  | { event: 'betting_ended'; payload: { roundId: string } }
  | { event: 'bet_placed'; payload: { bet: { id: string; user_id: string; choice: string; amount: number; created_at: string } } }
  | { event: 'result_announced'; payload: { result: string; payouts: Array<{ user_id: string; amount: number }>; roundId?: string } }
  | { event: 'payout_completed'; payload: { payouts: Array<{ user_id: string; amount: number }> } }
  | { event: 'game_ended'; payload: { roomId: string } }

export function useBettingRealtime() {
  const supabase = useSupabase()
  const channelRef = ref<ReturnType<typeof supabase.channel> | null>(null)

  function subscribe(
    organizationId: string,
    roomId: string,
    onEvent: (data: BettingRealtimeEvent) => void
  ) {
    if (channelRef.value) {
      supabase.removeChannel(channelRef.value as any)
      channelRef.value = null
    }

    const channelName = `betting:org:${organizationId}:room:${roomId}`
    const channel = supabase.channel(channelName)

    const handlePayload = (event: BettingRealtimeEvent['event']) => (payload: any) => {
      const data = payload?.payload ?? payload
      onEvent({ event, payload: data } as BettingRealtimeEvent)
    }

    channel
      .on('broadcast', { event: 'participant_joined' }, handlePayload('participant_joined'))
      .on('broadcast', { event: 'round_started' }, handlePayload('round_started'))
      .on('broadcast', { event: 'betting_ended' }, handlePayload('betting_ended'))
      .on('broadcast', { event: 'bet_placed' }, handlePayload('bet_placed'))
      .on('broadcast', { event: 'result_announced' }, handlePayload('result_announced'))
      .on('broadcast', { event: 'payout_completed' }, handlePayload('payout_completed'))
      .on('broadcast', { event: 'game_ended' }, handlePayload('game_ended'))
      .subscribe()

    channelRef.value = channel
  }

  function unsubscribe() {
    if (channelRef.value) {
      supabase.removeChannel(channelRef.value as any)
      channelRef.value = null
    }
  }

  onUnmounted(() => {
    unsubscribe()
  })

  return { subscribe, unsubscribe }
}

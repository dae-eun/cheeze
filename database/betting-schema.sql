-- 배팅 시스템 테이블 스키마 (홀덤식 개선)
-- Supabase SQL Editor에서 실행
-- 기존 데이터가 있다면 database/betting-migration.sql 참고

-- 1. betting_rooms: 배팅 방
CREATE TABLE IF NOT EXISTS betting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  initial_funds INTEGER NOT NULL DEFAULT 10000 CHECK (initial_funds > 0),
  distribution_method TEXT NOT NULL DEFAULT 'carry_over' CHECK (distribution_method IN ('carry_over', 'disappear')),
  payout_mode TEXT NOT NULL DEFAULT 'pool' CHECK (payout_mode IN ('pool', 'double')),
  fee_percent INTEGER NOT NULL DEFAULT 0 CHECK (fee_percent >= 0 AND fee_percent <= 100),
  carry_over_balance INTEGER NOT NULL DEFAULT 0 CHECK (carry_over_balance >= 0),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_betting_rooms_organization ON betting_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_betting_rooms_created_by ON betting_rooms(created_by);

-- 2. room_participants: 방 참가자 (잔액 관리)
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES betting_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);

-- 3. betting_rounds: 라운드 (배팅 시간 라운드별 설정)
CREATE TABLE IF NOT EXISTS betting_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES betting_rooms(id) ON DELETE CASCADE,
  betting_duration_minutes INTEGER NOT NULL CHECK (betting_duration_minutes > 0),
  started_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'betting' CHECK (status IN ('betting', 'result_pending', 'closed')),
  result TEXT CHECK (result IS NULL OR result IN ('win', 'lose', 'draw')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_betting_rounds_room ON betting_rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_betting_rounds_status ON betting_rounds(room_id, status);

-- 4. bets: 배팅 내역 (라운드별)
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES betting_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('win', 'lose', 'draw')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bets_round ON bets(round_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);

-- 5. payouts: 정산 결과 (라운드별)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES betting_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_payouts_round ON payouts(round_id);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_betting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS betting_rooms_updated_at ON betting_rooms;
CREATE TRIGGER betting_rooms_updated_at
  BEFORE UPDATE ON betting_rooms
  FOR EACH ROW EXECUTE FUNCTION update_betting_updated_at();

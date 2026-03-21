-- 기존 배팅 스키마에서 홀덤식으로 마이그레이션
-- 기존 데이터가 있는 경우 실행 (데이터 손실 발생 가능)

-- 1. 기존 bets, payouts 삭제 (round_id 구조로 변경)
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS bets;

-- 2. betting_rooms 수정
ALTER TABLE betting_rooms DROP COLUMN IF EXISTS creator_choice;
ALTER TABLE betting_rooms DROP COLUMN IF EXISTS result;
ALTER TABLE betting_rooms ADD COLUMN IF NOT EXISTS initial_funds INTEGER NOT NULL DEFAULT 10000;
ALTER TABLE betting_rooms ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE betting_rooms ADD COLUMN IF NOT EXISTS distribution_method TEXT NOT NULL DEFAULT 'carry_over';
ALTER TABLE betting_rooms ADD COLUMN IF NOT EXISTS fee_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE betting_rooms ADD COLUMN IF NOT EXISTS carry_over_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE betting_rooms ADD COLUMN IF NOT EXISTS payout_mode TEXT NOT NULL DEFAULT 'pool';
ALTER TABLE betting_rooms ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- 3. room_participants, betting_rounds 생성 (betting-schema.sql 참고)
-- 4. bets, payouts 재생성
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

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES betting_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_payouts_round ON payouts(round_id);

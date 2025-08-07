# 숙제도우미 (Homework Helper)

조직별로 관리하는 클라우드 Todo 리스트 애플리케이션입니다.

## 🚀 기술 스택

- **Frontend**: Nuxt 4 (Vue 3)
- **Backend**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Nuxt UI
- **Package Manager**: Bun
- **Deployment**: Vercel

## 📋 주요 기능

- ✅ 초대코드 기반 회원가입
- ✅ Salt + Hash 비밀번호 암호화
- ✅ 조직별 회원 관리
- ✅ 캐릭터 시스템 (메인/서브 캐릭터 관리)
- ✅ 숙제 진행 종류 분류 (아르바이트, 던전, 퀘스트, 기타)
- ✅ 반복 일정 설정 (일간, 주간, 월간)
- ✅ 실시간 통계 대시보드
- ✅ 반응형 디자인

## 🛠️ 설치 및 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd cheeze
bun install
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `database/schema.sql` 파일의 내용을 실행
3. Settings > API에서 URL과 anon key 복사

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. 데이터베이스 설정

Supabase SQL Editor에서 다음 순서로 SQL 스크립트를 실행하세요:

```sql
-- 1. 기본 테이블 생성
-- database/1-create-tables.sql 실행

-- 2. 인덱스 생성
-- database/2-create-indexes.sql 실행

-- 3. 서버 목록 데이터 삽입
-- database/3-insert-server-data.sql 실행

-- 4. RLS 활성화
-- database/4-enable-rls.sql 실행

-- 5. RLS 정책 생성
-- database/5-create-rls-policies.sql 실행

-- 6. 트리거 생성
-- database/6-create-triggers.sql 실행

-- 7. 샘플 데이터 삽입 (선택사항)
-- database/7-insert-sample-data.sql 실행
```

### 5. 개발 서버 실행

```bash
bun run dev
```

## 📊 데이터베이스 스키마

### Organizations (조직)
- `id`: UUID (Primary Key)
- `name`: 조직명
- `invite_code`: 초대코드 (Unique)
- `created_at`, `updated_at`: 타임스탬프

### Users (사용자)
- `id`: UUID (Primary Key)
- `email`: 이메일 (Unique)
- `password_hash`: 암호화된 비밀번호
- `salt`: 비밀번호 암호화용 Salt
- `name`: 사용자명
- `organization_id`: 조직 ID (Foreign Key)
- `created_at`, `updated_at`: 타임스탬프

### Servers (서버)
- `id`: UUID (Primary Key)
- `name`: 서버명 (Unique)
- `created_at`, `updated_at`: 타임스탬프

### Characters (캐릭터)
- `id`: UUID (Primary Key)
- `user_id`: 사용자 ID (Foreign Key)
- `name`: 캐릭터명
- `server_id`: 서버 ID (Foreign Key)
- `is_main`: 메인 캐릭터 여부 (Boolean)
- `created_at`, `updated_at`: 타임스탬프

### Tasks (숙제)
- `id`: UUID (Primary Key)
- `title`: 숙제 제목
- `description`: 숙제 설명
- `task_type`: 진행 종류 (아르바이트, 던전, 퀘스트, 기타)
- `repeat_type`: 반복일 (없음, 일간, 주간, 월간)
- `repeat_days`: 반복 요일 (JSON)
- `due_date`: 마감일
- `completed`: 완료 여부
- `user_id`: 사용자 ID (Foreign Key)
- `character_id`: 캐릭터 ID (Foreign Key)
- `organization_id`: 조직 ID (Foreign Key)
- `created_at`, `updated_at`: 타임스탬프

## 🔐 보안 기능

- **Row Level Security (RLS)**: Supabase RLS를 통한 데이터 접근 제어
- **비밀번호 암호화**: Salt + SHA-256 해시 방식
- **세션 관리**: 로컬 스토리지 기반 세션 관리
- **입력 검증**: 클라이언트/서버 양쪽 검증

## 🚀 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 새 프로젝트 생성
3. GitHub 저장소 연결
4. 환경변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
5. 배포 완료

## 📱 사용 방법

### 1. 회원가입
- 초대코드를 입력하여 조직에 가입
- 이메일, 비밀번호, 이름 입력
- 메인 캐릭터 필수 입력 (캐릭터명, 서버)
- 서브 캐릭터 선택적 추가 (+ 버튼으로 추가 가능)
- Salt + Hash 방식으로 비밀번호 암호화

### 2. 로그인
- 이메일과 비밀번호로 로그인
- 세션은 24시간 유지

### 3. 캐릭터 관리
- 내정보 페이지에서 캐릭터 정보 확인 및 수정
- 새 캐릭터 추가 (캐릭터명, 서버)
- 메인/서브 캐릭터 구분 관리
- 캐릭터 삭제 기능

### 4. 숙제 관리
- 새 숙제 추가 (제목, 설명, 진행 종류, 반복일, 마감일)
- 캐릭터별로 숙제 진행 관리
- 숙제 완료/미완료 토글
- 숙제 수정 및 삭제
- 실시간 통계 확인

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일/데스크톱 대응
- **모던한 UI**: Tailwind CSS + Nuxt UI
- **직관적인 UX**: 체크박스, 모달, 통계 카드
- **접근성**: 적절한 라벨링과 키보드 네비게이션

## 🔧 개발 환경

- Node.js 18+
- Bun 1.0+
- Supabase CLI (선택사항)

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

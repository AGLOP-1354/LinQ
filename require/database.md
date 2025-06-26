# LinQ 데이터베이스 설계 문서 (2024년 12월 최신 업데이트 - Supabase)

## 1. 프로젝트 개요

**LinQ 데이터베이스**는 AI 기반 스마트 일정 관리 서비스의 **Supabase PostgreSQL** 기반 데이터 저장소입니다.
현재 **설계 단계**에 있으며, 프론트엔드가 **MVP+ 단계 (실제 카카오 로그인 + 자연어 처리 포함)**로 진입함에 따라 데이터베이스 구현이 최우선 과제로 설정되었습니다.

**현재 상태: 0% (설계 단계)** **우선순위: 최고 (Supabase 기반 급속 개발)**

### 🚨 긴급성 급증

프론트엔드가 **완전한 MVP+ 상태**에 도달함에 따라 데이터베이스 구현의 긴급성이 급격히 증가했습니다.

**현재 프론트엔드 데이터 연동 준비 상황:**
- ✅ Event 인터페이스 완전 정의 및 구현 (8개 샘플 데이터)
- ✅ 실제 카카오 로그인 시스템 (사용자 정보 관리 필요)
- ✅ 자연어 기반 일정 등록 (AI 분석 결과 저장 필요)
- ✅ 실시간 통계 및 상태 관리 (실시간 데이터 동기화 필요)

### 🔄 Supabase PostgreSQL 채택

**기존 계획 (MongoDB)** 대신 **Supabase PostgreSQL**을 채택하여 개발 속도를 3-4배 가속화하고 완전 관리형 데이터베이스의 장점을 활용하기로 결정했습니다.

---

## 2. 현재 프론트엔드 데이터 모델 현황

### 2.1 ✅ 프론트엔드에서 완전 구현된 데이터 구조

#### User 인터페이스 (카카오 로그인 완전 구현)
```typescript
// 실제 카카오 로그인에서 사용 중인 User 구조
interface User {
  id: string; // Supabase UUID로 매핑
  name: string; // 카카오 닉네임
  email: string; // 카카오 이메일
  avatar?: string; // 카카오 프로필 이미지
  provider: 'kakao' | 'google' | 'apple'; // 현재 카카오만 구현
}
```

#### Event 인터페이스 (완전 구현됨)
```typescript
// 프론트엔드에서 실제 사용 중인 Event 구조 (2100+ 라인 구현)
interface Event {
  id: string; // Supabase UUID로 매핑
  title: string; // 일정 제목
  startDate: Date; // 시작 시간
  endDate: Date; // 종료 시간
  isAllDay: boolean; // 종일 여부 (완전 구현)
  color: string; // 8가지 색상 팔레트 (완전 구현)
  location?: string; // 8가지 장소 프리셋 (완전 구현)
  notifications: string[]; // 5가지 알림 옵션 (완전 구현)
  category: 'work' | 'health' | 'social' | 'personal'; // 완전 구현
  isCompleted?: boolean; // 완료 상태 토글 (완전 구현)
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // 구현 준비됨
}
```

#### AI 분석 데이터 (자연어 처리 완전 구현)
```typescript
// NaturalLanguageEventDrawer에서 생성하는 데이터 (870+ 라인 구현)
interface NaturalLanguageAnalysis {
  originalText: string; // "내일 오후 2시에 회의"
  parsed: {
    title: string;
    startDate: Date;
    endDate: Date;
    category: string;
    confidence: number; // AI 신뢰도 (0-1)
  };
  suggestions: string[]; // 스마트 제안 키워드
}
```

---

## 3. Supabase PostgreSQL 기반 데이터베이스 설계

### 3.1 기술 스택 선택

#### Supabase PostgreSQL 장점

**vs MongoDB 비교:**
- **스키마 안정성**: 타입 안전성 보장
- **관계형 데이터**: 사용자-이벤트 관계 최적화
- **SQL 표준**: 복잡한 쿼리 및 집계 최적화
- **완전 관리형**: 백업, 확장, 보안 자동화
- **실시간 기능**: 내장 Realtime 구독

### 3.2 데이터베이스 구조 개요

```
Supabase Database Schema:

auth.users (내장)           user_profiles (확장)
├── id (UUID)              ├── id (→ auth.users.id)
├── email                  ├── name
├── created_at             ├── avatar_url
└── ...                    ├── provider
                          └── preferences

events                     ai_analysis
├── id (UUID)              ├── id (UUID)
├── user_id (→ auth.users) ├── user_id (→ auth.users)
├── title                  ├── type
├── start_date             ├── input_text
├── end_date               ├── input_hash
├── is_all_day             ├── output
├── color                  ├── confidence
├── location               ├── model
├── notifications          └── created_at
├── category
├── is_completed
├── priority
├── created_at
└── updated_at
```

---

## 4. 상세 테이블 스키마

### 4.1 User Profiles (Supabase Auth 확장)

```sql
-- 사용자 프로필 (auth.users 테이블 확장)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- 기본 프로필 정보 (카카오 로그인에서 가져옴)
  name TEXT NOT NULL,
  avatar_url TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('kakao', 'google', 'apple')),

  -- 사용자 설정 (프론트엔드 테마 시스템과 완벽 호환)
  preferences JSONB DEFAULT '{
    "theme": "system",
    "notifications": true,
    "aiSuggestions": true,
    "defaultCategory": "work"
  }'::jsonb,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security 정책
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON public.user_profiles
  USING (auth.uid() = id);
```

### 4.2 Events (프론트엔드 완벽 호환)

```sql
-- 이벤트 테이블 (프론트엔드 Event 인터페이스와 1:1 매핑)
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 프론트엔드 필드와 완전 일치
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,

  -- 프론트엔드 8색 팔레트 완전 매핑
  color TEXT NOT NULL CHECK (color IN (
    '#EF4444', -- 빨강
    '#F97316', -- 주황
    '#EAB308', -- 노랑
    '#22C55E', -- 초록
    '#3B82F6', -- 파랑
    '#8B5CF6', -- 보라
    '#EC4899', -- 분홍
    '#6B7280'  -- 회색
  )),

  location TEXT,
  notifications TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 프론트엔드 카테고리 시스템 완전 호환
  category TEXT NOT NULL CHECK (category IN ('work', 'health', 'social', 'personal')),

  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성능 최적화 인덱스 (프론트엔드 쿼리 패턴 기반)
CREATE INDEX idx_events_user_date ON public.events(user_id, start_date);
CREATE INDEX idx_events_user_category ON public.events(user_id, category);
CREATE INDEX idx_events_user_completed ON public.events(user_id, is_completed);

-- Row Level Security 정책
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own events" ON public.events
  USING (auth.uid() = user_id);
```

### 4.3 AI Analysis (자연어 처리 결과 저장)

```sql
-- AI 분석 결과 저장 (NaturalLanguageEventDrawer 지원)
CREATE TABLE public.ai_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 분석 타입
  type TEXT NOT NULL CHECK (type IN ('parsing', 'priority', 'suggestion')),

  -- 입력 데이터
  input_text TEXT NOT NULL,
  input_hash TEXT NOT NULL, -- 중복 분석 방지

  -- AI 분석 결과
  output JSONB NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  -- AI 모델 메타데이터
  model TEXT NOT NULL DEFAULT 'solar-pro',
  processing_time INTEGER, -- 처리 시간 (ms)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캐싱 최적화 인덱스
CREATE INDEX idx_ai_analysis_hash ON public.ai_analysis(input_hash, type);

-- Row Level Security
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI analysis" ON public.ai_analysis
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. 프론트엔드 데이터 마이그레이션

### 5.1 샘플 데이터 마이그레이션 스크립트

```sql
-- 프론트엔드 샘플 이벤트 8개 마이그레이션
INSERT INTO public.events (
  user_id, title, start_date, end_date, is_all_day, color,
  category, is_completed, priority, notifications
) VALUES
  (
    auth.uid(),
    '팀 스탠드업',
    '2024-12-02T09:00:00+09:00',
    '2024-12-02T09:30:00+09:00',
    FALSE,
    '#3B82F6',
    'work',
    TRUE,
    'HIGH',
    ARRAY['정시']
  ),
  (
    auth.uid(),
    '프로젝트 리뷰',
    '2024-12-02T14:00:00+09:00',
    '2024-12-02T15:00:00+09:00',
    FALSE,
    '#EF4444',
    'work',
    FALSE,
    'HIGH',
    ARRAY['15분전', '정시']
  ),
  (
    auth.uid(),
    '점심 약속',
    '2024-12-02T12:00:00+09:00',
    '2024-12-02T13:00:00+09:00',
    FALSE,
    '#22C55E',
    'social',
    TRUE,
    'MEDIUM',
    ARRAY['15분전']
  ),
  (
    auth.uid(),
    '요가 클래스',
    '2024-12-02T18:00:00+09:00',
    '2024-12-02T19:00:00+09:00',
    FALSE,
    '#8B5CF6',
    'health',
    FALSE,
    'MEDIUM',
    ARRAY['30분전']
  );
```

### 5.2 API 응답 포맷터 (PostgreSQL → 프론트엔드)

```typescript
// Supabase 데이터를 프론트엔드 Event 인터페이스로 변환
const formatEventForFrontend = (dbEvent: any): Event => {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    startDate: new Date(dbEvent.start_date),
    endDate: new Date(dbEvent.end_date),
    isAllDay: dbEvent.is_all_day,
    color: dbEvent.color,
    location: dbEvent.location,
    notifications: dbEvent.notifications,
    category: dbEvent.category,
    isCompleted: dbEvent.is_completed || false,
    priority: dbEvent.priority,
  };
};
```

---

## 6. 성능 최적화 전략

### 6.1 쿼리 최적화

```sql
-- 캘린더 뷰: 날짜 범위별 이벤트 조회
SELECT * FROM public.events
WHERE user_id = $1
  AND start_date >= $2
  AND start_date <= $3
ORDER BY start_date ASC;

-- 완료 상태별 필터링
SELECT * FROM public.events
WHERE user_id = $1
  AND is_completed = FALSE
ORDER BY start_date ASC;

-- 실시간 통계 계산
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_completed = TRUE) as completed
FROM public.events
WHERE user_id = $1
  AND DATE(start_date) = CURRENT_DATE;
```

---

## 7. 개발 우선순위 로드맵

### 📋 Phase 1: Supabase 데이터베이스 기본 설정 (1주) - **최우선**

#### Day 1-2: 스키마 구현
- [ ] Supabase 프로젝트 생성
- [ ] user_profiles 테이블 생성 (카카오 로그인 지원)
- [ ] events 테이블 생성 (프론트엔드 완벽 호환)
- [ ] 기본 인덱스 생성

#### Day 3-4: 성능 최적화
- [ ] 복합 인덱스 구현
- [ ] RLS 정책 설정
- [ ] 통계 뷰 생성

#### Day 5-7: 데이터 마이그레이션 및 테스트
- [ ] 프론트엔드 샘플 데이터 마이그레이션
- [ ] API 응답 포맷터 검증
- [ ] 쿼리 성능 테스트

### 📋 Phase 2: AI 기능 지원 (1주)

- [ ] ai_analysis 테이블 완전 구현
- [ ] AI 캐싱 시스템 구현
- [ ] 자연어 처리 결과 저장/조회 최적화

### 📋 Phase 3: 고급 기능 및 최적화 (1-2주)

- [ ] 고급 통계 뷰 및 함수
- [ ] 성능 모니터링 시스템
- [ ] 자동 백업 및 정리 시스템

---

## 8. 현재 상황 요약

### ✅ 프론트엔드 데이터 연동 준비 완료

- **Event 인터페이스**: 8개 필드 완전 정의 및 구현
- **사용자 인증**: 카카오 로그인 User 구조 완전 구현
- **AI 분석**: 자연어 처리 결과 구조 완전 구현
- **샘플 데이터**: 8개 완전한 테스트 이벤트

### 🔄 Supabase에서 즉시 구현 필요

1. **Events 테이블**: 프론트엔드 인터페이스 1:1 매핑
2. **User Profiles 테이블**: 카카오 로그인 정보 저장
3. **성능 최적화**: 프론트엔드 쿼리 패턴 기반 인덱스
4. **실시간 동기화**: Supabase Realtime 설정

### 📊 개발 가속화 예상 효과

**Supabase PostgreSQL vs MongoDB:**
- **스키마 설계**: **1-2일 vs 1주** (PostgreSQL 표준 활용)
- **복합 쿼리**: **즉시 vs 2-3일** (SQL 표준 활용)
- **실시간 기능**: **즉시 vs 1-2주** (내장 기능)
- **백업/복구**: **자동 vs 수동 구현** (완전 관리형)

**다음 즉시 행동 계획**: Supabase 프로젝트 생성 후 프론트엔드 Event 인터페이스와 완벽 호환되는 PostgreSQL 스키마 구현을 최우선으로 진행

---

이 문서는 LinQ 데이터베이스의 Supabase PostgreSQL 기반 설계와 현재 프론트엔드 상황을 반영한 구현 가이드라인입니다. 프론트엔드 MVP+가 완성된 상황에서 Supabase를 활용한 신속하고 확장 가능한 데이터베이스 구축을 목표로 합니다.

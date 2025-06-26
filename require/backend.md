# LinQ 백엔드 개발 문서 (2024년 12월 최신 업데이트 - Supabase)

## 1. 프로젝트 개요

**LinQ 백엔드**는 AI 기반의 스마트 일정 관리 서비스의 **Supabase 기반** 서버사이드 컴포넌트입니다.
현재 **계획 단계**에 있으며, 프론트엔드가 **MVP+ 단계 (실제 카카오 로그인 + 자연어 처리 포함)**로 진입함에 따라 백엔드 구현이 최우선 과제로 설정되었습니다.

**현재 상태: 0% (설계 단계)** **우선순위: 최고 (Supabase 기반 급속 개발)**

### 🚨 긴급성 급증

프론트엔드가 **실제 카카오 로그인과 완전한 일정 관리 기능을 갖춘 MVP+ 수준**에 도달함에 따라 백엔드 구현의 긴급성이 급격히 증가했습니다.

**현재 프론트엔드 완성도:**
- ✅ 실제 카카오 OAuth 2.0 로그인 (완전 구현)
- ✅ 자연어 기반 일정 등록 시스템 (완전 구현)
- ✅ 완전한 Event CRUD UI (완전 구현)
- ✅ 실시간 통계 및 상태 관리 (완전 구현)

### 🔄 Supabase 채택 결정

**기존 계획 (MongoDB + Express.js)** 대신 **Supabase**를 채택하여 개발 속도를 3-4배 가속화하고 인프라 관리 부담을 제거하기로 결정했습니다.

---

## 2. 현재 프론트엔드 연동 준비 상황

### 2.1 ✅ 프론트엔드에서 완전 구현된 기능들

#### 실제 동작하는 카카오 로그인 시스템
```typescript
// 프론트엔드에서 구현된 User 인터페이스
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'kakao' | 'google' | 'apple';
}

// 실제 동작하는 카카오 OAuth 2.0 서비스
class KakaoAuthService {
  async login(): Promise<KakaoAuthResult>;
  async logout(): Promise<void>;
  // 완전한 브라우저 세션 관리, 에러 처리 구현
}
```

#### Event 데이터 모델 (완전 구현됨)
```typescript
interface Event {
  id: string; // UUID로 매핑 예정
  title: string; // 일정 제목
  startDate: Date; // 시작 시간
  endDate: Date; // 종료 시간
  isAllDay: boolean; // 종일 여부
  color: string; // 8가지 색상 팔레트
  location?: string; // 장소
  notifications: string[]; // 알림 설정
  category: 'work' | 'health' | 'social' | 'personal';
  isCompleted?: boolean; // 완료 상태
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

#### AI 기반 자연어 처리 (완전 구현됨)
```typescript
// NaturalLanguageEventDrawer - 870+ 라인의 완전한 구현
interface NaturalLanguageEvent {
  originalText: string; // "내일 오후 2시에 회의"
  parsed: {
    title: string;
    startDate: Date;
    endDate: Date;
    category: string;
    confidence: number; // AI 신뢰도
  };
  suggestions: string[]; // 스마트 제안
}
```

### 2.2 🔄 프론트엔드에서 기대하는 API 구조

```typescript
// src/services/api.service.ts (React Query와 함께 구현 예정)
class SupabaseAPIService {
  // 인증 API (카카오 로그인 연동)
  async loginWithKakao(kakaoToken: string): Promise<AuthResult>;
  async logout(): Promise<void>;
  async refreshToken(): Promise<string>;
  async getProfile(): Promise<User>;

  // 일정 관리 API (완전한 CRUD)
  async getEvents(dateRange: DateRange): Promise<Event[]>;
  async createEvent(event: Partial<Event>): Promise<Event>;
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  async deleteEvent(id: string): Promise<void>;

  // AI 기능 API (자연어 처리)
  async parseNaturalLanguage(input: string): Promise<NaturalLanguageEvent>;
  async analyzePriority(event: Partial<Event>): Promise<PriorityAnalysis>;
  async getAISuggestions(): Promise<AISuggestion[]>;
}
```

### 2.3 🔄 프론트엔드에서 설치된 백엔드 연동 라이브러리

- **React Query 5.80.7**: 서버 상태 관리 (설치 완료, 구현 대기)
- **Zustand 5.0.5**: 글로벌 상태 관리 (설치 완료, 일부 구현)
- **AsyncStorage**: 토큰 및 사용자 정보 영구 저장 (완전 구현됨)

---

## 3. Supabase 기반 아키텍처

### 3.1 핵심 기술 스택

#### Supabase 플랫폼
- **PostgreSQL**: 메인 데이터베이스 (완전 관리형)
- **Supabase Auth**: 소셜 로그인 및 JWT 관리
- **Supabase Realtime**: 실시간 데이터 동기화
- **Supabase Edge Functions**: 서버리스 API (Deno)
- **Supabase Storage**: 파일 저장소

#### AI 및 외부 서비스
- **Solar Pro API**: 한국어 자연어 처리
- **카카오 API**: 소셜 로그인 연동

#### 프론트엔드 연동
- **@supabase/supabase-js**: React Native SDK
- **React Query**: 서버 상태 관리 (이미 설치됨)

### 3.2 프로젝트 구조

```
linq-backend/
├── supabase/
│   ├── functions/             # Edge Functions
│   │   ├── auth/
│   │   │   ├── kakao-login.ts      # 카카오 로그인 통합
│   │   │   └── refresh-token.ts    # 토큰 갱신
│   │   ├── events/
│   │   │   ├── get-events.ts       # 이벤트 조회
│   │   │   ├── create-event.ts     # 이벤트 생성
│   │   │   ├── update-event.ts     # 이벤트 수정
│   │   │   └── delete-event.ts     # 이벤트 삭제
│   │   └── ai/
│   │       ├── parse-nlp.ts        # 자연어 파싱
│   │       ├── analyze-priority.ts # 우선순위 분석
│   │       └── get-suggestions.ts  # AI 제안
│   ├── migrations/           # DB 스키마 마이그레이션
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_events.sql
│   │   └── 003_create_ai_analysis.sql
│   └── seed.sql             # 초기 데이터
└── types/
    ├── database.types.ts    # Supabase 자동 생성 타입
    └── api.types.ts        # API 타입 정의
```

---

## 4. Supabase 데이터베이스 스키마

### 4.1 User Profiles (Supabase Auth 확장)

```sql
-- 사용자 프로필 (auth.users 확장)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('kakao', 'google', 'apple')),

  -- 프론트엔드 테마 시스템과 호환
  preferences JSONB DEFAULT '{
    "theme": "system",
    "notifications": true,
    "aiSuggestions": true,
    "defaultCategory": "work"
  }'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.user_profiles
  USING (auth.uid() = id);
```

### 4.2 Events (프론트엔드 완벽 호환)

```sql
-- 이벤트 테이블 (프론트엔드 Event 인터페이스와 1:1 매핑)
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 프론트엔드 필드와 완전 일치
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  color TEXT NOT NULL CHECK (color IN (
    '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'
  )),
  location TEXT,
  notifications TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('work', 'health', 'social', 'personal')),
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성능 최적화 인덱스
CREATE INDEX idx_events_user_date ON public.events(user_id, start_date);
CREATE INDEX idx_events_user_category ON public.events(user_id, category);

-- RLS 정책
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON public.events
  USING (auth.uid() = user_id);
```

### 4.3 AI Analysis

```sql
-- AI 분석 결과 저장
CREATE TABLE public.ai_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('parsing', 'priority', 'suggestion')),

  input_text TEXT NOT NULL,
  input_hash TEXT NOT NULL, -- 중복 방지
  output JSONB NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  model TEXT NOT NULL DEFAULT 'solar-pro',
  processing_time INTEGER, -- ms

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캐싱을 위한 인덱스
CREATE INDEX idx_ai_analysis_hash ON public.ai_analysis(input_hash, type);

-- RLS 정책
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own analysis" ON public.ai_analysis
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. Edge Functions 구현

### 5.1 카카오 로그인 통합

```typescript
// supabase/functions/auth/kakao-login.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface KakaoLoginRequest {
  accessToken: string;
  deviceInfo: {
    platform: 'ios' | 'android';
    deviceId: string;
    appVersion: string;
  };
}

serve(async (req) => {
  try {
    const { accessToken, deviceInfo }: KakaoLoginRequest = await req.json()

    // 카카오 사용자 정보 조회
    const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!kakaoResponse.ok) {
      throw new Error('Invalid Kakao token')
    }

    const kakaoUser = await kakaoResponse.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Supabase 사용자 생성/로그인
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: kakaoUser.kakao_account.email,
      user_metadata: {
        name: kakaoUser.properties.nickname,
        avatar_url: kakaoUser.properties.profile_image,
        provider: 'kakao',
        kakao_id: kakaoUser.id.toString(),
      },
      email_confirm: true,
    })

    if (error && !error.message.includes('already registered')) {
      throw error
    }

    // 프로필 정보 업데이트
    await supabase.from('user_profiles').upsert({
      id: authData.user?.id,
      name: kakaoUser.properties.nickname,
      avatar_url: kakaoUser.properties.profile_image,
      provider: 'kakao',
    })

    // JWT 토큰 생성
    const { data: tokenData } = await supabase.auth.admin.generateAccessToken(
      authData.user!.id
    )

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: {
          id: authData.user!.id,
          name: kakaoUser.properties.nickname,
          email: kakaoUser.kakao_account.email,
          avatar: kakaoUser.properties.profile_image,
          provider: 'kakao',
        },
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### 5.2 자연어 일정 파싱

```typescript
// supabase/functions/ai/parse-nlp.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface ParseRequest {
  input: string;
  context?: {
    currentDate: string;
    userPreferences: any;
  };
}

serve(async (req) => {
  try {
    const { input, context }: ParseRequest = await req.json()

    // Solar Pro API 호출
    const solarResponse = await fetch('https://api.upstage.ai/v1/solar/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SOLAR_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'solar-1-mini-chat',
        messages: [
          {
            role: 'system',
            content: `한국어 자연어를 일정 정보로 파싱하는 AI입니다.

입력 예시: "내일 오후 2시에 회의", "다음 주 화요일 점심약속"

다음 JSON 형식으로만 응답하세요:
{
  "title": "일정 제목",
  "startDate": "YYYY-MM-DDTHH:mm:ssZ",
  "endDate": "YYYY-MM-DDTHH:mm:ssZ",
  "category": "work|health|social|personal",
  "isAllDay": boolean,
  "confidence": 0.0~1.0
}`
          },
          {
            role: 'user',
            content: `파싱할 텍스트: "${input}"\n현재 시간: ${context?.currentDate || new Date().toISOString()}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    })

    const solarResult = await solarResponse.json()
    const parsedContent = JSON.parse(solarResult.choices[0].message.content)

    // AI 분석 결과 저장
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const inputHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(input.toLowerCase().trim())
    )

    await supabase.from('ai_analysis').insert({
      user_id: req.headers.get('user-id'),
      type: 'parsing',
      input_text: input,
      input_hash: Array.from(new Uint8Array(inputHash)).map(b => b.toString(16).padStart(2, '0')).join(''),
      output: parsedContent,
      confidence: parsedContent.confidence,
      model: 'solar-1-mini-chat',
    })

    return new Response(JSON.stringify({
      success: true,
      data: {
        originalText: input,
        parsed: parsedContent,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### 5.3 이벤트 관리 API

```typescript
// supabase/functions/events/get-events.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const category = url.searchParams.get('category')
    const completed = url.searchParams.get('completed')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    )

    let query = supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })

    // 프론트엔드 필터링 지원
    if (startDate && endDate) {
      query = query.gte('start_date', startDate).lte('start_date', endDate)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (completed !== null) {
      query = query.eq('is_completed', completed === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    // 프론트엔드 Event 인터페이스로 변환
    const events = data.map(event => ({
      id: event.id,
      title: event.title,
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      isAllDay: event.is_all_day,
      color: event.color,
      location: event.location,
      notifications: event.notifications,
      category: event.category,
      isCompleted: event.is_completed,
      priority: event.priority,
    }))

    return new Response(JSON.stringify({
      success: true,
      data: { events, total: events.length },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

---

## 6. 프론트엔드 연동

### 6.1 Supabase 클라이언트 설정

```typescript
// 프론트엔드에 추가할 파일
// src/services/supabase.service.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// 기존 카카오 로그인과 Supabase 통합
export class SupabaseAuthService {
  async loginWithKakao(kakaoToken: string): Promise<AuthResult> {
    const { data, error } = await supabase.functions.invoke('auth/kakao-login', {
      body: {
        accessToken: kakaoToken,
        deviceInfo: {
          platform: Platform.OS,
          deviceId: await getUniqueId(),
          appVersion: Constants.expoConfig?.version,
        },
      },
    })

    if (error) throw error

    // Supabase 세션 설정
    await supabase.auth.setSession({
      access_token: data.data.accessToken,
      refresh_token: data.data.refreshToken,
    })

    return data
  }
}
```

---

## 7. 개발 우선순위 로드맵

### 📋 Phase 1: Supabase 기본 설정 (1주) - **최우선**

#### Day 1-2: 프로젝트 초기화
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 구현 (프론트엔드 호환)
- [ ] RLS 정책 설정
- [ ] 환경 변수 설정

#### Day 3-5: 카카오 로그인 통합
- [ ] 카카오 로그인 Edge Function 구현
- [ ] 프론트엔드 Supabase 클라이언트 설정
- [ ] 인증 플로우 테스트

#### Day 6-7: 기본 CRUD API
- [ ] Events CRUD Edge Functions
- [ ] 프론트엔드 API 연동
- [ ] 실시간 데이터 동기화

### 📋 Phase 2: AI 기능 구현 (1-2주)

- [ ] Solar Pro API 통합
- [ ] 자연어 파싱 Edge Function
- [ ] AI 캐싱 시스템
- [ ] 프론트엔드 AI 기능 연동

### 📋 Phase 3: 고급 기능 (1-2주)

- [ ] 실시간 알림 시스템
- [ ] 성능 최적화
- [ ] 에러 핸들링 강화
- [ ] 테스트 및 배포

---

## 8. 현재 상황 요약

### ✅ 프론트엔드 완성 사항 (Supabase 연동 대기)

- **실제 카카오 로그인**: OAuth 2.0 완전 구현 (286라인)
- **완전한 Event 관리**: CRUD, 필터링, 상태 관리 (2100+ 라인)
- **자연어 일정 등록**: AI 파싱 UI 완전 구현 (870+ 라인)
- **실시간 통계**: 완료율, 상태 업데이트
- **테마 시스템**: 다크/라이트 모드 완전 지원

### 🔄 Supabase에서 즉시 구현 필요

1. **User Profiles 테이블**: 카카오 로그인 정보 저장
2. **Events 테이블**: 프론트엔드 인터페이스 완벽 호환
3. **카카오 로그인 Edge Function**: 기존 플로우와 통합
4. **AI 파싱 Edge Function**: Solar Pro API 연동

### 📊 개발 가속화 예상

**Supabase 채택 효과:**
- 개발 기간: **6-8주 → 3-4주** (50% 단축)
- 인프라 관리: **복잡 → 제로** (완전 관리형)
- 실시간 기능: **2주 구현 → 즉시** (내장 기능)
- 확장성: **수동 → 자동** (자동 스케일링)

**다음 즉시 행동 계획**: Supabase 프로젝트 생성 후 프론트엔드 Event 인터페이스와 완벽 호환되는 스키마 구현을 최우선으로 진행

---

이 문서는 LinQ 백엔드의 Supabase 기반 설계와 현재 프론트엔드 상황(카카오 로그인, 자연어 처리)을 반영한 개발 가이드라인입니다. 프론트엔드 MVP+가 완성된 상황에서 Supabase를 활용한 신속한 백엔드 구축을 목표로 합니다.

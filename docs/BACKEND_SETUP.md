# LinQ 백엔드 설정 가이드

이 문서는 LinQ 프로젝트의 Supabase 백엔드 설정 및 개발 가이드입니다.

## 📋 목차

- [개요](#개요)
- [사전 요구사항](#사전-요구사항)
- [환경 설정](#환경-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [Edge Functions 배포](#edge-functions-배포)
- [API 사용법](#api-사용법)
- [개발 가이드](#개발-가이드)
- [트러블슈팅](#트러블슈팅)

## 🎯 개요

LinQ 백엔드는 다음 기술 스택으로 구성됩니다:

- **데이터베이스**: Supabase PostgreSQL
- **인증**: Supabase Auth + 카카오 로그인
- **API**: Supabase Edge Functions (Deno)
- **AI**: Solar Pro API (Upstage AI)
- **실시간**: Supabase Realtime

### 아키텍처 구조

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │───▶│ Supabase Client │───▶│ Edge Functions  │
│    Frontend     │    │    Library      │    │   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   PostgreSQL    │◀────────────┘
                       │   Database      │
                       └─────────────────┘
```

## 🔧 사전 요구사항

### 필수 설치 항목
- [Deno](https://deno.land/) v1.30+
- [Supabase CLI](https://supabase.com/docs/guides/cli) v1.50+
- [Node.js](https://nodejs.org/) v18+ (프론트엔드 개발용)

### 계정 준비
- [Supabase](https://supabase.com) 계정
- [카카오 개발자](https://developers.kakao.com) 계정
- [Upstage AI](https://developers.upstage.ai) 계정 (Solar Pro API)

## ⚙️ 환경 설정

### 1. 환경 변수 설정

```bash
# env.example을 .env로 복사
cp env.example .env

# 실제 값으로 수정
vim .env
```

### 2. Supabase 프로젝트 생성

```bash
# Supabase CLI 설치 확인
supabase --version

# 프로젝트 초기화
supabase init

# 로컬 개발 환경 시작
supabase start

# 원격 프로젝트 연결
supabase link --project-ref noajbbdvjcsmiwcmmsza
```

### 3. 카카오 로그인 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com) 접속
2. 애플리케이션 생성 및 설정:
   ```
   - 플랫폼 추가: Web, Android, iOS
   - Redirect URI: https://noajbbdvjcsmiwcmmsza.supabase.co/auth/v1/callback
   - 카카오 로그인 활성화
   ```
3. API 키 복사 후 `.env` 파일에 추가

### 4. Solar Pro API 설정

1. [Upstage AI 콘솔](https://developers.upstage.ai) 접속
2. API 키 발급
3. `.env` 파일에 `SOLAR_API_KEY` 추가

## 🗄️ 데이터베이스 설정

### 1. 마이그레이션 실행

```bash
# 데이터베이스 마이그레이션 적용
supabase db push

# 마이그레이션 상태 확인
supabase migration list
```

### 2. 초기 데이터 설정

```bash
# 샘플 데이터 삽입 (선택사항)
supabase db reset --with-seed
```

### 3. RLS (Row Level Security) 정책 확인

```sql
-- user_profiles 테이블 정책
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('user_profiles', 'events', 'ai_analysis');
```

## 🚀 Edge Functions 배포

### 1. 로컬 테스트

```bash
# Edge Functions 시작 (로컬)
supabase functions serve --env-file .env

# 특정 함수만 실행
supabase functions serve auth/kakao-login --env-file .env
```

### 2. 함수별 테스트

```bash
# 카카오 로그인 테스트
curl -X POST \
  http://localhost:54321/functions/v1/auth/kakao-login \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "test_token"}'

# 자연어 파싱 테스트
curl -X POST \
  http://localhost:54321/functions/v1/ai/parse-nlp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"input": "내일 오후 3시에 회의"}'
```

### 3. 프로덕션 배포

```bash
# 모든 함수 배포
supabase functions deploy

# 특정 함수만 배포
supabase functions deploy auth/kakao-login

# 환경 변수 설정
supabase secrets set SOLAR_API_KEY=your_actual_key
supabase secrets set KAKAO_REST_API_KEY=your_actual_key
```

## 📚 API 사용법

### 인증 API

```typescript
// 카카오 로그인
const authResult = await auth.kakaoLogin(accessToken);

// 현재 사용자 정보
const user = await auth.getCurrentUser();

// 로그아웃
await auth.logout();
```

### 이벤트 API

```typescript
// 이벤트 목록 조회
const events = await events.getEvents({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  category: 'work',
  includeStats: true
});

// 이벤트 생성
const newEvent = await events.createEvent({
  title: '팀 회의',
  start_date: '2024-01-15T14:00:00+09:00',
  end_date: '2024-01-15T15:00:00+09:00',
  category: 'work'
});

// 이벤트 수정
const updatedEvent = await events.updateEvent(eventId, {
  title: '수정된 제목'
});
```

### AI API

```typescript
// 자연어 파싱
const parsed = await ai.parseNLP('내일 오후 3시에 치과 예약');

// AI 추천
const recommendations = await ai.getRecommendations({
  title: '운동',
  category: 'health'
});
```

## 🛠️ 개발 가이드

### 새로운 Edge Function 추가

1. **함수 디렉토리 생성**
   ```bash
   mkdir -p supabase/functions/새기능/새함수명
   ```

2. **index.ts 파일 생성**
   ```typescript
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   import { createResponse, handleCors } from '../../_shared/utils.ts';

   serve(async (req: Request) => {
     // CORS 처리
     const corsResponse = handleCors(req);
     if (corsResponse) return corsResponse;

     // 로직 구현
     return createResponse({ message: 'Hello World' });
   });
   ```

3. **타입 정의 추가**
   ```typescript
   // _shared/types.ts에 추가
   export interface NewFunctionRequest {
     // 요청 타입 정의
   }
   ```

4. **클라이언트 라이브러리 업데이트**
   ```typescript
   // src/lib/supabase.ts에 추가
   export const newFeature = {
     newFunction: async (data: NewFunctionRequest) => {
       return callEdgeFunction('새기능/새함수명', 'POST', data);
     }
   };
   ```

### 데이터베이스 스키마 변경

1. **마이그레이션 생성**
   ```bash
   supabase migration new 변경사항_설명
   ```

2. **SQL 작성**
   ```sql
   -- supabase/migrations/새파일.sql
   ALTER TABLE events ADD COLUMN new_field TEXT;
   ```

3. **마이그레이션 적용**
   ```bash
   supabase db push
   ```

### 코드 품질 관리

```bash
# TypeScript 타입 검사
deno check supabase/functions/**/*.ts

# 코드 포맷팅
deno fmt supabase/functions/

# 린팅
deno lint supabase/functions/
```

## 🔍 모니터링 및 로깅

### 로그 확인

```bash
# Edge Functions 로그
supabase functions logs auth/kakao-login

# 데이터베이스 로그
supabase logs db

# 실시간 로그 스트리밍
supabase functions logs --follow
```

### 성능 모니터링

```sql
-- 느린 쿼리 확인
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 연결 상태 확인
SELECT count(*) as active_connections
FROM pg_stat_activity;
```

## 🚨 트러블슈팅

### 일반적인 문제들

#### 1. Edge Function 배포 실패

```bash
# 원인: 환경 변수 누락
# 해결: 환경 변수 확인 및 설정
supabase secrets list
supabase secrets set KEY=VALUE
```

#### 2. 카카오 로그인 오류

```
에러: "Invalid redirect URI"
해결: 카카오 개발자 콘솔에서 Redirect URI 확인
- 개발: http://localhost:54321/auth/v1/callback
- 운영: https://your-project.supabase.co/auth/v1/callback
```

#### 3. AI API 호출 실패

```
에러: "Solar Pro API error: 401"
해결: API 키 확인 및 재발급
- SOLAR_API_KEY 환경 변수 확인
- Upstage AI 콘솔에서 키 상태 확인
```

#### 4. 데이터베이스 연결 오류

```bash
# RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'events';

# 권한 확인
\dp events
```

#### 5. 실시간 기능 문제

```typescript
// 구독 상태 확인
const subscription = supabase
  .channel('test')
  .on('broadcast', { event: 'test' }, (payload) => {
    console.log(payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

### 로그 분석

```bash
# 에러 로그 필터링
supabase functions logs | grep ERROR

# 특정 시간대 로그
supabase functions logs --since="2024-01-01T00:00:00Z"
```

### 성능 최적화

```sql
-- 인덱스 사용률 확인
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 테이블 크기 확인
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public';
```

## 📞 지원 및 문의

- **Supabase 문서**: https://supabase.com/docs
- **Deno 문서**: https://deno.land/manual
- **카카오 개발자**: https://developers.kakao.com/docs
- **Solar Pro API**: https://developers.upstage.ai/docs

---

## 🔄 업데이트 내역

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2024-01-01 | 초기 백엔드 구축 완료 |
| 1.1.0 | 2024-01-15 | AI 기능 추가 |
| 1.2.0 | 2024-02-01 | 실시간 기능 강화 |

이 가이드를 통해 LinQ 백엔드를 성공적으로 설정하고 개발할 수 있습니다. 추가 질문이나 문제가 있으면 팀에 문의해 주세요.

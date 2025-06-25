# LinQ 백엔드 개발 문서 (2024년 12월 업데이트)

## 1. 프로젝트 개요

**LinQ 백엔드**는 AI 기반의 스마트 일정 관리 서비스의 서버사이드 컴포넌트입니다.
현재 **계획 단계**에 있으며, 프론트엔드가 MVP 단계로 진입함에 따라 백엔드 구현이
다음 우선순위로 설정되었습니다.

**현재 상태: 0% (설계 단계)** **우선순위: 최고 (프론트엔드 연동 대기 중)**

### 🚨 긴급성 증가

프론트엔드가 **실제 사용 가능한 MVP 수준**에 도달함에 따라 백엔드 구현의
긴급성이 크게 증가했습니다. 현재 8개 샘플 이벤트로만 작동하는 상태에서 실제
데이터 지속성과 사용자 관리가 필요한 시점입니다.

---

## 2. 현재 프론트엔드 연동 준비 상황

### 2.1 ✅ 프론트엔드에서 준비된 인터페이스

#### Event 데이터 모델 (이미 구현됨)

```typescript
interface Event {
  id: string; // 고유 식별자
  title: string; // 일정 제목
  startDate: Date; // 시작 시간
  endDate: Date; // 종료 시간
  isAllDay: boolean; // 종일 여부
  color: string; // 색상 (8가지 팔레트)
  location?: string; // 장소 (선택적)
  notifications: string[]; // 알림 설정 배열
  category: 'work' | 'health' | 'social' | 'personal';
  isCompleted?: boolean; // 완료 상태
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

#### 프론트엔드에서 기대하는 API 구조

```typescript
// src/services/api.service.ts (프론트엔드에서 구현 예정)
class APIService {
  async getEvents(dateRange: DateRange): Promise<Event[]>;
  async createEvent(event: Partial<Event>): Promise<Event>;
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
  async deleteEvent(id: string): Promise<void>;

  // AI 기능 (중기 계획)
  async parseNaturalLanguage(input: string): Promise<ParsedEvent>;
  async analyzePriority(event: Partial<Event>): Promise<PriorityAnalysis>;
  async getAISuggestions(): Promise<AISuggestion[]>;
}
```

### 2.2 🔄 프론트엔드에서 설치된 백엔드 연동 라이브러리

- **React Query 5.80.7**: 서버 상태 관리 (설치 완료, 구현 대기)
- **Zustand 5.0.5**: 글로벌 상태 관리 (설치 완료, 일부 구현)

---

## 3. 백엔드 아키텍처 설계

### 3.1 기술 스택 (권장)

#### Core Framework

- **Node.js 20.x LTS**: 런타임 환경
- **Express.js 4.18+**: 웹 프레임워크
- **TypeScript 5.3+**: 타입 안전성 (프론트엔드와 일치)

#### 데이터베이스

- **MongoDB 7.0+**: 주 데이터베이스 (스키마 유연성)
- **Redis 7.2+**: 캐싱 및 세션 관리
- **Mongoose 7.6+**: MongoDB ODM

#### AI 및 자연어 처리

- **Solar Pro API**: 한국어 특화 LLM
- **LangChain**: AI 워크플로우 관리
- **OpenAI Whisper**: 음성 인식 (향후)

#### 보안 및 인증

- **JWT**: 토큰 기반 인증
- **bcrypt**: 패스워드 해싱
- **helmet**: 보안 헤더
- **cors**: CORS 정책 관리

#### 개발 및 배포

- **Docker**: 컨테이너화
- **PM2**: 프로세스 관리
- **Winston**: 로깅
- **Jest**: 테스트 프레임워크

### 3.2 서버 구조

```
backend/
├── src/
│   ├── controllers/           # API 컨트롤러
│   │   ├── auth.controller.ts
│   │   ├── events.controller.ts
│   │   └── ai.controller.ts
│   ├── services/              # 비즈니스 로직
│   │   ├── auth.service.ts
│   │   ├── events.service.ts
│   │   ├── ai.service.ts
│   │   └── notification.service.ts
│   ├── models/                # 데이터베이스 모델
│   │   ├── User.model.ts
│   │   ├── Event.model.ts
│   │   └── AIAnalysis.model.ts
│   ├── middleware/            # 미들웨어
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/                # API 라우트
│   │   ├── auth.routes.ts
│   │   ├── events.routes.ts
│   │   └── ai.routes.ts
│   ├── utils/                 # 유틸리티
│   │   ├── jwt.util.ts
│   │   ├── validation.util.ts
│   │   └── date.util.ts
│   ├── config/                # 설정 파일
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── ai.config.ts
│   └── types/                 # TypeScript 타입
│       ├── api.types.ts
│       ├── event.types.ts
│       └── ai.types.ts
├── tests/                     # 테스트 파일
├── docs/                      # API 문서
├── docker/                    # Docker 설정
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 4. 데이터베이스 스키마 설계

### 4.1 User Collection

```typescript
interface User {
  _id: ObjectId;
  email: string; // 이메일 (고유)
  password: string; // 해시된 패스워드
  name: string; // 사용자 이름
  timezone: string; // 시간대
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    aiSuggestions: boolean;
    workingHours: {
      start: string; // "09:00"
      end: string; // "18:00"
    };
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

### 4.2 Event Collection

```typescript
interface Event {
  _id: ObjectId;
  userId: ObjectId; // 사용자 참조
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: string; // 프론트엔드 8색 팔레트
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  category: 'work' | 'health' | 'social' | 'personal';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isCompleted: boolean;
  notifications: string[]; // 알림 설정 배열

  // AI 관련 필드
  aiAnalysis?: {
    suggestedPriority: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number; // 0-1
    reasoning: string;
    keywords: string[];
  };

  // 반복 일정 (향후)
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 AIAnalysis Collection

```typescript
interface AIAnalysis {
  _id: ObjectId;
  userId: ObjectId;
  type: 'priority' | 'suggestion' | 'conflict' | 'optimization';
  input: string; // 원본 입력
  output: any; // AI 분석 결과
  confidence: number;
  model: string; // 사용된 AI 모델
  processingTime: number; // 처리 시간 (ms)
  createdAt: Date;
}
```

### 4.4 UserSession Collection (Redis)

```typescript
interface UserSession {
  sessionId: string;
  userId: string;
  deviceInfo: {
    platform: 'ios' | 'android';
    deviceId: string;
    appVersion: string;
  };
  expiresAt: Date;
  createdAt: Date;
}
```

---

## 5. API 엔드포인트 설계

### 5.1 인증 API (`/api/auth`)

#### POST `/api/auth/register`

```typescript
// Request
{
  email: string;
  password: string;
  name: string;
  timezone: string;
}

// Response
{
  success: boolean;
  message: string;
  data: {
    user: User;
  accessToken: string;
  refreshToken: string;
  }
}
```

#### POST `/api/auth/login`

```typescript
// Request
{
  email: string;
  password: string;
  deviceInfo: DeviceInfo;
}

// Response
{
  success: boolean;
  data: {
  user: User;
  accessToken: string;
  refreshToken: string;
  }
}
```

#### POST `/api/auth/refresh`

```typescript
// Request (Header)
Authorization: Bearer<refreshToken>;

// Response
{
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  }
}
```

### 5.2 일정 관리 API (`/api/events`)

#### GET `/api/events`

```typescript
// Query Parameters
{
  startDate: string;             // ISO 8601
  endDate: string;               // ISO 8601
  category?: string;
  completed?: boolean;
  limit?: number;
  offset?: number;
}

// Response
{
  success: boolean;
  data: {
  events: Event[];
    total: number;
    hasMore: boolean;
  };
}
```

#### POST `/api/events`

```typescript
// Request (프론트엔드 Event 인터페이스와 일치)
{
  title: string;
  startDate: string;             // ISO 8601
  endDate: string;
  isAllDay: boolean;
  color: string;
  location?: string;
  category: string;
  notifications: string[];
}

// Response
{
  success: boolean;
  message: string;
  data: {
  event: Event;
  };
}
```

#### PUT `/api/events/:id`

```typescript
// Request
{
  title?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
  // ... 기타 업데이트 필드
}

// Response
{
  success: boolean;
  data: {
  event: Event;
  };
}
```

#### DELETE `/api/events/:id`

```typescript
// Response
{
  success: boolean;
  message: string;
}
```

### 5.3 AI 기능 API (`/api/ai`)

#### POST `/api/ai/parse-natural-language`

```typescript
// Request
{
  input: string;                 // "내일 오후 3시에 회의"
  context?: {
    currentDate: string;
    userPreferences: object;
  };
}

// Response
{
  success: boolean;
  data: {
    parsed: {
      title: string;
      startDate: string;
      endDate: string;
      category: string;
      confidence: number;
    };
    alternatives?: Array<ParsedEvent>;
  };
}
```

#### POST `/api/ai/analyze-priority`

```typescript
// Request
{
  title: string;
  description?: string;
  category: string;
  startDate: string;
}

// Response
{
  success: boolean;
  data: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
    reasoning: string;
    keywords: string[];
  };
}
```

#### GET `/api/ai/suggestions`

```typescript
// Response
{
  success: boolean;
  data: {
    suggestions: Array<{
      type: 'optimization' | 'conflict' | 'reminder';
      title: string;
      description: string;
      action: object;
      priority: number;
    }>;
  }
}
```

---

## 6. AI 서비스 통합 계획

### 6.1 Solar Pro API 연동

#### 자연어 일정 파싱

```typescript
class NaturalLanguageService {
  async parseScheduleInput(
    input: string,
    context: ParseContext
  ): Promise<ParsedEvent> {
    const prompt = this.buildPrompt(input, context);

    const response = await solarProAPI.complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    return this.extractStructuredData(response.content);
  }

  private buildPrompt(input: string, context: ParseContext): string {
    return `
다음 자연어 입력을 일정 정보로 파싱해주세요:
입력: "${input}"
현재 시간: ${context.currentDate}

다음 JSON 형식으로 응답해주세요:
{
  "title": "일정 제목",
  "startDate": "ISO 8601 형식",
  "endDate": "ISO 8601 형식",
  "category": "work|health|social|personal",
  "isAllDay": boolean,
  "confidence": number
}
    `;
  }
}
```

#### AI 중요도 분석

```typescript
class PriorityAnalysisService {
  async analyzePriority(eventData: Partial<Event>): Promise<PriorityAnalysis> {
    const features = this.extractFeatures(eventData);

    const prompt = `
다음 일정의 중요도를 분석해주세요:
제목: ${eventData.title}
카테고리: ${eventData.category}
시간: ${eventData.startDate}

분석 기준:
- 업무 중요도
- 시간 민감성
- 개인적 영향도
- 연기 가능성

JSON 응답:
{
  "priority": "HIGH|MEDIUM|LOW",
  "confidence": number,
  "reasoning": "분석 근거",
  "keywords": ["키워드1", "키워드2"]
}
    `;

    const response = await solarProAPI.complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    return JSON.parse(response.content);
  }
}
```

### 6.2 AI 성능 최적화

#### 캐싱 전략

```typescript
class AICache {
  private redis: Redis;

  async getCachedAnalysis(input: string): Promise<any | null> {
    const key = `ai:analysis:${this.hashInput(input)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedAnalysis(
    input: string,
    result: any,
    ttl: number = 3600
  ): Promise<void> {
    const key = `ai:analysis:${this.hashInput(input)}`;
    await this.redis.setex(key, ttl, JSON.stringify(result));
  }
}
```

---

## 7. 보안 및 인증 시스템

### 7.1 JWT 토큰 관리

```typescript
class AuthService {
  generateTokens(user: User): TokenPair {
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid access token');
    }
  }
}
```

### 7.2 API 레이트 리미팅

```typescript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 요청 수 제한
  message: {
    error: 'Too many requests',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI API는 더 엄격한 제한
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 10회 제한
  keyGenerator: req => req.user.id,
});
```

---

## 8. 실시간 기능 (WebSocket)

### 8.1 실시간 알림 시스템

```typescript
class NotificationService {
  private io: Server;

  async sendNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    // 실시간 알림 전송
    this.io.to(`user:${userId}`).emit('notification', notification);

    // 푸시 알림 (오프라인 사용자용)
    if (!this.isUserOnline(userId)) {
      await this.sendPushNotification(userId, notification);
    }
  }

  async scheduleEventReminder(event: Event): Promise<void> {
    for (const notificationTime of event.notifications) {
      const scheduleTime = this.calculateNotificationTime(
        event,
        notificationTime
      );

      await this.scheduleJob(scheduleTime, async () => {
        await this.sendNotification(event.userId, {
          type: 'reminder',
          title: `${event.title} 알림`,
          message: this.generateReminderMessage(event, notificationTime),
          data: { eventId: event._id },
        });
      });
    }
  }
}
```

---

## 9. 성능 최적화 전략

### 9.1 데이터베이스 인덱싱

```typescript
// MongoDB 인덱스 설정
db.events.createIndex({ userId: 1, startDate: 1 });
db.events.createIndex({ userId: 1, category: 1 });
db.events.createIndex({ userId: 1, isCompleted: 1 });
db.events.createIndex(
  {
    userId: 1,
    startDate: 1,
    endDate: 1,
  },
  { name: 'user_date_range' }
);

// 텍스트 검색 인덱스
db.events.createIndex(
  {
    title: 'text',
    description: 'text',
  },
  { name: 'text_search' }
);
```

### 9.2 캐싱 전략

```typescript
class CacheService {
  // 사용자 일정 캐싱 (5분)
  async getUserEvents(userId: string, dateRange: DateRange): Promise<Event[]> {
    const cacheKey = `events:${userId}:${dateRange.start}:${dateRange.end}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const events = await this.eventService.getEvents(userId, dateRange);
    await this.redis.setex(cacheKey, 300, JSON.stringify(events));

    return events;
  }

  // AI 분석 결과 캐싱 (1시간)
  async getAIAnalysis(input: string): Promise<any> {
    const cacheKey = `ai:${this.hashInput(input)}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.aiService.analyze(input);
    await this.redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }
}
```

---

## 10. 배포 및 DevOps

### 10.1 Docker 설정

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### 10.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/linq
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7.0
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7.2-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

---

## 11. 개발 우선순위 로드맵

### 📋 Phase 1: 핵심 백엔드 구축 (2-3주) - **최우선**

#### Week 1: 기본 인프라 구축

- [ ] 프로젝트 초기 설정 (Node.js + TypeScript + Express)
- [ ] MongoDB + Mongoose 설정
- [ ] Redis 설정
- [ ] 기본 폴더 구조 생성
- [ ] Docker 개발 환경 구성

#### Week 2-3: 핵심 API 구현

- [ ] 사용자 인증 API (회원가입, 로그인, JWT)
- [ ] 일정 CRUD API (프론트엔드 Event 인터페이스와 완전 호환)
- [ ] 기본 미들웨어 (인증, 에러 핸들링, 유효성 검사)
- [ ] API 문서화 (Swagger)

### 📋 Phase 2: 프론트엔드 연동 (1주)

- [ ] 프론트엔드 API 서비스 연동 테스트
- [ ] CORS 설정
- [ ] 데이터 동기화 확인
- [ ] 에러 핸들링 통합

### 📋 Phase 3: AI 기능 기초 구현 (2-3주)

- [ ] Solar Pro API 연동
- [ ] 자연어 일정 파싱 기능
- [ ] AI 중요도 분석 기능
- [ ] 캐싱 시스템 구축

### 📋 Phase 4: 고급 기능 및 최적화 (3-4주)

- [ ] 실시간 알림 시스템 (WebSocket)
- [ ] 푸시 알림 서비스
- [ ] 성능 최적화 (인덱싱, 캐싱)
- [ ] 모니터링 및 로깅 시스템

---

## 12. 프론트엔드와의 연동 계획

### 12.1 즉시 필요한 API (프론트엔드 대기 중)

#### 일정 관리 API

프론트엔드의 현재 Event 인터페이스와 100% 호환되는 API 구현 필요:

```typescript
// 백엔드에서 구현해야 할 API
GET    /api/events?startDate={date}&endDate={date}
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
PATCH  /api/events/:id/complete    // 완료 상태 토글
```

#### 인증 API

프론트엔드의 AsyncStorage 토큰 관리와 호환:

```typescript
POST / api / auth / register;
POST / api / auth / login;
POST / api / auth / refresh;
POST / api / auth / logout;
GET / api / auth / profile;
```

### 12.2 중기 연동 계획

#### AI 기능 API

프론트엔드 AI 채팅 화면을 위한 API:

```typescript
POST / api / ai / parse - natural - language;
POST / api / ai / analyze - priority;
GET / api / ai / suggestions;
POST / api / ai / chat;
```

---

## 13. 모니터링 및 로깅

### 13.1 로깅 시스템

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console(),
  ],
});

// AI API 호출 로깅
logger.info('AI API Request', {
  userId,
  input: sanitizedInput,
  model: 'solar-pro',
  requestId: generateRequestId(),
});
```

### 13.2 성능 모니터링

```typescript
// API 응답 시간 측정
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userId: req.user?.id,
    });
  });

  next();
});
```

---

## 14. 현재 상황 요약

### ✅ 프론트엔드에서 완료된 부분

- Event 데이터 모델 완전 정의
- 일정 CRUD UI 완전 구현
- React Query 설치 완료 (백엔드 연동 대기)
- 인증 시스템 UI 준비

### 🔄 백엔드에서 즉시 구현 필요

1. **Express.js 기본 서버 구축**
2. **MongoDB Event 모델 구현** (프론트엔드 인터페이스와 호환)
3. **일정 CRUD API 구현**
4. **JWT 인증 시스템**

### 📊 전체 백엔드 진행률: 0%

- **Phase 1 (핵심 백엔드)**: 0% ⏳
- **Phase 2 (프론트엔드 연동)**: 0% ⏳
- **Phase 3 (AI 기능)**: 0% ⏳
- **Phase 4 (고급 기능)**: 0% ⏳

**다음 즉시 행동 계획**: Phase 1의 기본 인프라 구축부터 시작하여 프론트엔드와의
연동을 최우선으로 진행해야 합니다.

---

## 15. 현재 프론트엔드 상황 업데이트 (2024년 12월)

### ✅ 프론트엔드 추가 완성 사항

- **개발 환경 최적화**: ESLint + Prettier 완전 설정
- **VS Code 워크스페이스**: 자동 포맷팅 및 린팅 구성
- **코드 품질 관리**: `npm run quality`, `npm run pre-commit` 스크립트
- **홈 화면 고도화**: 2000+ 라인, 완전한 캘린더/리스트 뷰
- **실시간 통계**: 완료율 실시간 계산 및 표시
- **햅틱 피드백**: 모든 상호작용에 완전 적용

### 🔄 백엔드 연동 대기 중인 기능들

1. **사용자 인증**: 로그인/회원가입 화면은 준비됨
2. **데이터 지속성**: Event 인터페이스 완전 정의됨
3. **API 서비스**: React Query 설치 완료, 구현 대기
4. **실시간 동기화**: 프론트엔드 상태 관리 준비 완료

### 📈 업데이트된 우선순위

1. **즉시 (1주)**: Express.js + MongoDB 기본 서버 구축
2. **1-2주**: Event CRUD API (프론트엔드 인터페이스 완벽 호환)
3. **2-3주**: 사용자 인증 시스템
4. **3-4주**: 프론트엔드-백엔드 완전 연동 테스트

LinQ 백엔드는 이제 프론트엔드의 MVP 완성에 맞춰 **최우선 개발 대상**이
되었습니다.

---

이 문서는 LinQ 백엔드의 전체적인 설계와 현재 프론트엔드 상황을 고려한 개발
가이드라인을 제공합니다. 프론트엔드가 이미 MVP 수준으로 구현되어 있어 백엔드
개발이 최우선 과제입니다.

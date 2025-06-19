# LinQ Backend 개발 문서

## 1. 프로젝트 개요

**LinQ Backend**는 AI 기반 스마트 일정 관리 서비스의 서버 애플리케이션입니다. 사용자의 일정 데이터를 관리하고, AI 기반 분석 및 추천 기능을 제공하며, 실시간 통신을 통해 모바일 클라이언트와 연동됩니다.

---

## 2. 기술 스택

### 2.1 Core Framework
- **Node.js 18+**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **TypeScript**: 타입 안전성 확보
- **Prisma**: ORM 및 데이터베이스 관리

### 2.2 데이터베이스
- **MongoDB**: 주 데이터베이스 (일정, 사용자 데이터)
- **Redis**: 캐싱 및 세션 관리
- **Vector Database (Pinecone)**: AI 임베딩 저장

### 2.3 AI 연동
- **OpenAI GPT-4**: 자연어 처리 및 일정 생성
- **LangChain**: AI 파이프라인 관리
- **Python FastAPI**: AI 모델 서빙 (별도 마이크로서비스)

### 2.4 실시간 통신
- **Socket.io**: WebSocket 기반 실시간 통신
- **Bull Queue**: 백그라운드 작업 처리

### 2.5 인증 & 보안
- **JWT**: 인증 토큰 관리
- **bcrypt**: 비밀번호 해싱
- **Passport.js**: 인증 전략
- **helmet**: 보안 미들웨어

### 2.6 외부 서비스
- **Google Calendar API**: 캘린더 동기화
- **Maps API**: 위치 기반 서비스
- **Push Notification**: FCM/APNS

---

## 3. 서버 아키텍처

### 3.1 마이크로서비스 구조
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main API      │    │   AI Service    │    │  Notification   │
│   (Node.js)     │◄───┤   (Python)     │    │   Service       │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────┤   Redis Queue   ├──────────────┘
                       │   Port: 6379    │
                       └─────────────────┘
                               │
                    ┌─────────────────┐
                    │    MongoDB      │
                    │   Port: 27017   │
                    └─────────────────┘
```

### 3.2 폴더 구조
```
backend/
├── src/
│   ├── controllers/         # API 컨트롤러
│   │   ├── auth.controller.ts
│   │   ├── events.controller.ts
│   │   ├── ai.controller.ts
│   │   └── analytics.controller.ts
│   ├── services/            # 비즈니스 로직
│   │   ├── event.service.ts
│   │   ├── ai.service.ts
│   │   ├── notification.service.ts
│   │   └── analytics.service.ts
│   ├── models/              # 데이터 모델
│   │   ├── user.model.ts
│   │   ├── event.model.ts
│   │   └── chat.model.ts
│   ├── middleware/          # 미들웨어
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── routes/              # 라우트 정의
│   │   ├── auth.routes.ts
│   │   ├── events.routes.ts
│   │   ├── ai.routes.ts
│   │   └── analytics.routes.ts
│   ├── utils/               # 유틸리티
│   │   ├── jwt.utils.ts
│   │   ├── validation.utils.ts
│   │   └── date.utils.ts
│   ├── config/              # 설정 파일
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── ai.config.ts
│   ├── websocket/           # WebSocket 핸들러
│   │   ├── chat.handler.ts
│   │   └── notification.handler.ts
│   └── jobs/                # 백그라운드 작업
│       ├── notification.job.ts
│       ├── analytics.job.ts
│       └── ai-training.job.ts
├── ai-service/              # AI 마이크로서비스
│   ├── main.py
│   ├── models/
│   ├── services/
│   └── requirements.txt
├── prisma/                  # 데이터베이스 스키마
│   ├── schema.prisma
│   └── migrations/
├── tests/                   # 테스트 파일
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 4. 데이터베이스 스키마

### 4.1 Prisma 스키마 정의
```prisma
// User 모델
model User {
  id              String    @id @default(cuid()) @map("_id")
  email           String    @unique
  password        String
  name            String
  timezone        String    @default("UTC")
  preferences     Json?     // AI 학습 설정
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  events          Event[]
  chatHistory     ChatMessage[]
  notifications   Notification[]
  analytics       UserAnalytics[]
  
  @@map("users")
}

// Event 모델
model Event {
  id              String      @id @default(cuid()) @map("_id")
  title           String
  description     String?
  startTime       DateTime
  endTime         DateTime
  location        String?
  category        EventCategory @default(PERSONAL)
  priority        EventPriority @default(MEDIUM)
  status          EventStatus   @default(SCHEDULED)
  isAllDay        Boolean       @default(false)
  recurrence      Json?         // 반복 설정
  reminders       Json[]        // 알림 설정
  aiGenerated     Boolean       @default(false)
  confidence      Float?        // AI 생성 시 신뢰도
  metadata        Json?         // 추가 메타데이터
  
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@map("events")
}

// AI 채팅 메시지
model ChatMessage {
  id              String      @id @default(cuid()) @map("_id")
  content         String
  role            MessageRole // USER, ASSISTANT, SYSTEM
  intent          String?     // 파싱된 의도
  entities        Json?       // 추출된 엔티티
  confidence      Float?      // AI 응답 신뢰도
  
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime    @default(now())
  
  @@map("chat_messages")
}

// 알림 모델
model Notification {
  id              String            @id @default(cuid()) @map("_id")
  title           String
  message         String
  type            NotificationType
  status          NotificationStatus @default(PENDING)
  scheduledAt     DateTime
  sentAt          DateTime?
  data            Json?             // 추가 데이터
  
  userId          String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime          @default(now())
  
  @@map("notifications")
}

// 사용자 분석 데이터
model UserAnalytics {
  id              String    @id @default(cuid()) @map("_id")
  date            DateTime
  eventsCompleted Int       @default(0)
  eventsTotal     Int       @default(0)
  productivityScore Float?
  timeDistribution Json?    // 카테고리별 시간 분배
  insights        Json?     // AI 인사이트
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  
  @@unique([userId, date])
  @@map("user_analytics")
}

// Enums
enum EventCategory {
  WORK
  PERSONAL
  HEALTH
  SOCIAL
  TRAVEL
  OTHER
}

enum EventPriority {
  LOW
  MEDIUM
  HIGH
}

enum EventStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum NotificationType {
  REMINDER
  SUGGESTION
  CONFLICT
  SUMMARY
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}
```

---

## 5. API 명세서

### 5.1 인증 API

#### POST /api/auth/register
```typescript
// 회원가입
Request Body: {
  email: string;
  password: string;
  name: string;
  timezone?: string;
}

Response: {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}
```

#### POST /api/auth/login
```typescript
// 로그인
Request Body: {
  email: string;
  password: string;
}

Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

### 5.2 이벤트 API

#### GET /api/events
```typescript
// 이벤트 목록 조회
Query Parameters: {
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  category?: EventCategory;
  status?: EventStatus;
}

Response: {
  events: Event[];
  totalCount: number;
}
```

#### POST /api/events
```typescript
// 이벤트 생성
Request Body: {
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  location?: string;
  category?: EventCategory;
  priority?: EventPriority;  // AI가 자동 분석하여 할당
  isAllDay?: boolean;
  recurrence?: RecurrenceRule;
  reminders?: ReminderSetting[];
}

Response: {
  event: Event;
}
```

#### PUT /api/events/:eventId
```typescript
// 이벤트 수정
Request Body: Partial<Event>

Response: {
  event: Event;
}
```

#### DELETE /api/events/:eventId
```typescript
// 이벤트 삭제
Response: {
  success: boolean;
}
```

### 5.3 AI API

#### POST /api/ai/chat
```typescript
// AI 채팅
Request Body: {
  message: string;
  context?: {
    currentDate: string;
    recentEvents: Event[];
  };
}

Response: {
  response: string;
  intent?: string;
  suggestedEvents?: Partial<Event>[];
  confidence?: number;
}
```

#### POST /api/ai/parse-natural-language
```typescript
// 자연어 일정 파싱
Request Body: {
  input: string;
  currentDate: string;
}

Response: {
  parsedEvent: Partial<Event>;
  confidence: number;
  entities: ParsedEntity[];
}
```

#### GET /api/ai/suggestions
```typescript
// AI 일정 제안
Query Parameters: {
  date?: string;
  limit?: number;
}

Response: {
  suggestions: EventSuggestion[];
}
```

### 5.4 분석 API

#### GET /api/analytics/summary
```typescript
// 분석 요약
Query Parameters: {
  period: 'day' | 'week' | 'month';
  date: string;
}

Response: {
  summary: {
    eventsCompleted: number;
    eventsTotal: number;
    productivityScore: number;
    timeDistribution: CategoryTimeDistribution;
    insights: string[];
  };
}
```

---

## 6. AI 서비스 구현

### 6.1 자연어 처리 파이프라인
```python
# ai-service/services/nlp_service.py
class NLPService:
    def __init__(self):
        self.client = OpenAI()
        self.chain = self._create_parsing_chain()
    
    async def parse_event(self, input_text: str, context: dict) -> ParsedEvent:
        """자연어 입력을 이벤트 객체로 파싱"""
        prompt = self._create_parsing_prompt(input_text, context)
        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            functions=[self._get_event_schema()],
            function_call={"name": "create_event"}
        )
        
        return self._parse_response(response)
    
    async def generate_suggestions(self, user_data: dict) -> List[EventSuggestion]:
        """사용자 패턴을 기반으로 일정 제안 생성"""
        # 사용자 일정 패턴 분석
        patterns = await self._analyze_user_patterns(user_data)
        
        # AI 기반 제안 생성
        suggestions = await self._generate_smart_suggestions(patterns)
        
        return suggestions
```

### 6.2 충돌 감지 및 해결
```typescript
// src/services/conflict.service.ts
export class ConflictService {
  async detectConflicts(newEvent: Partial<Event>, userId: string): Promise<ConflictResult> {
    const overlappingEvents = await this.findOverlappingEvents(newEvent, userId);
    
    if (overlappingEvents.length === 0) {
      return { hasConflict: false };
    }
    
    const resolutions = await this.generateResolutions(newEvent, overlappingEvents);
    
    return {
      hasConflict: true,
      conflictingEvents: overlappingEvents,
      suggestedResolutions: resolutions
    };
  }
  
  async analyzePriorityLevel(eventData: Partial<Event>, userContext: any): Promise<PriorityAnalysis> {
    /**
     * AI 기반 중요도 자동 분석
     */
    const analysisPrompt = this.buildPriorityAnalysisPrompt(eventData, userContext);
    
    const aiResponse = await this.aiService.analyzeText(analysisPrompt);
    
    return {
      priority: aiResponse.priority, // HIGH, MEDIUM, LOW
      confidence: aiResponse.confidence,
      reasoning: aiResponse.reasoning,
      factors: aiResponse.key_factors
    };
  }
  
  private async generateResolutions(
    newEvent: Partial<Event>,
    conflicts: Event[]
  ): Promise<ResolutionSuggestion[]> {
    // AI를 활용한 최적 해결책 생성
    const aiSuggestions = await this.aiService.generateConflictResolutions({
      newEvent,
      conflicts,
      userPreferences: await this.getUserPreferences()
    });
    
    return aiSuggestions;
  }
}
```

---

## 7. WebSocket 실시간 통신

### 7.1 Socket.io 이벤트 정의
```typescript
// src/websocket/events.ts
export interface ServerToClientEvents {
  'ai-response': (data: AIResponseData) => void;
  'event-updated': (event: Event) => void;
  'notification': (notification: Notification) => void;
  'conflict-detected': (conflict: ConflictData) => void;
  'sync-complete': () => void;
}

export interface ClientToServerEvents {
  'join-room': (userId: string) => void;
  'ai-chat': (message: string) => void;
  'typing': (isTyping: boolean) => void;
}
```

### 7.2 AI 채팅 핸들러
```typescript
// src/websocket/chat.handler.ts
export class ChatHandler {
  constructor(
    private io: Server,
    private aiService: AIService
  ) {}
  
  handleConnection(socket: Socket) {
    socket.on('ai-chat', async (message: string) => {
      try {
        // 실시간 타이핑 표시
        socket.emit('ai-typing', true);
        
        // AI 응답 스트리밍
        const responseStream = await this.aiService.chatStream(message, socket.userId);
        
        for await (const chunk of responseStream) {
          socket.emit('ai-response-chunk', chunk);
        }
        
        socket.emit('ai-typing', false);
      } catch (error) {
        socket.emit('ai-error', error.message);
      }
    });
  }
}
```

---

## 8. 백그라운드 작업

### 8.1 알림 스케줄링
```typescript
// src/jobs/notification.job.ts
export class NotificationJob {
  async scheduleSmartReminder(event: Event): Promise<void> {
    const reminderTime = await this.calculateOptimalReminderTime(event);
    
    await this.queue.add('send-notification', {
      eventId: event.id,
      userId: event.userId,
      type: 'smart-reminder'
    }, {
      delay: reminderTime.getTime() - Date.now()
    });
  }
  
  private async calculateOptimalReminderTime(event: Event): Promise<Date> {
    // 위치 기반 이동 시간 계산
    const travelTime = await this.mapsService.calculateTravelTime({
      destination: event.location,
      userId: event.userId
    });
    
    // 사용자 패턴 기반 준비 시간 예측
    const prepTime = await this.predictPreparationTime(event);
    
    return new Date(event.startTime.getTime() - (travelTime + prepTime) * 60000);
  }
}
```

### 8.2 일일 분석 작업
```typescript
// src/jobs/analytics.job.ts
export class AnalyticsJob {
  @Cron('0 6 * * *') // 매일 오전 6시
  async generateDailySummary(): Promise<void> {
    const users = await this.userService.getActiveUsers();
    
    for (const user of users) {
      const analytics = await this.calculateDailyAnalytics(user.id);
      await this.analyticsService.saveDailyAnalytics(user.id, analytics);
      
      // AI 인사이트 생성
      const insights = await this.aiService.generateDailyInsights(analytics);
      await this.notificationService.scheduleInsightNotification(user.id, insights);
    }
  }
}
```

---

## 9. 보안 구현

### 9.1 JWT 인증 미들웨어
```typescript
// src/middleware/auth.middleware.ts
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 9.2 Rate Limiting
```typescript
// src/middleware/rate-limit.middleware.ts
export const createRateLimit = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'Too many requests',
      retryAfter: windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// AI API 특별 제한
export const aiRateLimit = createRateLimit(20, 15 * 60 * 1000); // 15분당 20회
```

---

## 10. 외부 서비스 연동

### 10.1 Google Calendar 동기화
```typescript
// src/services/calendar-sync.service.ts
export class CalendarSyncService {
  async syncWithGoogleCalendar(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    const oauth2Client = await this.getGoogleOAuth2Client(user);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Google Calendar에서 이벤트 가져오기
    const googleEvents = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    // 양방향 동기화
    await this.bidirectionalSync(userId, googleEvents.data.items);
  }
}
```

### 10.2 Push Notification 서비스
```typescript
// src/services/push-notification.service.ts
export class PushNotificationService {
  async sendNotification(userId: string, notification: NotificationData): Promise<void> {
    const user = await this.userService.findById(userId);
    const deviceTokens = await this.getDeviceTokens(userId);
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: notification.data,
      tokens: deviceTokens
    };
    
    await admin.messaging().sendMulticast(message);
    
    // 알림 전송 기록
    await this.notificationService.markAsSent(notification.id);
  }
}
```

---

## 11. 테스트 전략

### 11.1 단위 테스트
```typescript
// tests/services/event.service.test.ts
describe('EventService', () => {
  let eventService: EventService;
  let mockRepository: jest.Mocked<EventRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    eventService = new EventService(mockRepository);
  });
  
  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const eventData = createMockEventData();
      mockRepository.create.mockResolvedValue(eventData);
      
      const result = await eventService.createEvent(eventData);
      
      expect(result).toEqual(eventData);
      expect(mockRepository.create).toHaveBeenCalledWith(eventData);
    });
    
    it('should detect conflicts', async () => {
      const conflictingEvent = createMockConflictingEvent();
      mockRepository.findOverlapping.mockResolvedValue([conflictingEvent]);
      
      await expect(eventService.createEvent(eventData))
        .rejects.toThrow('Event conflict detected');
    });
  });
});
```

### 11.2 통합 테스트
```typescript
// tests/integration/api.test.ts
describe('API Integration', () => {
  let app: Application;
  let authToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getTestAuthToken();
  });
  
  describe('POST /api/events', () => {
    it('should create event with AI parsing', async () => {
      const response = await request(app)
        .post('/api/ai/parse-natural-language')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          input: '내일 오후 3시에 회의',
          currentDate: '2024-01-15T09:00:00Z'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.parsedEvent.title).toContain('회의');
    });
  });
});
```

---

## 12. 모니터링 및 로깅

### 12.1 로깅 설정
```typescript
// src/config/logger.config.ts
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'linq-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 12.2 성능 모니터링
```typescript
// src/middleware/monitoring.middleware.ts
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('API Performance', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    });
    
    // 느린 응답 알림
    if (duration > 5000) {
      logger.warn('Slow API Response', {
        method: req.method,
        url: req.url,
        duration
      });
    }
  });
  
  next();
};
```

---

## 13. 배포 설정

### 13.1 Docker 설정
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 13.2 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - mongodb
      - redis
      - ai-service
  
  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
  
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongodb_data:
```

---

이 문서는 LinQ 백엔드 개발의 완전한 가이드라인을 제공합니다. AI가 이 문서만으로 전체 백엔드 시스템을 구현할 수 있도록 상세한 코드 예시와 구현 방법을 포함했습니다.

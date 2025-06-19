# LinQ 데이터베이스 설계 문서 (2024년 12월 업데이트)

## 1. 프로젝트 개요

**LinQ 데이터베이스**는 AI 기반 스마트 일정 관리 서비스의 데이터 저장소입니다.
현재 **설계 단계**에 있으며, 프론트엔드가 MVP 단계로 진입함에 따라 데이터베이스
구현이 최우선 과제로 설정되었습니다.

**현재 상태: 0% (설계 단계)** **우선순위: 최고 (백엔드 연동 대기 중)**

### 🚨 긴급성 증가

프론트엔드가 **완전한 MVP 상태**에 도달함에 따라 데이터베이스 구현의 긴급성이
크게 증가했습니다. 현재 로컬 샘플 데이터로만 작동하는 상태에서 실제 데이터
저장소가 필요한 시점입니다.

---

## 2. 현재 프론트엔드 데이터 모델 현황

### 2.1 ✅ 프론트엔드에서 완전 구현된 Event 인터페이스

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

  // 호환성 필드 (기존 샘플 데이터)
  time?: string;
  date?: string;
}
```

### 2.2 🔄 프론트엔드에서 사용 중인 샘플 데이터 (8개)

```typescript
const sampleEvents = [
  {
    id: '1',
    title: '팀 스탠드업',
    startDate: new Date('2024-12-02T09:00:00'),
    endDate: new Date('2024-12-02T09:30:00'),
    color: '#3B82F6',
    category: 'work',
    isCompleted: true,
    priority: 'HIGH',
  },
  {
    id: '2',
    title: '프로젝트 리뷰',
    startDate: new Date('2024-12-02T14:00:00'),
    endDate: new Date('2024-12-02T15:00:00'),
    color: '#EF4444',
    category: 'work',
    isCompleted: false,
    priority: 'HIGH',
  },
  // ... 총 8개 이벤트
];
```

---

## 3. 데이터베이스 기술 스택

### 3.1 권장 데이터베이스 구성

#### 주 데이터베이스: MongoDB 7.0+

**선택 이유:**

- **스키마 유연성**: Event 구조 변경 시 쉬운 마이그레이션
- **JSON 네이티브**: 프론트엔드 타입과 완벽 호환
- **확장성**: 향후 대용량 데이터 처리 대응
- **복잡한 쿼리**: 날짜 범위, 카테고리 필터링 최적화

#### 캐시 및 세션: Redis 7.2+

**사용 목적:**

- **사용자 세션 관리**: JWT 토큰 관리
- **API 응답 캐싱**: 자주 조회되는 이벤트 캐시
- **AI 분석 결과 캐싱**: 중복 분석 방지
- **실시간 알림 큐**: 알림 스케줄링

### 3.2 ODM/ORM 선택: Mongoose 7.6+

```typescript
// 프론트엔드 Event 인터페이스와 완벽 호환되는 스키마 설계
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isAllDay: { type: Boolean, default: false },
  color: { type: String, required: true },
  category: {
    type: String,
    enum: ['work', 'health', 'social', 'personal'],
    required: true,
  },
  // ... 프론트엔드 인터페이스와 1:1 매핑
});
```

---

## 4. 데이터베이스 스키마 설계

### 4.1 Users Collection

```typescript
interface User {
  _id: ObjectId;
  email: string; // 이메일 (고유 인덱스)
  password: string; // bcrypt 해시
  name: string; // 사용자 이름
  timezone: string; // 타임존 (기본: 'Asia/Seoul')

  // 사용자 설정 (프론트엔드 테마 시스템과 호환)
  preferences: {
    theme: 'light' | 'dark' | 'system'; // 프론트엔드 ThemeContext와 일치
    notifications: boolean;
    aiSuggestions: boolean;
    workingHours: {
      start: string; // "09:00"
      end: string; // "18:00"
    };
    defaultCategory: 'work' | 'health' | 'social' | 'personal';
  };

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

// MongoDB 인덱스
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ lastLoginAt: 1 });
```

### 4.2 Events Collection (프론트엔드 완벽 호환)

```typescript
interface Event {
  _id: ObjectId;
  userId: ObjectId; // User 참조

  // 프론트엔드 Event 인터페이스와 완전 일치
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: string; // 프론트엔드 8색 팔레트 값
  location?: {
    name: string; // 프론트엔드 location string에서 확장
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notifications: string[]; // 프론트엔드와 동일 형식
  category: 'work' | 'health' | 'social' | 'personal';
  isCompleted: boolean; // 프론트엔드 완료 상태
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  // 확장 필드 (향후 기능)
  description?: string;
  aiAnalysis?: {
    suggestedPriority: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number; // 0-1
    reasoning: string;
    keywords: string[];
    processedAt: Date;
  };

  // 반복 일정 (향후 구현)
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    exceptions?: Date[]; // 제외 날짜
  };

  // 협업 기능 (향후)
  sharedWith?: ObjectId[]; // 공유된 사용자들
  permissions?: {
    [userId: string]: 'read' | 'write' | 'admin';
  };

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  version: number; // 충돌 해결용
}

// MongoDB 인덱스 (쿼리 최적화)
db.events.createIndex({ userId: 1, startDate: 1 }); // 사용자별 날짜 정렬
db.events.createIndex({ userId: 1, category: 1 }); // 카테고리 필터
db.events.createIndex({ userId: 1, isCompleted: 1 }); // 완료 상태 필터
db.events.createIndex(
  {
    userId: 1,
    startDate: 1,
    endDate: 1,
  },
  { name: 'user_date_range' }
); // 날짜 범위 쿼리

// 텍스트 검색
db.events.createIndex(
  {
    title: 'text',
    'location.name': 'text',
    description: 'text',
  },
  { name: 'text_search' }
);

// 지리적 검색 (향후)
db.events.createIndex({ 'location.coordinates': '2dsphere' });
```

### 4.3 UserSessions Collection (Redis)

```typescript
interface UserSession {
  sessionId: string; // Redis key
  userId: string;
  deviceInfo: {
    platform: 'ios' | 'android' | 'web';
    deviceId: string;
    appVersion: string;
    osVersion?: string;
  };
  tokens: {
    accessToken: string; // JWT 해시
    refreshToken: string;
    expiresAt: Date;
  };
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Redis 키 구조
// session:{sessionId} -> UserSession JSON
// user_sessions:{userId} -> Set of sessionIds
// active_users -> Set of userIds (TTL: 5분)
```

### 4.4 AIAnalysis Collection

```typescript
interface AIAnalysis {
  _id: ObjectId;
  userId: ObjectId;
  type: 'priority' | 'suggestion' | 'conflict' | 'parsing' | 'optimization';

  // 입력 데이터
  input: {
    text: string; // 원본 입력
    context?: any; // 추가 컨텍스트
    hash: string; // 입력 해시 (중복 방지)
  };

  // AI 분석 결과
  output: {
    result: any; // 분석 결과
    confidence: number; // 신뢰도 (0-1)
    reasoning?: string; // 분석 근거
    alternatives?: any[]; // 대안 결과
  };

  // 메타데이터
  model: string; // 사용된 AI 모델 ('solar-pro', 'gpt-4', etc.)
  version: string; // 모델 버전
  processingTime: number; // 처리 시간 (ms)
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number; // API 호출 비용

  createdAt: Date;
}

// MongoDB 인덱스
db.ai_analysis.createIndex({ userId: 1, type: 1, createdAt: -1 });
db.ai_analysis.createIndex({ 'input.hash': 1 }); // 중복 분석 방지
db.ai_analysis.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30일 TTL
```

### 4.5 Notifications Collection

```typescript
interface Notification {
  _id: ObjectId;
  userId: ObjectId;
  eventId?: ObjectId; // 연관 이벤트 (선택적)

  // 알림 내용
  type: 'reminder' | 'suggestion' | 'conflict' | 'summary' | 'ai_insight';
  title: string;
  message: string;
  data?: any; // 추가 데이터 (JSON)

  // 스케줄링
  scheduledAt: Date; // 발송 예정 시간
  sentAt?: Date; // 실제 발송 시간
  status: 'pending' | 'sent' | 'failed' | 'cancelled';

  // 전송 채널
  channels: {
    push: boolean; // 푸시 알림
    email: boolean; // 이메일
    inApp: boolean; // 인앱 알림
  };

  // 사용자 상호작용
  readAt?: Date;
  actionTaken?: {
    action: string;
    timestamp: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

// MongoDB 인덱스
db.notifications.createIndex({ userId: 1, status: 1, scheduledAt: 1 });
db.notifications.createIndex({ userId: 1, readAt: 1 });
db.notifications.createIndex({ scheduledAt: 1, status: 1 }); // 스케줄러용
```

---

## 5. 캐싱 전략 (Redis)

### 5.1 사용자 이벤트 캐싱

```typescript
// 캐시 키 구조
const eventCacheKeys = {
  userEvents: (userId: string, startDate: string, endDate: string) =>
    `events:${userId}:${startDate}:${endDate}`,
  userEventsByCategory: (userId: string, category: string) =>
    `events:${userId}:category:${category}`,
  userStats: (userId: string, date: string) => `stats:${userId}:${date}`,
};

// 캐시 TTL
const cacheTTL = {
  events: 300, // 5분
  stats: 600, // 10분
  aiAnalysis: 3600, // 1시간
  userProfile: 1800, // 30분
};
```

### 5.2 AI 분석 결과 캐싱

```typescript
// AI 캐시 키 구조
const aiCacheKeys = {
  nlpParsing: (inputHash: string) => `ai:nlp:${inputHash}`,
  priorityAnalysis: (inputHash: string) => `ai:priority:${inputHash}`,
  suggestions: (userId: string, date: string) =>
    `ai:suggestions:${userId}:${date}`,
};

// 캐시 전략
class AICache {
  async getCachedAnalysis(type: string, input: string): Promise<any | null> {
    const hash = this.generateHash(input);
    const key = `ai:${type}:${hash}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedAnalysis(
    type: string,
    input: string,
    result: any
  ): Promise<void> {
    const hash = this.generateHash(input);
    const key = `ai:${type}:${hash}`;
    await redis.setex(key, cacheTTL.aiAnalysis, JSON.stringify(result));
  }
}
```

---

## 6. 쿼리 최적화 전략

### 6.1 자주 사용되는 쿼리 패턴

#### 프론트엔드에서 요청하는 주요 쿼리들

```typescript
// 1. 날짜 범위별 이벤트 조회 (캘린더 뷰)
db.events
  .find({
    userId: ObjectId(userId),
    startDate: { $gte: startDate, $lte: endDate },
  })
  .sort({ startDate: 1 });

// 2. 카테고리별 필터링 (프론트엔드 필터 시스템)
db.events
  .find({
    userId: ObjectId(userId),
    category: category,
    startDate: { $gte: todayStart },
  })
  .sort({ isCompleted: 1, startDate: 1 });

// 3. 완료 상태별 필터링
db.events
  .find({
    userId: ObjectId(userId),
    isCompleted: completed,
    startDate: { $gte: startDate },
  })
  .sort({ startDate: 1 });

// 4. 실시간 통계 계산 (프론트엔드 완료율 표시)
db.events.aggregate([
  {
    $match: {
      userId: ObjectId(userId),
      startDate: { $gte: todayStart, $lt: tomorrowStart },
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
    },
  },
]);
```

### 6.2 인덱스 최적화

```typescript
// 복합 인덱스 우선순위
const indexes = [
  // 1순위: 사용자별 날짜 범위 쿼리 (가장 빈번)
  { userId: 1, startDate: 1, endDate: 1 },

  // 2순위: 사용자별 카테고리 필터
  { userId: 1, category: 1, startDate: 1 },

  // 3순위: 사용자별 완료 상태 필터
  { userId: 1, isCompleted: 1, startDate: 1 },

  // 4순위: 텍스트 검색
  { title: 'text', description: 'text' },
];
```

---

## 7. 데이터 마이그레이션 계획

### 7.1 프론트엔드 샘플 데이터 → MongoDB 마이그레이션

```typescript
// 마이그레이션 스크립트
const migrateSampleData = async () => {
  const testUser = await User.create({
    email: 'test@linq.com',
    password: await bcrypt.hash('test123', 10),
    name: 'Test User',
    timezone: 'Asia/Seoul',
    preferences: {
      theme: 'system',
      notifications: true,
      aiSuggestions: true,
      workingHours: { start: '09:00', end: '18:00' },
      defaultCategory: 'work',
    },
  });

  // 프론트엔드 샘플 이벤트 8개 변환
  const sampleEvents = [
    {
      title: '팀 스탠드업',
      startDate: new Date('2024-12-02T09:00:00'),
      endDate: new Date('2024-12-02T09:30:00'),
      isAllDay: false,
      color: '#3B82F6',
      category: 'work',
      isCompleted: true,
      priority: 'HIGH',
      notifications: ['정시'],
      userId: testUser._id,
    },
    // ... 나머지 7개
  ];

  await Event.insertMany(sampleEvents);
};
```

### 7.2 프론트엔드 호환성 확보

```typescript
// API 응답 포맷터 (MongoDB → 프론트엔드)
const formatEventForFrontend = (mongoEvent: any): Event => {
  return {
    id: mongoEvent._id.toString(), // ObjectId → string
    title: mongoEvent.title,
    startDate: mongoEvent.startDate,
    endDate: mongoEvent.endDate,
    isAllDay: mongoEvent.isAllDay,
    color: mongoEvent.color,
    location: mongoEvent.location?.name, // 객체 → string (하위 호환)
    notifications: mongoEvent.notifications,
    category: mongoEvent.category,
    isCompleted: mongoEvent.isCompleted || false,
    priority: mongoEvent.priority,

    // 호환성 필드 (기존 프론트엔드 코드 지원)
    time: mongoEvent.startDate.toLocaleTimeString(),
    date: mongoEvent.startDate.toLocaleDateString(),
  };
};
```

---

## 8. 성능 최적화

### 8.1 읽기 성능 최적화

```typescript
// 1. 인덱스 힌트 사용
db.events
  .find({
    userId: ObjectId(userId),
    startDate: { $gte: startDate, $lte: endDate },
  })
  .hint({ userId: 1, startDate: 1 });

// 2. 필드 선택 (불필요한 필드 제외)
db.events.find(
  { userId: ObjectId(userId) },
  { title: 1, startDate: 1, endDate: 1, category: 1, isCompleted: 1 }
);

// 3. 집계 파이프라인 최적화
db.events.aggregate([
  { $match: { userId: ObjectId(userId) } }, // 먼저 필터링
  { $sort: { startDate: 1 } }, // 인덱스 활용 정렬
  { $limit: 100 }, // 필요한 만큼만
  { $project: { title: 1, startDate: 1, category: 1 } },
]);
```

### 8.2 쓰기 성능 최적화

```typescript
// 배치 연산 사용
const bulkOps = events.map(event => ({
  updateOne: {
    filter: { _id: event._id },
    update: { $set: event },
    upsert: true,
  },
}));

await Event.bulkWrite(bulkOps);

// 버전 필드를 이용한 낙관적 잠금
await Event.updateOne(
  { _id: eventId, version: currentVersion },
  { $set: { title: newTitle }, $inc: { version: 1 } }
);
```

---

## 9. 백업 및 복구 전략

### 9.1 MongoDB 백업

```bash
# 일일 백업 (cron job)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/linq" --out="/backup/mongodb/$DATE"

# 압축 및 원격 저장
tar -czf "/backup/mongodb/linq_$DATE.tar.gz" "/backup/mongodb/$DATE"
aws s3 cp "/backup/mongodb/linq_$DATE.tar.gz" "s3://linq-backups/mongodb/"

# 7일 이상 된 백업 삭제
find /backup/mongodb -name "*.tar.gz" -mtime +7 -delete
```

### 9.2 Redis 백업

```bash
# Redis 스냅샷 백업
redis-cli --rdb /backup/redis/dump_$(date +%Y%m%d_%H%M%S).rdb

# AOF 백업 (실시간 복구용)
cp /var/lib/redis/appendonly.aof /backup/redis/aof_$(date +%Y%m%d_%H%M%S).aof
```

---

## 10. 모니터링 및 알람

### 10.1 성능 모니터링

```typescript
// MongoDB 슬로우 쿼리 모니터링
db.setProfilingLevel(1, { slowms: 100 });

// 주요 메트릭 추적
const dbMetrics = {
  connectionCount: 'db.serverStatus().connections',
  activeQueries: 'db.currentOp().inprog.length',
  indexUsage: 'db.events.getIndexes()',
  cacheHitRatio: 'redis.info("stats").keyspace_hits / keyspace_misses',
};
```

### 10.2 자동 알람 설정

```typescript
// 임계값 설정
const thresholds = {
  slowQueryTime: 1000, // 1초
  connectionCount: 100, // 100개
  diskUsage: 80, // 80%
  memoryUsage: 85, // 85%
  cacheHitRatio: 0.9, // 90%
};

// 알람 로직
const checkMetrics = async () => {
  const metrics = await getDBMetrics();

  if (metrics.avgQueryTime > thresholds.slowQueryTime) {
    await sendAlert('Slow queries detected', metrics);
  }

  if (metrics.connectionCount > thresholds.connectionCount) {
    await sendAlert('High connection count', metrics);
  }
};
```

---

## 11. 보안 고려사항

### 11.1 데이터 암호화

```typescript
// 민감 데이터 필드 암호화
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }, // bcrypt 해시

  // 민감 정보 암호화
  personalInfo: {
    type: mongoose.Schema.Types.Mixed,
    get: (data: any) => (data ? decrypt(data) : null),
    set: (data: any) => (data ? encrypt(data) : null),
  },
});

// 필드 레벨 암호화
const encryptSensitiveFields = (doc: any) => {
  if (doc.location?.address) {
    doc.location.address = encrypt(doc.location.address);
  }
  return doc;
};
```

### 11.2 접근 제어

```typescript
// 사용자별 데이터 격리
const enforceUserIsolation = (userId: string) => {
  return { userId: new mongoose.Types.ObjectId(userId) };
};

// 쿼리 시 항상 사용자 필터 적용
const findUserEvents = async (userId: string, filters: any) => {
  return Event.find({
    ...enforceUserIsolation(userId),
    ...filters,
  });
};
```

---

## 12. 개발 우선순위 로드맵

### 📋 Phase 1: 기본 데이터베이스 구축 (1-2주) - **최우선**

#### Week 1: 인프라 설정

- [ ] MongoDB 7.0 설치 및 설정
- [ ] Redis 7.2 설치 및 설정
- [ ] Mongoose ODM 설정
- [ ] 기본 연결 및 인증 설정

#### Week 2: 스키마 구현

- [ ] User 스키마 구현 (프론트엔드 요구사항 반영)
- [ ] Event 스키마 구현 (프론트엔드 인터페이스 완벽 호환)
- [ ] 기본 인덱스 생성
- [ ] 샘플 데이터 마이그레이션

### 📋 Phase 2: API 연동 최적화 (1주)

- [ ] 쿼리 성능 최적화
- [ ] 캐싱 시스템 구현 (Redis)
- [ ] 프론트엔드 API 연동 테스트
- [ ] 응답 포맷 검증

### 📋 Phase 3: AI 기능 지원 데이터 모델 (1-2주)

- [ ] AIAnalysis 컬렉션 구현
- [ ] AI 캐싱 시스템
- [ ] 자연어 처리 결과 저장 구조
- [ ] 중요도 분석 메타데이터 저장

### 📋 Phase 4: 고급 기능 및 최적화 (2-3주)

- [ ] 알림 시스템 데이터 모델
- [ ] 성능 모니터링 시스템
- [ ] 백업/복구 자동화
- [ ] 보안 강화 (암호화, 접근 제어)

---

## 13. 현재 상황 요약

### ✅ 프론트엔드에서 완료된 데이터 구조

- Event 인터페이스 완전 정의 및 구현
- 8개 샘플 이벤트로 완전 테스트
- 날짜 범위, 카테고리, 완료 상태 필터링 구현
- 실시간 통계 계산 (완료율) 구현

### 🔄 데이터베이스에서 즉시 구현 필요

1. **MongoDB Event 스키마** (프론트엔드 인터페이스 완벽 호환)
2. **User 스키마** (인증 시스템 지원)
3. **기본 인덱스** (쿼리 성능 최적화)
4. **샘플 데이터 마이그레이션** (프론트엔드 테스트 데이터 호환)

### 📊 전체 데이터베이스 진행률: 0%

- **Phase 1 (기본 구축)**: 0% ⏳
- **Phase 2 (API 연동)**: 0% ⏳
- **Phase 3 (AI 지원)**: 0% ⏳
- **Phase 4 (고급 기능)**: 0% ⏳

**다음 즉시 행동 계획**: MongoDB와 Redis 기본 설치부터 시작하여 프론트엔드 Event
인터페이스와 완벽 호환되는 스키마 구현을 최우선으로 진행해야 합니다.

---

## 14. 프론트엔드 연동 업데이트 (2024년 12월)

### ✅ 프론트엔드에서 추가 완성된 데이터 구조

#### 완전한 Event 인터페이스 활용

프론트엔드에서 다음 기능들이 완전히 구현되어 데이터베이스 스키마와 즉시 연동
가능:

```typescript
// 실제 프론트엔드에서 사용 중인 Event 구조
interface Event {
  id: string; // MongoDB _id로 매핑
  title: string; // 완전 구현됨
  startDate: Date; // 날짜/시간 선택기 완전 구현
  endDate: Date; // 자동 계산 및 수동 설정 지원
  isAllDay: boolean; // 종일 토글 완전 구현
  color: string; // 8가지 색상 팔레트 완전 구현
  location?: string; // 8가지 장소 프리셋 완전 구현
  notifications: string[]; // 5가지 알림 옵션 완전 구현
  category: 'work' | 'health' | 'social' | 'personal'; // 완전 구현
  isCompleted?: boolean; // 완료 상태 토글 완전 구현
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // 구현 준비됨
}
```

#### 실제 사용 중인 샘플 데이터 (마이그레이션 준비됨)

```javascript
// 프론트엔드에서 테스트 중인 8개 이벤트
const sampleEvents = [
  {
    id: '1',
    title: '팀 스탠드업',
    startDate: new Date('2024-12-02T09:00:00'),
    endDate: new Date('2024-12-02T09:30:00'),
    color: '#3B82F6',
    category: 'work',
    isCompleted: true,
    priority: 'HIGH',
  },
  // ... 7개 더 (완전한 테스트 데이터)
];
```

### 🔄 즉시 필요한 데이터베이스 호환성

#### 1. Event 스키마 완벽 호환 (최우선)

```javascript
// MongoDB 스키마 (프론트엔드 인터페이스 100% 호환)
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isAllDay: { type: Boolean, default: false },
  color: {
    type: String,
    required: true,
    enum: [
      '#EF4444',
      '#F97316',
      '#EAB308',
      '#22C55E',
      '#3B82F6',
      '#8B5CF6',
      '#EC4899',
      '#6B7280',
    ], // 프론트엔드 8색 팔레트
  },
  // ... 모든 필드 1:1 매핑
});
```

#### 2. 샘플 데이터 마이그레이션 스크립트

```javascript
// 프론트엔드 샘플 데이터를 MongoDB로 마이그레이션
const migrateSampleData = async () => {
  const events = frontendSampleEvents.map(event => ({
    ...event,
    _id: new mongoose.Types.ObjectId(),
    userId: testUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await Event.insertMany(events);
};
```

### 📈 업데이트된 개발 우선순위

#### Phase 1: 즉시 구현 (1주)

1. **MongoDB 기본 설치** + **Event 스키마** (프론트엔드 호환)
2. **Redis 설치** + **기본 캐싱**
3. **샘플 데이터 마이그레이션**

#### Phase 2: API 연동 (1-2주)

1. **Event CRUD API** (프론트엔드 인터페이스 완벽 매칭)
2. **날짜 범위 쿼리** (캘린더 뷰 지원)
3. **완료 상태 업데이트** API

LinQ 데이터베이스는 이제 프론트엔드의 완성도에 맞춰 **즉시 구현해야 할 최우선
과제**입니다.

---

이 문서는 LinQ 데이터베이스의 전체적인 설계와 현재 프론트엔드 상황을 고려한 구현
가이드라인을 제공합니다. 프론트엔드가 이미 MVP 수준으로 구현되어 있어
데이터베이스 호환성 확보가 최우선 과제입니다.

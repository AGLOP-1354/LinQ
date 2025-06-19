# LinQ Database 설계 명세서

## 1. 데이터베이스 아키텍처 개요

### 1.1 멀티 데이터베이스 전략

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    MongoDB      │    │     Redis       │    │  Vector DB      │
│  (Primary DB)   │    │   (Cache/Queue) │    │ (AI Embeddings) │
│                 │    │                 │    │                 │
│ - Users         │    │ - Sessions      │    │ - Event Vectors │
│ - Events        │    │ - Cache         │    │ - User Patterns │
│ - Messages      │    │ - Job Queue     │    │ - Similarity    │
│ - Analytics     │    │ - Real-time     │    │ - Preferences   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 데이터 플로우

```
Frontend Request → Redis Cache → MongoDB → Vector DB → AI Analysis
                      ↓              ↓           ↓
                 Cache Result    Persistent   Vector Search
                                   Data       & Similarity
```

---

## 2. MongoDB 스키마 설계

### 2.1 사용자 컬렉션 (users)

```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",           // 유니크 인덱스
  password: "hashed_password",
  profile: {
    name: "사용자명",
    avatar: "avatar_url",
    timezone: "Asia/Seoul",
    language: "ko"
  },
  preferences: {
    ai_settings: {
      learning_enabled: true,
      suggestion_frequency: "high",     // high, medium, low
      privacy_level: "standard"         // strict, standard, open
    },
    notification_settings: {
      push_enabled: true,
      email_enabled: false,
      smart_timing: true,
      reminder_advance: 15              // 분 단위
    },
    calendar_settings: {
      default_view: "week",             // day, week, month
      working_hours: {
        start: "09:00",
        end: "18:00"
      },
      work_days: [1, 2, 3, 4, 5]       // 0=일요일
    }
  },
  ai_profile: {
    productivity_patterns: {
      peak_hours: ["09:00-11:00", "14:00-16:00"],
      focus_duration: 120,              // 평균 집중 시간(분)
      break_frequency: 90,              // 휴식 주기(분)
      energy_curve: "morning_person"    // morning_person, night_owl, balanced
    },
    behavioral_insights: {
      punctuality_score: 0.85,          // 0-1
      planning_horizon: 7,              // 일 단위
      flexibility_score: 0.7,           // 0-1
      multitasking_ability: 0.6         // 0-1
    },
    learned_preferences: {
      preferred_locations: [
        { name: "홈오피스", frequency: 0.6 },
        { name: "회사", frequency: 0.3 }
      ],
      activity_preferences: {
        "meeting": { optimal_duration: 60, preferred_time: "morning" },
        "focused_work": { optimal_duration: 120, preferred_time: "morning" }
      }
    }
  },
  device_tokens: [                     // FCM/APNS 토큰
    {
      token: "device_token",
      platform: "ios",                 // ios, android
      last_used: ISODate("..."),
      active: true
    }
  ],
  external_integrations: {
    google_calendar: {
      enabled: true,
      access_token: "encrypted_token",
      refresh_token: "encrypted_token",
      last_sync: ISODate("...")
    },
    microsoft_outlook: {
      enabled: false
    }
  },
  subscription: {
    plan: "premium",                   // free, premium, enterprise
    expires_at: ISODate("..."),
    features: ["ai_suggestions", "unlimited_events", "analytics"]
  },
  usage_stats: {
    events_created: 1250,
    ai_interactions: 430,
    login_streak: 15,
    last_active: ISODate("...")
  },
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

### 2.2 이벤트 컬렉션 (events)

```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),            // 외래키, 인덱스
  title: "프로젝트 회의",
  description: "Q1 계획 검토 및 리소스 배정 논의",

  // 시간 정보
  timing: {
    start_time: ISODate("2024-01-15T14:00:00Z"),
    end_time: ISODate("2024-01-15T15:00:00Z"),
    timezone: "Asia/Seoul",
    is_all_day: false,
    estimated_duration: 60,            // 분 단위
    actual_duration: 65,               // 완료 후 기록
    buffer_time: {                     // 이동/준비 시간
      before: 15,
      after: 10
    }
  },

  // 위치 정보
  location: {
    type: "physical",                  // physical, virtual, hybrid
    address: "서울시 강남구 테헤란로 123",
    coordinates: {
      lat: 37.5665,
      lng: 126.9780
    },
    venue_details: {
      building: "A타워",
      floor: "12F",
      room: "회의실 A"
    },
    virtual_info: {
      platform: "zoom",               // zoom, teams, meet
      meeting_id: "123-456-789",
      password: "encrypted_password"
    }
  },

  // 분류 및 우선순위
  categorization: {
    category: "work",                  // work, personal, health, social, travel
    subcategory: "meeting",            // meeting, task, appointment, event
    priority: "high",                  // low, medium, high (AI 자동 분석)
    ai_priority_analysis: {
      confidence: 0.92,                // AI 분석 신뢰도
      reasoning: "중요 참석자 다수, 프로젝트 마일스톤",
      factors: ["participant_count", "deadline_proximity", "category_importance"],
      manual_override: false           // 사용자 수동 변경 여부
    },
    tags: ["프로젝트", "Q1", "회의"],
    project_id: ObjectId("..."),       // 프로젝트 연결 (선택적)
  },

  // 상태 정보
  status: {
    current: "scheduled",              // scheduled, in_progress, completed, cancelled, postponed
    completion_rate: 1.0,              // 0-1 (부분 완료 지원)
    effort_rating: 3,                  // 1-5 (실제 소요 노력도)
    satisfaction_rating: 4,            // 1-5 (만족도)
    notes: "생산적인 회의였음"
  },

  // 반복 설정
  recurrence: {
    enabled: true,
    pattern: "weekly",                 // daily, weekly, monthly, yearly, custom
    interval: 1,                       // 간격
    days_of_week: [1],                // 요일 (월요일)
    end_condition: {
      type: "count",                   // date, count, never
      value: 10                        // 10회 반복
    },
    exceptions: [                      // 예외 날짜
      ISODate("2024-01-22T14:00:00Z")
    ]
  },

  // 참여자 정보
  participants: [
    {
      user_id: ObjectId("..."),
      role: "organizer",               // organizer, required, optional
      status: "accepted",              // pending, accepted, declined, tentative
      response_time: ISODate("..."),
      notes: "자료 준비 완료"
    }
  ],

  // 알림 설정
  reminders: [
    {
      type: "smart",                   // smart, fixed, location_based
      trigger_time: ISODate("..."),
      method: "push",                  // push, email, sms
      message: "15분 후 출발하세요",
      sent: true,
      sent_at: ISODate("...")
    }
  ],

  // AI 관련 정보
  ai_metadata: {
    generated_by_ai: true,
    confidence_score: 0.92,            // AI 생성 신뢰도
    original_input: "내일 오후 2시에 프로젝트 회의",
    parsed_entities: [
      { type: "time", value: "오후 2시", confidence: 0.95 },
      { type: "activity", value: "프로젝트 회의", confidence: 0.90 }
    ],
    suggestions_applied: [
      "optimal_duration_60min",
      "buffer_time_15min"
    ],
    learning_feedback: {
      user_satisfaction: 5,            // 1-5
      accuracy_rating: 4,              // 1-5
      time_accuracy: true,
      location_accuracy: true
    }
  },

  // 연결된 데이터
  attachments: [
    {
      type: "file",                    // file, link, note
      name: "회의 자료.pdf",
      url: "https://storage.../file.pdf",
      size: 2048576,                   // bytes
      mime_type: "application/pdf"
    }
  ],

  // 충돌 및 최적화
  conflicts: [
    {
      conflicted_event_id: ObjectId("..."),
      conflict_type: "time_overlap",   // time_overlap, location_conflict, resource_conflict
      severity: "major",               // minor, major, critical
      resolution_suggestion: "move_to_15:00",
      resolved: false,
      resolved_at: null
    }
  ],

  // 메타데이터
  metadata: {
    created_by: "user",                // user, ai, sync, import
    source: "mobile_app",              // mobile_app, web_app, api, sync
    version: 1,                        // 수정 버전
    last_modified_by: ObjectId("..."),
    sync_status: {
      google_calendar: {
        synced: true,
        last_sync: ISODate("..."),
        external_id: "google_event_id"
      }
    }
  },

  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

### 2.3 AI 채팅 컬렉션 (chat_messages)

```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  conversation_id: ObjectId("..."),     // 대화 세션 그룹핑

  message: {
    content: "내일 오후 3시에 치과 예약 잡아줘",
    role: "user",                      // user, assistant, system
    timestamp: ISODate("..."),
    language: "ko",
    input_method: "text"               // text, voice, quick_action
  },

  // AI 처리 결과
  ai_processing: {
    intent: "create_event",            // create_event, modify_event, query_schedule, general_chat
    confidence: 0.95,
    processing_time: 1.2,              // 초 단위
    model_version: "gpt-4-1106",

    extracted_entities: [
      {
        type: "datetime",
        value: "2024-01-16T15:00:00Z",
        original_text: "내일 오후 3시",
        confidence: 0.97
      },
      {
        type: "event_type",
        value: "appointment",
        original_text: "치과 예약",
        confidence: 0.92
      },
      {
        type: "location_category",
        value: "medical",
        original_text: "치과",
        confidence: 0.99
      }
    ],

    context_used: {
      recent_events: ["event_id_1", "event_id_2"],
      user_preferences: ["medical_appointments_30min"],
      location_history: ["dental_clinic_gangnam"]
    }
  },

  // 응답 정보
  response: {
    content: "치과 예약을 1월 16일 오후 3시로 생성했습니다. 30분 전에 알림을 드릴게요.",
    suggestions: [
      {
        type: "event_creation",
        data: {
          title: "치과 예약",
          start_time: "2024-01-16T15:00:00Z",
          duration: 30,
          category: "health"
        }
      }
    ],
    follow_up_questions: [
      "특별히 기억해야 할 사항이 있나요?",
      "다음 예약도 미리 잡을까요?"
    ]
  },

  // 사용자 피드백
  feedback: {
    rating: 5,                         // 1-5
    was_helpful: true,
    accuracy_score: 5,                 // 1-5
    feedback_text: "정확하게 이해했어요",
    corrected_intent: null,
    timestamp: ISODate("...")
  },

  // 학습 데이터
  learning_data: {
    user_behavior_pattern: "quick_acceptance",  // quick_acceptance, modification_required, rejection
    successful_prediction: true,
    error_type: null,                  // parsing_error, context_error, intent_error
    improvement_area: null
  },

  created_at: ISODate("...")
}
```

### 2.4 알림 컬렉션 (notifications)

```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  related_event_id: ObjectId("..."),   // 관련 이벤트 (선택적)

  // 알림 내용
  content: {
    title: "회의 15분 전입니다",
    message: "프로젝트 회의까지 15분 남았습니다. 회의실로 이동하세요.",
    rich_content: {
      event_details: {
        title: "프로젝트 회의",
        location: "12F 회의실 A",
        duration: "60분"
      },
      actions: [
        { type: "snooze", label: "5분 후 알림", value: 5 },
        { type: "dismiss", label: "확인" },
        { type: "postpone", label: "일정 연기" }
      ]
    }
  },

  // 알림 타입 및 설정
  notification_type: {
    category: "event_reminder",        // event_reminder, ai_suggestion, conflict_alert, daily_summary
    subcategory: "smart_reminder",     // smart_reminder, fixed_reminder, location_based
    priority: "high",                  // low, medium, high, urgent
    channel: ["push", "email"],        // push, email, sms, in_app
    personalized: true                 // AI 개인화 적용 여부
  },

  // 스케줄링 정보
  scheduling: {
    created_at: ISODate("..."),
    scheduled_for: ISODate("..."),
    optimal_send_time: ISODate("..."), // AI가 계산한 최적 전송 시간
    timezone: "Asia/Seoul",
    send_constraints: {
      respect_dnd: true,               // Do Not Disturb 시간 고려
      min_advance_notice: 5,           // 최소 사전 알림 시간 (분)
      max_advance_notice: 60           // 최대 사전 알림 시간 (분)
    }
  },

  // 전송 상태
  delivery: {
    status: "delivered",               // pending, sent, delivered, failed, expired
    attempts: [
      {
        channel: "push",
        attempted_at: ISODate("..."),
        status: "delivered",
        response_code: 200,
        device_token: "device_token_hash"
      }
    ],
    user_interaction: {
      opened: true,
      opened_at: ISODate("..."),
      action_taken: "dismiss",         // dismiss, snooze, postpone, complete
      response_time: 15                // 초 단위
    }
  },

  // AI 최적화 데이터
  ai_optimization: {
    send_time_reasoning: "사용자가 보통 이 시간에 알림을 확인함",
    effectiveness_score: 0.85,         // 0-1, 알림 효과성
    personalization_factors: [
      "historical_response_pattern",
      "current_location",
      "calendar_context"
    ],
    learning_outcome: {
      user_satisfaction: 4,            // 1-5
      timing_accuracy: true,
      content_relevance: true
    }
  },

  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

### 2.5 사용자 분석 컬렉션 (user_analytics)

```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  date: ISODate("2024-01-15T00:00:00Z"), // 날짜별 집계

  // 일정 통계
  event_statistics: {
    total_events: 8,
    completed_events: 6,
    cancelled_events: 1,
    postponed_events: 1,
    completion_rate: 0.75,

    by_category: {
      work: { total: 5, completed: 4, completion_rate: 0.8 },
      personal: { total: 2, completed: 2, completion_rate: 1.0 },
      health: { total: 1, completed: 0, completion_rate: 0.0 }
    },

    by_priority: {
      high: { total: 2, completed: 2, completion_rate: 1.0 },
      medium: { total: 4, completed: 3, completion_rate: 0.75 },
      low: { total: 2, completed: 1, completion_rate: 0.5 }
    },

    ai_priority_accuracy: {
      correct_predictions: 87,          // AI가 올바르게 예측한 중요도 개수
      total_predictions: 100,           // 전체 AI 예측 개수
      accuracy_rate: 0.87,              // 정확도
      user_overrides: 13                // 사용자가 수정한 횟수
    }
  },

  // 시간 분석
  time_analysis: {
    total_scheduled_time: 480,         // 분 단위
    actual_productive_time: 420,       // 분 단위
    efficiency_ratio: 0.875,           // 실제 시간 / 예정 시간

    time_distribution: {
      work: 300,                       // 분 단위
      personal: 60,
      health: 30,
      social: 30
    },

    peak_productivity_hours: ["09:00-11:00", "14:00-16:00"],
    low_energy_periods: ["13:00-14:00", "16:00-17:00"],

    meeting_statistics: {
      total_meetings: 3,
      average_duration: 65,            // 분
              overrun_rate: 0.33,              // 예정 시간 초과 비율
      satisfaction_avg: 3.7            // 1-5
    }
  },

  // 패턴 분석
  behavioral_patterns: {
    punctuality: {
      on_time_rate: 0.85,
      average_delay: 5,                // 분
      early_arrival_rate: 0.3
    },

    planning_behavior: {
      advance_planning_days: 3.5,      // 평균 사전 계획 일수
      last_minute_changes: 2,          // 당일 변경 횟수
      schedule_density: 0.7            // 시간 대비 일정 밀도
    },

    energy_management: {
      high_energy_utilization: 0.8,   // 고에너지 시간 활용도
      break_frequency: 4,              // 휴식 횟수
      focus_session_avg: 90            // 평균 집중 시간 (분)
    }
  },

  // AI 상호작용 분석
  ai_interaction: {
    total_queries: 12,
    successful_predictions: 10,
    accuracy_rate: 0.83,

    interaction_types: {
      event_creation: 6,
      schedule_query: 3,
      optimization_request: 2,
      general_assistance: 1
    },

    user_satisfaction: {
      average_rating: 4.2,             // 1-5
      suggestion_acceptance_rate: 0.75,
      correction_frequency: 0.15
    },

    learning_progress: {
      personalization_level: 0.8,     // 0-1
      preference_accuracy: 0.9,       // 0-1
      context_understanding: 0.85     // 0-1
    }
  },

  // 목표 추적
  goal_tracking: {
    weekly_targets: {
      work_hours_target: 40,
      actual_work_hours: 35,
      target_achievement: 0.875
    },

    productivity_goals: {
      meeting_efficiency_target: 0.8,
      actual_efficiency: 0.875,
      improvement_rate: 0.1            // 전주 대비
    },

    wellness_goals: {
      break_frequency_target: 6,
      actual_breaks: 4,
      exercise_time_target: 60,        // 분
      actual_exercise: 30
    }
  },

  // 인사이트 및 추천
  insights: {
    key_findings: [
      "오전 시간대 생산성이 가장 높음",
      "회의 시간이 자주 초과됨",
      "건강 관련 일정 완료율이 낮음"
    ],

    recommendations: [
      {
        type: "schedule_optimization",
        priority: "high",
        suggestion: "중요한 업무를 오전에 배치하세요",
        expected_improvement: 0.15
      },
      {
        type: "meeting_management",
        priority: "medium",
        suggestion: "회의 시간을 10% 여유있게 설정하세요",
        expected_improvement: 0.1
      }
    ],

    trend_analysis: {
      productivity_trend: "increasing",  // increasing, decreasing, stable
      stress_level_trend: "stable",
      work_life_balance: 0.7            // 0-1
    }
  },

  created_at: ISODate("..."),
  computed_at: ISODate("...")
}
```

---

## 3. 인덱스 설계

### 3.1 성능 최적화 인덱스

```javascript
// Users 컬렉션
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ 'device_tokens.token': 1 });
db.users.createIndex({ 'external_integrations.google_calendar.enabled': 1 });
db.users.createIndex({ 'subscription.plan': 1, 'subscription.expires_at': 1 });

// Events 컬렉션 - 복합 인덱스 전략
db.events.createIndex({ user_id: 1, 'timing.start_time': 1 });
db.events.createIndex({
  user_id: 1,
  'status.current': 1,
  'timing.start_time': 1,
});
db.events.createIndex({
  user_id: 1,
  'categorization.category': 1,
  'timing.start_time': 1,
});
db.events.createIndex({ 'timing.start_time': 1, 'timing.end_time': 1 }); // 시간 범위 검색
db.events.createIndex({ 'ai_metadata.generated_by_ai': 1, user_id: 1 });
db.events.createIndex({ 'location.coordinates': '2dsphere' }); // 지리 공간 인덱스
db.events.createIndex({ 'recurrence.enabled': 1, 'recurrence.pattern': 1 });

// 텍스트 검색 인덱스
db.events.createIndex(
  {
    title: 'text',
    description: 'text',
    'categorization.tags': 'text',
  },
  {
    weights: { title: 10, description: 5, 'categorization.tags': 1 },
  }
);

// Chat Messages 컬렉션
db.chat_messages.createIndex({ user_id: 1, 'message.timestamp': -1 });
db.chat_messages.createIndex({ conversation_id: 1, 'message.timestamp': 1 });
db.chat_messages.createIndex({ 'ai_processing.intent': 1, user_id: 1 });
db.chat_messages.createIndex({ 'feedback.rating': 1, user_id: 1 });

// Notifications 컬렉션
db.notifications.createIndex({ user_id: 1, 'scheduling.scheduled_for': 1 });
db.notifications.createIndex({
  'delivery.status': 1,
  'scheduling.scheduled_for': 1,
});
db.notifications.createIndex({ related_event_id: 1 });

// Analytics 컬렉션
db.user_analytics.createIndex({ user_id: 1, date: -1 }, { unique: true });
db.user_analytics.createIndex({ date: -1 }); // 전체 통계용
```

### 3.2 TTL 인덱스 (자동 데이터 정리)

```javascript
// 만료된 알림 자동 삭제 (90일)
db.notifications.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 7776000 }
);

// 오래된 채팅 메시지 자동 삭제 (1년)
db.chat_messages.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 31536000 }
);

// 임시 세션 데이터 자동 삭제 (7일)
db.temp_sessions.createIndex({ created_at: 1 }, { expireAfterSeconds: 604800 });
```

---

## 4. Redis 캐시 전략

### 4.1 캐시 키 구조

```javascript
// 사용자 세션
"session:user:{user_id}" → 세션 데이터 (TTL: 24시간)

// 이벤트 캐시
"events:user:{user_id}:range:{start_date}:{end_date}" → 이벤트 목록 (TTL: 1시간)
"event:detail:{event_id}" → 이벤트 상세 (TTL: 30분)

// AI 응답 캐시
"ai:response:{user_id}:{query_hash}" → AI 응답 (TTL: 1시간)
"ai:suggestions:{user_id}:{date}" → 일일 제안 (TTL: 6시간)

// 분석 데이터 캐시
"analytics:user:{user_id}:daily:{date}" → 일일 분석 (TTL: 12시간)
"analytics:user:{user_id}:weekly:{week}" → 주간 분석 (TTL: 24시간)

// 실시간 데이터
"realtime:conflicts:{user_id}" → 충돌 감지 결과 (TTL: 10분)
"realtime:notifications:{user_id}" → 대기 중 알림 (TTL: 1시간)
```

### 4.2 캐시 무효화 전략

```javascript
// 이벤트 변경 시
function invalidateEventCache(userId, eventId) {
  const patterns = [
    `events:user:${userId}:*`,
    `event:detail:${eventId}`,
    `analytics:user:${userId}:*`,
    `ai:suggestions:${userId}:*`,
  ];

  patterns.forEach(pattern => redis.del(pattern));
}

// 사용자 설정 변경 시
function invalidateUserCache(userId) {
  const patterns = [
    `session:user:${userId}`,
    `ai:*:${userId}:*`,
    `analytics:user:${userId}:*`,
  ];

  patterns.forEach(pattern => redis.del(pattern));
}
```

---

## 5. Vector Database 설계 (Pinecone)

### 5.1 벡터 인덱스 구조

```javascript
// 이벤트 임베딩 인덱스
{
  namespace: "events",
  dimension: 1536,  // OpenAI embedding dimension
  metric: "cosine",
  vectors: {
    id: "{user_id}_{event_id}",
    values: [0.1, 0.2, ...],  // 임베딩 벡터
    metadata: {
      user_id: "user123",
      event_id: "event456",
      category: "work",
      timestamp: "2024-01-15T14:00:00Z",
      title: "프로젝트 회의",
      description: "Q1 계획 검토...",
      location_type: "office",
      duration: 60,
      priority: "high"
    }
  }
}

// 사용자 패턴 임베딩
{
  namespace: "user_patterns",
  dimension: 1536,
  vectors: {
    id: "{user_id}_pattern_{type}",
    values: [0.3, 0.1, ...],
    metadata: {
      user_id: "user123",
      pattern_type: "productivity_cycle",
      peak_hours: ["09:00-11:00"],
      energy_level: "high",
      context: "morning_meetings"
    }
  }
}

// 선호도 임베딩
{
  namespace: "preferences",
  dimension: 1536,
  vectors: {
    id: "{user_id}_pref_{category}",
    values: [0.2, 0.4, ...],
    metadata: {
      user_id: "user123",
      preference_category: "meeting_style",
      preferred_duration: 60,
      preferred_time: "morning",
      location_preference: "office"
    }
  }
}
```

### 5.2 유사도 검색 쿼리

```javascript
// 유사한 이벤트 찾기
async function findSimilarEvents(eventEmbedding, userId, limit = 10) {
  return await pinecone.query({
    vector: eventEmbedding,
    filter: { user_id: userId },
    topK: limit,
    includeMetadata: true,
    namespace: 'events',
  });
}

// 개인화된 제안을 위한 패턴 매칭
async function findRelevantPatterns(queryEmbedding, userId) {
  return await pinecone.query({
    vector: queryEmbedding,
    filter: { user_id: userId },
    topK: 5,
    includeMetadata: true,
    namespace: 'user_patterns',
  });
}
```

---

## 6. 샤딩 및 파티셔닝 전략

### 6.1 MongoDB 샤딩

```javascript
// 사용자 기반 샤딩
sh.enableSharding('linq_db');

// Events 컬렉션 샤딩 (user_id 기반)
sh.shardCollection('linq_db.events', { user_id: 1, 'timing.start_time': 1 });

// Analytics 컬렉션 샤딩 (user_id + date 기반)
sh.shardCollection('linq_db.user_analytics', { user_id: 1, date: 1 });

// Chat 메시지 샤딩 (user_id + timestamp 기반)
sh.shardCollection('linq_db.chat_messages', {
  user_id: 1,
  'message.timestamp': 1,
});
```

### 6.2 시간 기반 파티셔닝

```javascript
// 이벤트 아카이빙 전략
{
  // 현재 이벤트 (과거 30일 + 미래 365일)
  collection: "events_current",
  partition_key: "timing.start_time",
  range: "2024-01-01 to 2025-01-01"
}

{
  // 과거 이벤트 아카이브 (30일 이전)
  collection: "events_archive_2023",
  partition_key: "timing.start_time",
  range: "2023-01-01 to 2023-12-31"
}
```

---

## 7. 백업 및 복구 전략

### 7.1 백업 스케줄

```yaml
# MongoDB 백업 설정
mongodb_backup:
  full_backup:
    schedule: '0 2 * * 0' # 매주 일요일 2AM
    retention: '4 weeks'

  incremental_backup:
    schedule: '0 2 * * 1-6' # 매일 2AM (일요일 제외)
    retention: '7 days'

  point_in_time_recovery:
    enabled: true
    retention: '72 hours'

# Redis 백업
redis_backup:
  rdb_snapshot:
    schedule: '0 */6 * * *' # 6시간마다
    retention: '24 hours'

  aof_rewrite:
    auto_aof_rewrite_percentage: 100
    auto_aof_rewrite_min_size: '64mb'
```

### 7.2 재해 복구 계획

```yaml
disaster_recovery:
  rto: '4 hours' # Recovery Time Objective
  rpo: '1 hour' # Recovery Point Objective

  backup_locations:
    primary: 'AWS S3 Seoul'
    secondary: 'AWS S3 Tokyo'

  recovery_procedures:
    - mongodb_restore
    - redis_restore
    - vector_db_restore
    - application_startup
    - data_validation
```

---

## 8. 보안 설계

### 8.1 데이터 암호화

```javascript
// 민감 데이터 필드 암호화
{
  encryption_fields: [
    "external_integrations.google_calendar.access_token",
    "external_integrations.google_calendar.refresh_token",
    "location.virtual_info.password",
    "participants.email",
    "ai_metadata.original_input"  // 개인정보 포함 가능
  ],

  encryption_method: "AES-256-GCM",
  key_rotation_period: "90 days"
}
```

### 8.2 접근 제어

```javascript
// MongoDB 사용자 권한
{
  users: [
    {
      user: "linq_app",
      pwd: "encrypted_password",
      roles: [
        { role: "readWrite", db: "linq_db" },
        { role: "dbAdmin", db: "linq_db" }
      ]
    },
    {
      user: "linq_analytics",
      pwd: "encrypted_password",
      roles: [
        { role: "read", db: "linq_db" }
      ]
    }
  ]
}

// 컬렉션 레벨 권한
{
  collection_permissions: {
    "users": ["linq_app"],
    "events": ["linq_app", "linq_analytics"],
    "chat_messages": ["linq_app"],
    "notifications": ["linq_app"],
    "user_analytics": ["linq_app", "linq_analytics"]
  }
}
```

---

## 9. 모니터링 및 알림

### 9.1 성능 모니터링 메트릭

```yaml
performance_monitoring:
  mongodb_metrics:
    - query_performance
    - index_usage
    - connection_pool_size
    - replication_lag
    - disk_usage
    - memory_usage

  redis_metrics:
    - hit_ratio
    - memory_usage
    - connection_count
    - command_stats

  vector_db_metrics:
    - query_latency
    - index_size
    - vector_count

  alerts:
    - query_time > 1000ms
    - disk_usage > 80%
    - memory_usage > 85%
    - replication_lag > 5s
```

### 9.2 데이터 품질 모니터링

```javascript
// 데이터 무결성 검사
{
  integrity_checks: [
    {
      name: 'orphaned_events',
      query: 'events without valid user_id',
      schedule: 'daily',
      action: 'alert_and_log',
    },
    {
      name: 'duplicate_notifications',
      query: 'duplicate notification entries',
      schedule: 'hourly',
      action: 'auto_cleanup',
    },
    {
      name: 'invalid_timestamps',
      query: 'events with end_time < start_time',
      schedule: 'real_time',
      action: 'immediate_alert',
    },
  ];
}
```

---

이 데이터베이스 설계는 LinQ의 AI 기반 일정 관리 서비스의 모든 요구사항을
충족하도록 정밀하게 설계되었습니다. 확장성, 성능, 보안을 모두 고려한
엔터프라이즈급 아키텍처를 제공합니다.

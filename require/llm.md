# LinQ LLM 시스템 명세서

## 1. LLM 아키텍처 개요

### 1.1 모델 선택: Solar Pro

**Upstage Solar Pro**를 주력 모델로 선택한 이유:

- **한국어 특화**: 한국어 자연어 처리 성능 우수
- **컨텍스트 이해**: 긴 문맥 처리 능력 (최대 128K 토큰)
- **함수 호출**: Function Calling 지원으로 일정 생성/수정 가능
- **비용 효율**: OpenAI 대비 합리적인 가격 정책
- **지연시간**: 한국 서버 위치로 낮은 레이턴시

### 1.2 하이브리드 모델 전략

```
Primary: Solar Pro (한국어 NLU/NLG)
    ↓
Fallback: GPT-4 (복잡한 추론)
    ↓
Specialized: Embedding Model (벡터 검색)
```

### 1.3 LangChain 아키텍처

```python
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Input Layer   │    │  Processing     │    │  Output Layer   │
│                 │    │     Chain       │    │                 │
│ - Text Input    │───▶│ - Intent        │───▶│ - Structured    │
│ - Voice Input   │    │ - Entity Extract│    │   Response      │
│ - Context       │    │ - Function Call │    │ - Event Object  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────┤   Memory &      ├──────────────┘
                       │   Vector Store   │
                       └─────────────────┘
```

---

## 2. 자연어 처리 파이프라인

### 2.1 입력 처리 체인

```python
# langchain_pipeline.py
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import AgentExecutor, Tool
from langchain.schema import BaseOutputParser

class ScheduleInputChain:
    def __init__(self):
        self.solar_llm = SolarProLLM(
            api_key=os.getenv("UPSTAGE_API_KEY"),
            model="solar-1-mini-chat",
            temperature=0.1,
            max_tokens=1024
        )

        self.memory = ConversationBufferWindowMemory(
            k=5,  # 최근 5개 대화 기억
            memory_key="chat_history",
            return_messages=True
        )

        self.chain = self._create_processing_chain()

    def _create_processing_chain(self):
        prompt = PromptTemplate(
            input_variables=["user_input", "current_context", "chat_history"],
            template="""
당신은 한국어 일정 관리 AI 어시스턴트입니다.
사용자의 자연어 입력을 분석하여 일정 정보를 추출하세요.

현재 컨텍스트:
- 현재 시간: {current_context[current_time]}
- 사용자 위치: {current_context[user_location]}
- 최근 일정: {current_context[recent_events]}

대화 기록:
{chat_history}

사용자 입력: {user_input}

다음 정보를 JSON 형태로 추출하세요:
1. intent: 의도 (create_event, modify_event, query_schedule, general_chat)
2. entities: 추출된 엔티티들
3. event_details: 일정 상세 정보 (해당시)
4. confidence: 신뢰도 (0-1)
5. response: 사용자에게 보여줄 응답

응답:
"""
        )

        return LLMChain(
            llm=self.solar_llm,
            prompt=prompt,
            memory=self.memory,
            verbose=True
        )
```

### 2.2 엔티티 추출 시스템

```python
class EntityExtractor:
    def __init__(self):
        self.extractors = {
            'datetime': DateTimeExtractor(),
            'location': LocationExtractor(),
            'person': PersonExtractor(),
            'duration': DurationExtractor(),
            'category': CategoryExtractor(),
            'priority': PriorityAnalyzer()
        }

    async def extract_entities(self, text: str, context: dict) -> dict:
        """한국어 텍스트에서 일정 관련 엔티티 추출"""

        # Solar Pro를 활용한 엔티티 추출
        extraction_prompt = f"""
다음 한국어 텍스트에서 일정 관련 정보를 추출하세요:

텍스트: "{text}"
현재 시간: {context.get('current_time')}
사용자 위치: {context.get('user_location')}

추출할 정보:
1. 시간 정보 (날짜, 시각, 기간)
2. 장소 정보 (구체적 주소, 장소명, 온라인 여부)
3. 참석자 정보 (이름, 역할)
4. 일정 제목/내용
5. 우선순위/중요도 (상/중/하 자동 분석)
6. 카테고리 (업무, 개인, 건강, 사교, 여행)

JSON 형태로 응답하세요:
{{
    "datetime": {{
        "start_time": "ISO 8601 형식",
        "end_time": "ISO 8601 형식",
        "is_all_day": boolean,
        "timezone": "Asia/Seoul"
    }},
    "location": {{
        "type": "physical|virtual|hybrid",
        "address": "주소",
        "name": "장소명",
        "coordinates": {{"lat": 0, "lng": 0}}
    }},
    "title": "일정 제목",
    "description": "상세 설명",
    "category": "WORK|PERSONAL|HEALTH|SOCIAL|TRAVEL",
    "priority": "LOW|MEDIUM|HIGH",
    "ai_priority_score": 0.75,
    "priority_reasoning": "업무 관련 회의로 참석자가 많아 중요도 높음",
    "participants": [
        {{"name": "참석자명", "role": "organizer|required|optional"}}
    ],
    "confidence": 0.95
}}
"""

        response = await self.solar_llm.agenerate([extraction_prompt])
        return self._parse_extraction_response(response.generations[0][0].text)

    async def _analyze_priority(self, event_data: dict, context: dict) -> dict:
        """AI 기반 중요도 자동 분석"""

        priority_prompt = f"""
다음 일정의 중요도를 분석하여 상/중/하로 분류하세요:

일정 정보:
- 제목: {event_data.get('title', '')}
- 내용: {event_data.get('description', '')}
- 카테고리: {event_data.get('category', '')}
- 참석자: {event_data.get('participants', [])}
- 시간: {event_data.get('datetime', {})}

사용자 컨텍스트:
- 현재 시간: {context.get('current_time')}
- 최근 일정: {context.get('recent_events', [])}
- 사용자 선호도: {context.get('user_preferences', {})}

중요도 판단 기준:
1. 상(HIGH):
   - 중요한 비즈니스 미팅, 발표, 면접
   - 의료 예약, 법적 의무사항
   - 데드라인이 있는 중요 업무
   - 다수 참석자가 있는 회의

2. 중(MEDIUM):
   - 일반 업무 미팅, 정기 회의
   - 개인 약속, 사교 모임
   - 학습/교육 관련 일정
   - 루틴한 업무

3. 하(LOW):
   - 개인 여가 활동
   - 선택적 참석 이벤트
   - 유연하게 조정 가능한 일정
   - 취미/오락 활동

결과를 JSON 형태로 응답:
{{
    "priority": "HIGH|MEDIUM|LOW",
    "confidence_score": 0.85,
    "reasoning": "판단 근거 설명",
    "key_factors": ["중요도에 영향을 준 주요 요소들"]
}}
"""

        response = await self.solar_llm.agenerate([priority_prompt])
        return json.loads(response.generations[0][0].text)
```

### 2.3 의도 분류 시스템

```python
class IntentClassifier:
    def __init__(self):
        self.intent_chain = self._create_intent_chain()

    def _create_intent_chain(self):
        intent_prompt = PromptTemplate(
            input_variables=["user_input", "context"],
            template="""
사용자의 한국어 입력을 분석하여 의도를 분류하세요.

가능한 의도:
1. CREATE_EVENT: 새로운 일정 생성
   - 예: "내일 2시에 회의 잡아줘", "다음주 치과 예약"

2. MODIFY_EVENT: 기존 일정 수정
   - 예: "회의 시간 3시로 바꿔줘", "내일 약속 취소해줘"

3. QUERY_SCHEDULE: 일정 조회
   - 예: "내일 일정 뭐야?", "이번주 회의 몇 개야?"

4. SUGGEST_OPTIMIZATION: 일정 최적화 요청
   - 예: "일정 정리해줘", "시간 좀 효율적으로 배치해줘"

5. CONFLICT_RESOLUTION: 충돌 해결
   - 예: "겹치는 일정 어떻게 하지?", "시간 조정해줘"

6. GENERAL_CHAT: 일반 대화
   - 예: "안녕", "고마워", "도움말"

사용자 입력: "{user_input}"
컨텍스트: {context}

분석 결과를 JSON으로 응답:
{{
    "intent": "의도 분류",
    "confidence": 0.95,
    "sub_intent": "세부 의도 (선택적)",
    "entities_needed": ["필요한 추가 정보"],
    "reasoning": "분류 근거"
}}
"""
        )

        return LLMChain(
            llm=self.solar_llm,
            prompt=intent_prompt,
            verbose=True
        )
```

---

## 3. AI 에이전트 시스템

### 3.1 다중 에이전트 아키텍처

```python
class LinQAgentSystem:
    def __init__(self):
        self.agents = {
            'scheduler': SchedulerAgent(),      # 일정 생성/관리
            'optimizer': OptimizerAgent(),      # 일정 최적화
            'analyzer': AnalyzerAgent(),        # 패턴 분석
            'assistant': AssistantAgent()       # 일반 대화
        }

        self.router = AgentRouter()
        self.coordinator = AgentCoordinator()

    async def process_request(self, user_input: str, context: dict):
        # 1. 의도 파악 및 에이전트 라우팅
        intent = await self.router.classify_intent(user_input, context)

        # 2. 적절한 에이전트 선택
        primary_agent = self.agents[intent.primary_agent]

        # 3. 에이전트 실행
        response = await primary_agent.execute(user_input, context)

        # 4. 필요시 다른 에이전트와 협업
        if response.needs_collaboration:
            response = await self.coordinator.collaborate(
                primary_agent,
                response,
                context
            )

        return response
```

### 3.2 스케줄러 에이전트

```python
class SchedulerAgent:
    def __init__(self):
        self.tools = [
            Tool(
                name="create_event",
                description="새로운 일정을 생성합니다",
                func=self._create_event
            ),
            Tool(
                name="modify_event",
                description="기존 일정을 수정합니다",
                func=self._modify_event
            ),
            Tool(
                name="check_conflicts",
                description="일정 충돌을 확인합니다",
                func=self._check_conflicts
            ),
            Tool(
                name="suggest_time",
                description="최적의 시간을 제안합니다",
                func=self._suggest_optimal_time
            )
        ]

        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.solar_llm,
            agent=AgentType.OPENAI_FUNCTIONS,
            verbose=True,
            memory=self.memory
        )

    async def _create_event(self, event_data: str) -> str:
        """일정 생성 도구 함수"""
        try:
            # 1. 입력 데이터 파싱
            parsed_data = json.loads(event_data)

            # 2. 충돌 검사
            conflicts = await self._check_conflicts(parsed_data)

            if conflicts:
                # 3. 충돌 해결 제안
                suggestions = await self._generate_conflict_resolutions(
                    parsed_data, conflicts
                )
                return f"일정 충돌이 감지되었습니다. 제안사항: {suggestions}"

            # 4. 일정 생성
            event = await self.event_service.create_event(parsed_data)

            # 5. 스마트 알림 설정
            await self.notification_service.schedule_smart_reminders(event)

            return f"일정이 성공적으로 생성되었습니다: {event.title}"

        except Exception as e:
            return f"일정 생성 중 오류가 발생했습니다: {str(e)}"

    async def _suggest_optimal_time(self, requirements: str) -> str:
        """최적 시간 제안"""

        suggestion_prompt = f"""
사용자의 요구사항을 분석하여 최적의 일정 시간을 제안하세요.

요구사항: {requirements}
사용자 패턴: {await self._get_user_patterns()}
기존 일정: {await self._get_existing_schedule()}
선호도: {await self._get_user_preferences()}

고려사항:
1. 사용자의 생산성 패턴 (피크 시간대)
2. 기존 일정과의 충돌 방지
3. 이동 시간 고려
4. 휴식 시간 확보
5. 에너지 레벨 최적화

3가지 시간대를 추천하고 각각의 장단점을 설명하세요.
"""

        response = await self.solar_llm.agenerate([suggestion_prompt])
        return response.generations[0][0].text
```

### 3.3 최적화 에이전트

```python
class OptimizerAgent:
    def __init__(self):
        self.optimization_tools = [
            Tool(
                name="analyze_schedule_efficiency",
                description="일정 효율성을 분석합니다",
                func=self._analyze_efficiency
            ),
            Tool(
                name="suggest_reorganization",
                description="일정 재구성을 제안합니다",
                func=self._suggest_reorganization
            ),
            Tool(
                name="optimize_travel_time",
                description="이동 시간을 최적화합니다",
                func=self._optimize_travel
            )
        ]

    async def _suggest_reorganization(self, schedule_data: str) -> str:
        """일정 재구성 제안"""

        optimization_prompt = f"""
다음 일정을 분석하여 최적화 방안을 제안하세요:

현재 일정: {schedule_data}
사용자 패턴: {await self._get_productivity_patterns()}

최적화 기준:
1. 생산성 극대화
2. 이동 시간 최소화
3. 에너지 효율성
4. 휴식 시간 확보
5. 우선순위 고려

구체적인 재구성 방안을 제시하고, 예상되는 개선 효과를 설명하세요.
변경이 필요한 일정과 그 이유를 명시하세요.
"""

                 response = await self.solar_llm.agenerate([optimization_prompt])
         return response.generations[0][0].text
```

### 3.4 중요도 분석 에이전트

```python
class PriorityAnalysisAgent:
    def __init__(self):
        self.priority_model = SolarProLLM(
            model="solar-1-mini-chat",
            temperature=0.1  # 일관성 있는 분석을 위해 낮은 온도
        )

        self.priority_factors = {
            'deadline_urgency': 0.25,      # 마감일 임박도
            'participant_importance': 0.20, # 참석자 중요도
            'business_impact': 0.20,       # 업무 영향도
            'category_weight': 0.15,       # 카테고리별 가중치
            'user_history': 0.10,          # 사용자 과거 패턴
            'time_conflict': 0.10          # 시간 충돌 정도
        }

    async def analyze_priority(self, event_data: dict, context: dict) -> dict:
        """종합적인 중요도 분석"""

        # 1. 개별 요소 분석
        factor_scores = await self._analyze_individual_factors(event_data, context)

        # 2. 가중 평균 계산
        weighted_score = sum(
            factor_scores[factor] * weight
            for factor, weight in self.priority_factors.items()
        )

        # 3. 점수를 상/중/하로 변환
        priority_level = self._score_to_priority(weighted_score)

        # 4. 설명 생성
        reasoning = await self._generate_reasoning(factor_scores, priority_level)

        return {
            'priority': priority_level,
            'confidence': self._calculate_confidence(factor_scores),
            'reasoning': reasoning,
            'factor_breakdown': factor_scores,
            'weighted_score': weighted_score
        }

    def _score_to_priority(self, score: float) -> str:
        """점수를 우선순위로 변환"""
        if score >= 0.7:
            return 'HIGH'
        elif score >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'

    async def _analyze_individual_factors(self, event_data: dict, context: dict) -> dict:
        """개별 요소 분석"""

        analysis_prompt = f"""
다음 일정의 각 요소를 0-1 점수로 분석하세요:

일정 정보: {event_data}
컨텍스트: {context}

분석 요소:
1. deadline_urgency: 마감일이나 시간의 긴급성
2. participant_importance: 참석자의 중요도
3. business_impact: 업무나 개인 생활에 미치는 영향
4. category_weight: 카테고리별 일반적 중요도
5. user_history: 사용자의 과거 유사 일정 패턴
6. time_conflict: 다른 일정과의 충돌 가능성

JSON 형태로 응답:
{{
    "deadline_urgency": 0.8,
    "participant_importance": 0.6,
    "business_impact": 0.9,
    "category_weight": 0.7,
    "user_history": 0.5,
    "time_conflict": 0.3,
    "analysis_notes": "각 점수의 근거"
}}
"""

        response = await self.priority_model.agenerate([analysis_prompt])
        return json.loads(response.generations[0][0].text)

    async def learn_from_user_feedback(self, event_id: str, user_correction: str):
        """사용자 피드백을 통한 학습"""

        # 사용자가 중요도를 수정한 경우 학습
        feedback_data = {
            'event_id': event_id,
            'original_analysis': await self._get_original_analysis(event_id),
            'user_correction': user_correction,
            'timestamp': datetime.now()
        }

        # 학습 데이터로 저장하여 향후 분석 개선
        await self._update_learning_model(feedback_data)
```

---

## 4. 프롬프트 엔지니어링

### 4.1 시스템 프롬프트 설계

```python
SYSTEM_PROMPTS = {
    "scheduler": """
당신은 LinQ의 전문 일정 관리 AI입니다.

역할과 책임:
- 한국어 자연어 입력을 정확히 이해하고 일정으로 변환
- 사용자의 패턴과 선호도를 학습하여 개인화된 제안
- 일정 충돌을 미리 감지하고 해결책 제시
- 효율적인 시간 관리를 위한 조언 제공

응답 원칙:
1. 정확성: 시간, 장소, 참석자 정보를 정확히 파악
2. 개인화: 사용자의 과거 패턴과 선호도 반영
3. 능동성: 잠재적 문제를 미리 파악하고 해결책 제시
4. 친근함: 자연스럽고 도움이 되는 톤으로 소통

제약사항:
- 개인정보는 절대 외부 유출 금지
- 확실하지 않은 정보는 사용자에게 확인 요청
- 의료/법률 조언은 제공하지 않음
""",

    "optimizer": """
당신은 일정 최적화 전문 AI입니다.

최적화 목표:
1. 생산성 극대화
2. 스트레스 최소화
3. 일과 삶의 균형
4. 에너지 효율성

분석 요소:
- 시간대별 생산성 패턴
- 이동 경로 최적화
- 휴식 시간 배분
- 업무 유형별 집중도
- 개인적 선호도

제안 형식:
- 구체적이고 실행 가능한 방안
- 변경으로 인한 예상 효과
- 단계별 실행 계획
""",

    "analyzer": """
당신은 사용자 행동 패턴 분석 전문가입니다.

분석 영역:
1. 시간 사용 패턴
2. 생산성 사이클
3. 스트레스 요인
4. 목표 달성도
5. 습관 형성

인사이트 생성:
- 데이터 기반의 객관적 분석
- 실행 가능한 개선 방안
- 장기적 발전 계획
- 동기부여 요소 포함

보고 원칙:
- 긍정적이고 건설적인 피드백
- 구체적인 수치와 근거 제시
- 점진적 개선 중심
"""
}
```

### 4.2 Few-Shot 프롬프트 템플릿

```python
FEW_SHOT_EXAMPLES = {
    "event_creation": [
        {
            "input": "내일 오후 3시에 김과장님과 프로젝트 회의",
            "output": {
                "intent": "CREATE_EVENT",
                "title": "프로젝트 회의",
                "start_time": "2024-01-16T15:00:00+09:00",
                "participants": [{"name": "김과장", "role": "required"}],
                "category": "WORK",
                "confidence": 0.95
            }
        },
        {
            "input": "다음주 화요일 저녁에 친구들과 저녁식사",
            "output": {
                "intent": "CREATE_EVENT",
                "title": "친구들과 저녁식사",
                "start_time": "2024-01-23T18:00:00+09:00",
                "category": "SOCIAL",
                "confidence": 0.88
            }
        }
    ],

    "schedule_optimization": [
        {
            "input": "오늘 일정이 너무 빡빡해서 정리해줘",
            "analysis": "3시간 연속 회의, 이동시간 미고려, 점심시간 없음",
            "suggestions": [
                "회의 사이 15분 휴식 추가",
                "점심시간 1시간 확보",
                "화상회의로 이동시간 단축"
            ]
        }
    ]
}
```

### 4.3 컨텍스트 관리

```python
class ContextManager:
    def __init__(self):
        self.context_window = 4096  # Solar Pro 컨텍스트 윈도우
        self.context_cache = {}

    def build_context(self, user_id: str, current_input: str) -> dict:
        """동적 컨텍스트 구성"""

        context = {
            "current_time": datetime.now().isoformat(),
            "user_timezone": self._get_user_timezone(user_id),
            "recent_events": self._get_recent_events(user_id, days=7),
            "user_patterns": self._get_user_patterns(user_id),
            "preferences": self._get_user_preferences(user_id),
            "conversation_history": self._get_conversation_history(user_id),
            "location_context": self._get_location_context(user_id)
        }

        # 컨텍스트 크기 최적화
        optimized_context = self._optimize_context_size(context)

        return optimized_context

    def _optimize_context_size(self, context: dict) -> dict:
        """컨텍스트 크기를 모델 한계에 맞게 최적화"""

        # 우선순위 기반 컨텍스트 압축
        priority_order = [
            "current_time",
            "user_timezone",
            "recent_events",
            "conversation_history",
            "user_patterns",
            "preferences",
            "location_context"
        ]

        optimized = {}
        token_count = 0

        for key in priority_order:
            item_tokens = self._estimate_tokens(context[key])
            if token_count + item_tokens < self.context_window * 0.7:  # 70% 활용
                optimized[key] = context[key]
                token_count += item_tokens
            else:
                # 중요한 정보만 요약해서 포함
                optimized[key] = self._summarize_context_item(context[key])
                break

        return optimized
```

---

## 5. 학습 및 개인화

### 5.1 사용자 피드백 학습

```python
class FeedbackLearningSystem:
    def __init__(self):
        self.feedback_processor = FeedbackProcessor()
        self.pattern_updater = PatternUpdater()
        self.preference_learner = PreferenceLearner()

    async def process_feedback(self, user_id: str, feedback_data: dict):
        """사용자 피드백을 통한 학습"""

        feedback_analysis_prompt = f"""
다음 사용자 피드백을 분석하여 학습 포인트를 추출하세요:

원본 요청: {feedback_data['original_request']}
AI 응답: {feedback_data['ai_response']}
사용자 피드백: {feedback_data['user_feedback']}
만족도: {feedback_data['satisfaction_score']}/5
수정 사항: {feedback_data['corrections']}

분석할 영역:
1. 자연어 이해 정확도
2. 시간 해석 정확도
3. 선호도 파악 정확도
4. 컨텍스트 활용도
5. 응답 품질

학습 방향을 JSON 형태로 제시:
{{
    "understanding_errors": ["오해한 부분들"],
    "preference_updates": {{"새로 학습된 선호도"}},
    "pattern_insights": ["발견된 패턴"],
    "improvement_areas": ["개선이 필요한 영역"]
}}
"""

        analysis = await self.solar_llm.agenerate([feedback_analysis_prompt])
        learning_points = json.loads(analysis.generations[0][0].text)

        # 학습 내용을 사용자 프로필에 반영
        await self._update_user_profile(user_id, learning_points)

        # 벡터 데이터베이스 업데이트
        await self._update_embeddings(user_id, learning_points)
```

### 5.2 개인화 프롬프트 생성

```python
class PersonalizedPromptGenerator:
    def __init__(self):
        self.user_profiles = {}

    def generate_personalized_prompt(self, user_id: str, base_prompt: str) -> str:
        """사용자별 개인화된 프롬프트 생성"""

        user_profile = self._get_user_profile(user_id)

        personalization_layer = f"""
사용자 개인화 정보:
- 선호 시간대: {user_profile.get('preferred_times', [])}
- 생산성 패턴: {user_profile.get('productivity_pattern', 'unknown')}
- 업무 스타일: {user_profile.get('work_style', 'unknown')}
- 위치 선호: {user_profile.get('location_preferences', [])}
- 알림 스타일: {user_profile.get('notification_style', 'standard')}
- 과거 피드백: {user_profile.get('recent_feedback', [])}

이 정보를 바탕으로 사용자에게 최적화된 응답을 제공하세요.
"""

        return f"{base_prompt}\n\n{personalization_layer}"
```

### 5.3 실시간 학습 파이프라인

```python
class RealTimeLearningPipeline:
    def __init__(self):
        self.learning_queue = asyncio.Queue()
        self.batch_processor = BatchProcessor()

    async def continuous_learning(self):
        """실시간 지속 학습"""

        while True:
            try:
                # 배치 학습 데이터 수집
                batch_data = []
                for _ in range(10):  # 10개씩 배치 처리
                    if not self.learning_queue.empty():
                        batch_data.append(await self.learning_queue.get())

                if batch_data:
                    # 배치 분석
                    insights = await self._analyze_batch(batch_data)

                    # 글로벌 패턴 업데이트
                    await self._update_global_patterns(insights)

                    # 개별 사용자 프로필 업데이트
                    await self._update_individual_profiles(batch_data)

                await asyncio.sleep(300)  # 5분마다 실행

            except Exception as e:
                logger.error(f"Learning pipeline error: {e}")
                await asyncio.sleep(60)
```

---

## 6. 성능 최적화

### 6.1 응답 시간 최적화

```python
class ResponseOptimizer:
    def __init__(self):
        self.cache_manager = CacheManager()
        self.streaming_enabled = True

    async def optimize_response(self, query: str, context: dict) -> str:
        """응답 속도 최적화"""

        # 1. 캐시 확인
        cache_key = self._generate_cache_key(query, context)
        cached_response = await self.cache_manager.get(cache_key)

        if cached_response and cached_response['confidence'] > 0.9:
            return cached_response['response']

        # 2. 스트리밍 응답
        if self.streaming_enabled:
            return await self._stream_response(query, context)

        # 3. 일반 응답
        return await self._generate_response(query, context)

    async def _stream_response(self, query: str, context: dict):
        """스트리밍 방식 응답 생성"""

        async def response_generator():
            prompt = self._build_prompt(query, context)

            async for chunk in self.solar_llm.astream(prompt):
                yield chunk.content

        return response_generator()
```

### 6.2 토큰 사용량 최적화

```python
class TokenOptimizer:
    def __init__(self):
        self.token_limits = {
            'solar-pro': 128000,
            'solar-mini': 32000
        }

    def optimize_prompt(self, prompt: str, model: str) -> str:
        """프롬프트 토큰 최적화"""

        current_tokens = self._count_tokens(prompt)
        limit = self.token_limits.get(model, 32000)

        if current_tokens <= limit * 0.8:  # 80% 이하 사용
            return prompt

        # 프롬프트 압축
        compressed = self._compress_prompt(prompt, limit * 0.7)
        return compressed

    def _compress_prompt(self, prompt: str, target_tokens: int) -> str:
        """프롬프트 지능형 압축"""

        compression_prompt = f"""
다음 프롬프트를 {target_tokens} 토큰 이하로 압축하되, 핵심 정보는 유지하세요:

원본 프롬프트:
{prompt}

압축 원칙:
1. 핵심 지시사항 유지
2. 중복 정보 제거
3. 불필요한 예시 축소
4. 요약 및 압축
"""

        # Solar Pro로 압축 수행
        response = self.solar_llm.generate([compression_prompt])
        return response.generations[0][0].text
```

### 6.3 모델 선택 전략

```python
class ModelSelector:
    def __init__(self):
        self.models = {
            'solar-pro': {
                'cost': 0.1,
                'speed': 'medium',
                'capability': 'high',
                'context_window': 128000
            },
            'solar-mini': {
                'cost': 0.05,
                'speed': 'fast',
                'capability': 'medium',
                'context_window': 32000
            },
            'gpt-4': {
                'cost': 0.3,
                'speed': 'slow',
                'capability': 'highest',
                'context_window': 128000
            }
        }

    def select_optimal_model(self, task_type: str, complexity: float, urgency: str) -> str:
        """작업 특성에 따른 최적 모델 선택"""

        if task_type == 'simple_scheduling' and complexity < 0.5:
            return 'solar-mini'
        elif task_type == 'complex_optimization' and complexity > 0.8:
            return 'gpt-4'
        else:
            return 'solar-pro'  # 기본 모델
```

---

## 7. 품질 보증 및 모니터링

### 7.1 응답 품질 평가

```python
class QualityAssurance:
    def __init__(self):
        self.evaluators = {
            'accuracy': AccuracyEvaluator(),
            'relevance': RelevanceEvaluator(),
            'safety': SafetyEvaluator(),
            'coherence': CoherenceEvaluator()
        }

    async def evaluate_response(self, query: str, response: str, context: dict) -> dict:
        """응답 품질 종합 평가"""

        evaluation_results = {}

        for metric, evaluator in self.evaluators.items():
            score = await evaluator.evaluate(query, response, context)
            evaluation_results[metric] = score

        # 종합 품질 점수 계산
        overall_score = self._calculate_overall_score(evaluation_results)

        return {
            'individual_scores': evaluation_results,
            'overall_score': overall_score,
            'quality_level': self._get_quality_level(overall_score)
        }

    def _calculate_overall_score(self, scores: dict) -> float:
        """가중 평균으로 종합 점수 계산"""
        weights = {
            'accuracy': 0.4,
            'relevance': 0.3,
            'safety': 0.2,
            'coherence': 0.1
        }

        return sum(scores[metric] * weight for metric, weight in weights.items())
```

### 7.2 실시간 모니터링

```python
class LLMMonitoring:
    def __init__(self):
        self.metrics_collector = MetricsCollector()
        self.alert_manager = AlertManager()

    async def monitor_performance(self):
        """LLM 성능 실시간 모니터링"""

        while True:
            try:
                # 성능 메트릭 수집
                metrics = await self._collect_metrics()

                # 임계값 확인
                alerts = self._check_thresholds(metrics)

                if alerts:
                    await self.alert_manager.send_alerts(alerts)

                # 메트릭 저장
                await self._store_metrics(metrics)

                await asyncio.sleep(60)  # 1분마다 모니터링

            except Exception as e:
                logger.error(f"Monitoring error: {e}")

    async def _collect_metrics(self) -> dict:
        """성능 메트릭 수집"""

        return {
            'response_time': await self._get_avg_response_time(),
            'success_rate': await self._get_success_rate(),
            'user_satisfaction': await self._get_satisfaction_score(),
            'token_usage': await self._get_token_usage(),
            'error_rate': await self._get_error_rate(),
            'cache_hit_rate': await self._get_cache_hit_rate()
        }
```

### 7.3 A/B 테스트 시스템

```python
class ABTestManager:
    def __init__(self):
        self.experiments = {}
        self.traffic_splitter = TrafficSplitter()

    def create_experiment(self, name: str, variants: dict, traffic_split: dict):
        """A/B 테스트 실험 생성"""

        self.experiments[name] = {
            'variants': variants,
            'traffic_split': traffic_split,
            'metrics': {},
            'start_time': datetime.now(),
            'status': 'active'
        }

    async def get_variant_for_user(self, experiment_name: str, user_id: str) -> str:
        """사용자별 실험 변형 할당"""

        if experiment_name not in self.experiments:
            return 'control'

        experiment = self.experiments[experiment_name]

        # 일관된 할당을 위한 해시 기반 분할
        user_hash = hash(f"{experiment_name}_{user_id}") % 100

        cumulative = 0
        for variant, percentage in experiment['traffic_split'].items():
            cumulative += percentage
            if user_hash < cumulative:
                return variant

        return 'control'
```

---

## 8. 보안 및 개인정보 보호

### 8.1 데이터 마스킹

```python
class DataMasking:
    def __init__(self):
        self.sensitive_patterns = [
            (r'[\w\.-]+@[\w\.-]+\.\w+', 'EMAIL'),  # 이메일
            (r'\d{3}-\d{4}-\d{4}', 'PHONE'),       # 전화번호
            (r'\d{6}-\d{7}', 'SSN'),               # 주민번호
        ]

    def mask_sensitive_data(self, text: str) -> tuple[str, dict]:
        """민감 정보 마스킹"""

        masked_text = text
        mapping = {}

        for pattern, data_type in self.sensitive_patterns:
            matches = re.finditer(pattern, text)
            for i, match in enumerate(matches):
                original = match.group()
                placeholder = f"[{data_type}_{i}]"

                masked_text = masked_text.replace(original, placeholder)
                mapping[placeholder] = original

        return masked_text, mapping

    def unmask_response(self, response: str, mapping: dict) -> str:
        """응답에서 마스킹 해제"""

        unmasked_response = response
        for placeholder, original in mapping.items():
            unmasked_response = unmasked_response.replace(placeholder, original)

        return unmasked_response
```

### 8.2 프라이버시 보호

```python
class PrivacyProtector:
    def __init__(self):
        self.anonymizer = DataAnonymizer()
        self.encryptor = DataEncryptor()

    async def protect_user_data(self, user_data: dict) -> dict:
        """사용자 데이터 프라이버시 보호"""

        # 1. 개인식별정보 익명화
        anonymized_data = self.anonymizer.anonymize(user_data)

        # 2. 민감 정보 암호화
        encrypted_data = self.encryptor.encrypt_sensitive_fields(anonymized_data)

        # 3. 데이터 최소화
        minimized_data = self._minimize_data(encrypted_data)

        return minimized_data

    def _minimize_data(self, data: dict) -> dict:
        """필요한 데이터만 유지"""

        essential_fields = [
            'user_patterns',
            'preferences',
            'schedule_context',
            'anonymized_history'
        ]

        return {k: v for k, v in data.items() if k in essential_fields}
```

---

## 9. 배포 및 운영

### 9.1 모델 버전 관리

```python
class ModelVersionManager:
    def __init__(self):
        self.versions = {}
        self.deployment_manager = DeploymentManager()

    async def deploy_new_version(self, version: str, model_config: dict):
        """새 모델 버전 배포"""

        # 1. 카나리 배포 (5% 트래픽)
        await self.deployment_manager.deploy_canary(version, model_config, 0.05)

        # 2. 성능 모니터링 (24시간)
        monitoring_results = await self._monitor_canary(version, hours=24)

        # 3. 성능 임계값 확인
        if monitoring_results['success_rate'] > 0.95:
            # 점진적 트래픽 증가
            await self._gradual_rollout(version)
        else:
            # 롤백
            await self.deployment_manager.rollback(version)
```

### 9.2 설정 관리

```yaml
# llm_config.yaml
models:
  solar_pro:
    endpoint: 'https://api.upstage.ai/v1'
    model_name: 'solar-1-mini-chat'
    max_tokens: 1024
    temperature: 0.1
    timeout: 30
    retry_count: 3

  fallback:
    endpoint: 'https://api.openai.com/v1'
    model_name: 'gpt-4-1106-preview'
    max_tokens: 2048
    temperature: 0.2

performance:
  cache_ttl: 3600 # 1시간
  max_concurrent_requests: 100
  rate_limit: 1000 # requests per minute

monitoring:
  metrics_interval: 60 # seconds
  alert_thresholds:
    response_time: 5000 # ms
    error_rate: 0.05 # 5%
    satisfaction_score: 0.8

privacy:
  data_retention_days: 90
  anonymization_enabled: true
  encryption_enabled: true
```

---

이 LLM 명세서는 Solar Pro 모델과 LangChain을 활용하여 LinQ의 AI 기능을 구현하기
위한 완전한 가이드라인을 제공합니다. 한국어 특화 모델의 장점을 최대한
활용하면서도 확장성과 안정성을 보장하는 아키텍처를 설계했습니다.

# LinQ - AI 기반 스마트 일정 관리 서비스

## 개발 환경 설정

### ESLint & Prettier

이 프로젝트는 코드 품질 및 일관성을 위해 ESLint와 Prettier가 설정되어 있습니다.

#### 설치된 패키지

- **ESLint**: 코드 품질 및 규칙 검사
- **Prettier**: 코드 포맷팅
- **TypeScript ESLint**: TypeScript 지원
- **React ESLint**: React 규칙
- **React Hooks ESLint**: React Hooks 규칙

#### 사용 가능한 명령어

```bash
# 린팅 체크 (오류만 확인)
npm run lint

# 린팅 체크 + 자동 수정
npm run lint:fix

# 린팅 체크 (경고 포함, CI용)
npm run lint:check

# 코드 포맷팅
npm run format

# 포맷팅 체크 (CI용)
npm run format:check

# TypeScript 타입 체크
npm run type-check

# 모든 품질 검사 실행 (수정 + 포맷팅 + 타입체크)
npm run quality

# 커밋 전 검사 (모든 규칙 통과 필요)
npm run pre-commit
```

#### VS Code 설정

이 프로젝트는 VS Code에서 자동 포맷팅과 린팅이 설정되어 있습니다:

- **파일 저장 시 자동 포맷팅**
- **붙여넣기 시 자동 포맷팅**
- **ESLint 자동 수정**
- **Import 자동 정리**

#### 권장 VS Code 확장 프로그램

`.vscode/extensions.json`에 다음 확장 프로그램들이 권장으로 설정되어 있습니다:

- ESLint
- Prettier - Code formatter
- TypeScript Importer
- Auto Rename Tag
- Path Intellisense
- vscode-icons
- Expo Tools

#### 규칙 설정

- **코드 스타일**: Prettier 기본 설정 + 커스텀 규칙
- **들여쓰기**: 2 스페이스
- **따옴표**: 단일 따옴표 사용
- **세미콜론**: 필수
- **줄 길이**: 최대 100자
- **JSX**: 단일 따옴표 사용

#### 개발 워크플로우

1. **개발 중**: VS Code에서 자동으로 포맷팅 및 린팅
2. **커밋 전**: `npm run pre-commit` 실행
3. **CI/CD**: `npm run lint:check`와 `npm run format:check` 실행

#### 수동 코드 정리

만약 VS Code를 사용하지 않거나 수동으로 코드를 정리하고 싶다면:

```bash
# 모든 코드 품질 이슈 한번에 해결
npm run quality
```

이 명령어는 다음을 순서대로 실행합니다:

1. ESLint로 자동 수정 가능한 문제들 수정
2. Prettier로 코드 포맷팅
3. TypeScript 타입 체크

## 프로젝트 구조

```
LinQ/
├── app/                    # Expo Router 페이지
├── src/
│   ├── components/         # 재사용 가능한 컴포넌트
│   ├── constants/          # 상수 (색상, 디자인 등)
│   ├── contexts/           # React Context
│   └── types/              # TypeScript 타입 정의
├── assets/                 # 정적 자산
├── .vscode/               # VS Code 워크스페이스 설정
├── eslint.config.js       # ESLint 설정
├── .prettierrc.js         # Prettier 설정
└── .prettierignore        # Prettier 무시 파일
```

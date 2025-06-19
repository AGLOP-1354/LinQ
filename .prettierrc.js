module.exports = {
  // 기본 설정
  semi: true, // 세미콜론 사용
  singleQuote: true, // 단일 따옴표 사용
  quoteProps: 'as-needed', // 필요한 경우에만 객체 키에 따옴표
  trailingComma: 'es5', // ES5 호환 trailing comma

  // 들여쓰기 및 공백
  tabWidth: 2, // 탭 너비 2 스페이스
  useTabs: false, // 스페이스 사용, 탭 사용 안함

  // 줄 길이 및 줄바꿈
  printWidth: 100, // 한 줄 최대 길이
  endOfLine: 'auto', // 운영체제에 맞는 줄바꿈 문자 자동 선택

  // 괄호 및 화살표 함수
  bracketSpacing: true, // 객체 리터럴 괄호 내부 공백
  bracketSameLine: false, // JSX 태그 닫는 괄호 새 줄에 배치
  arrowParens: 'avoid', // 화살표 함수 매개변수 괄호 (단일 매개변수시 생략)

  // JSX 설정
  jsxSingleQuote: true, // JSX에서 단일 따옴표 사용

  // 파일별 설정 오버라이드
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};

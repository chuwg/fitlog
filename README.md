# 핏로그 (FitLog)

교대근무자를 위한 스마트 운동 파트너 앱.

수면, HRV, 안정시 심박, 최근 운동 기록을 바탕으로 매일의 **훈련 준비 점수**를 계산하고, 교대 근무 패턴에 따라 보충제 알림과 모닝 리포트를 자동 조정해주는 React Native 앱입니다.

## 주요 기능

### 홈 대시보드
- 오늘 날짜 + 시간대별 인사말 + 오늘 근무 유형 배지
- **훈련 준비 점수** (0~100): 4가지 항목 합산 후 교대 근무 보정
- 이번 8일 사이클 미니 달력 (날짜별 훈련 가능 여부 색상 표시)
- 컨디션 상세: 수면 / HRV / 피로도 (프로그레스 바)
- 추천 훈련: 5km 목표 시간 기반 페이스 추천 또는 Zone 2 기준
- 현재 위치 날씨 + 미세먼지 (Open-Meteo API)

### 모닝 리포트
- 매일 사용자 지정 시간(기본 07:00)에 알림 발송
  - 야간 근무 당일은 자동 스킵
  - 야간 후 휴무일은 +2시간 자동 조정 (옵션)
- 알림 본문: `훈련 준비 N점 · 추천 훈련 · N°C 날씨`
- 알림 탭 → 전용 리포트 화면으로 이동
  - "{이름}님, 좋은 아침이에요!" 인사말
  - 훈련 준비 점수 + 컨디션 + 추천 훈련 + 날씨 + 오늘 보충제 (시간순)

### 교대 근무 패턴
- 8일 사이클 (기본: 주주휴휴야야휴휴) 직접 편집
- 사이클 시작일, 주간/야간 시작·끝 시간 모두 설정 가능
- 오늘 근무 유형 자동 계산: `주간` / `야간 전` / `야간 근무 중` / `야간 후 휴식` / `휴무`

### 보충제 관리
- 등록/수정/삭제, 교대 연동 토글, 알림 토글
- 기본 5종 자동 등록: 크리에이틴, 유청 단백, 마그네슘, 오메가3, 센트룸
- 4가지 복용 타이밍: 아침 식후 / 운동 전 / 운동 후 / 취침 전
- 각 타이밍별 기본 시간 사용자 설정 가능
- 향후 7일치 알림 자동 예약, 설정 변경 시 즉시 재예약

## 기술 스택

- **프레임워크**: React Native 0.74 + Expo SDK 51
- **네비게이션**: Expo Router (파일 기반)
- **로컬 DB**: expo-sqlite
- **알림**: expo-notifications (kind 태그 기반 분리 관리)
- **위치**: expo-location + Open-Meteo API
- **건강 데이터**: @kingstinct/react-native-healthkit (iOS HealthKit)
- **시간 입력**: @react-native-community/datetimepicker (네이티브 스피너)
- **언어**: TypeScript (strict mode)

## 점수 계산

총 100점, 각 항목 합산 후 교대 근무 보정.

| 항목 | 만점 | 기준 |
|---|---|---|
| 수면 | 30 | 7시간 이상=30, 6~7시간=22, 5~6시간=14, 5시간 미만=6 (깊은수면 ≥20% 시 +5) |
| HRV | 25 | 평균 +10% 이상=25, 평균=18, 평균 −10% 이하=10 |
| 회복 (안정시 심박) | 25 | 평균 −2bpm 이하=25, 평균=18, 평균 +3bpm 이상=10 |
| 훈련 부하 | 20 | 어제 휴식=20, 가벼움=16, 보통=12, 고강도=6, 이틀 연속 고강도=2 |

### 교대 근무 보정

| 근무 유형 | 보정 |
|---|---|
| 주간 근무 | 0 |
| 야간 근무 당일 | −15 |
| 야간 후 휴무 | −20 |
| 일반 휴무 | +5 |

### 점수별 상태

| 점수 | 상태 | 추천 |
|---|---|---|
| 80~100 | 최상 🟢 | 고강도 훈련 가능 |
| 60~79 | 양호 🟡 | 일반 훈련 |
| 40~59 | 보통 🟠 | 가벼운 훈련 |
| 0~39 | 피로 🔴 | 휴식 권고 |

## 보충제 알림 보정

교대 연동 ON일 때 근무 유형에 따라 자동 조정:

| 타이밍 | 주간 | 야간 당일 | 야간 후 휴무 |
|---|---|---|---|
| 아침 식후 | 기본 | 기본 | +2시간 |
| 운동 전/후 | 기본 | 기본 | +2시간 |
| 취침 전 | 기본 | 주간 시작 +2시간 (퇴근 후) | +2시간 |

## 프로젝트 구조

```
fitlog/
├── app/                              # Expo Router (라우팅)
│   ├── _layout.tsx                   # 루트 레이아웃 + 알림 응답 핸들러
│   ├── morning-report.tsx            # 모닝 리포트 상세 화면
│   └── (tabs)/
│       ├── _layout.tsx               # 4개 탭 정의
│       ├── index.tsx                 # 홈
│       ├── workout.tsx               # 운동 (placeholder)
│       ├── analytics.tsx             # 분석 (placeholder)
│       └── settings.tsx              # 설정
├── src/
│   ├── theme/colors.ts               # 민트 #00D4AA 다크 팔레트
│   ├── types.ts                      # 도메인 타입
│   ├── lib/
│   │   ├── readiness.ts              # 점수 계산, 추천 훈련
│   │   └── time.ts                   # HH:MM ↔ Date 변환
│   ├── services/
│   │   ├── db.ts                     # SQLite (8개 테이블)
│   │   ├── health.ts                 # HealthKit + mock fallback
│   │   ├── shift.ts                  # 사이클 계산, 오늘 근무 유형
│   │   ├── notifications.ts          # 보충제 + 모닝 리포트 스케줄링
│   │   ├── location.ts               # expo-location + 기본 좌표
│   │   └── weather.ts                # Open-Meteo + 대기질
│   └── components/
│       ├── Card.tsx
│       ├── ConditionCard.tsx
│       ├── CyclePlanCard.tsx
│       ├── Placeholder.tsx
│       ├── ProgressBar.tsx
│       ├── ReadinessCard.tsx
│       ├── ShiftBadge.tsx
│       ├── TimePickerRow.tsx
│       ├── WeatherCard.tsx
│       ├── WorkoutRecommendCard.tsx
│       └── settings/
│           ├── UserProfileSection.tsx
│           ├── ShiftSection.tsx
│           ├── MorningReportSection.tsx
│           ├── SupplementTimesSection.tsx
│           └── SupplementsSection.tsx
└── package.json
```

## 데이터 모델 (SQLite)

| 테이블 | 용도 |
|---|---|
| `daily_scores` | 매일 점수 기록 (date, total, breakdown, status) |
| `shift_config` | 교대 사이클, 시작일, 근무 시간 (단일 행) |
| `supplements` | 보충제 목록 (이름, 용량, 타이밍, 교대연동, 활성) |
| `supplement_base_times` | 4가지 타이밍 기본 시간 (단일 행) |
| `user_profile` | 이름, 5k 목표 시간 (단일 행) |
| `morning_report_config` | 알림 시간, 야간 스킵, +2h 옵션 (단일 행) |

## 시작하기

```bash
cd fitlog
npm install

# 개발 서버
npx expo start

# iOS dev client (HealthKit 사용시 필수)
npx expo prebuild
npx expo run:ios
```

### 주의사항

- **HealthKit**은 Expo Go에서 동작하지 않습니다. `expo prebuild` + 실기기 또는 개발 빌드가 필요합니다. 시뮬레이터/Expo Go에서는 자동으로 mock 데이터로 fallback 됩니다.
- **알림**은 Expo Go/시뮬레이터에서도 로컬 알림으로 동작하지만, 실기기 테스트가 권장됩니다.
- **위치 권한 거부 시** 기본 좌표(33.4637, 126.3379)로 날씨 조회.

## 개발 변경 이력

### Phase 1 — 초기 스캐폴드
- Expo SDK 51 + TypeScript + Expo Router 4탭 구조
- 다크모드 기본, 민트 #00D4AA 테마, 한국어
- 홈 대시보드 5개 카드 (점수/컨디션/추천/날씨/사이클은 후속 추가)
- HealthKit 서비스 추상화 (실데이터 + mock fallback)
- Open-Meteo 날씨 + 미세먼지

### Phase 2 — 교대 근무 + 보충제
- 8일 사이클 패턴 편집 UI
- 근무 유형별 점수 보정 (−20 ~ +5)
- 홈에 사이클 미니 달력 추가
- 보충제 CRUD + 기본 5종 시드
- expo-notifications 향후 7일 일별 스케줄링
- 교대 연동 토글로 알림 시간 자동 조정

### Phase 3 — 시간 사용자 설정
- @react-native-community/datetimepicker 도입
- 주간/야간 시작·끝 4개 + 보충제 기본 시간 4개 모두 편집 가능
- 알림 시간 하드코딩 제거

### Phase 4 — 모닝 리포트
- 매일 아침 알림 (야간 스킵, 야간 후 +2h 옵션)
- 알림 탭 → 전용 모닝 리포트 화면 (콜드 스타트 케이스 처리 포함)
- 사용자 프로필 (이름 + 5k 목표 시간)
- 5k 목표 기반 페이스 추천 (목표 −10s/+20s/+60s)
- 보충제/모닝 알림 분리 관리 (kind 태그 기반)

## 향후 계획

- 운동 탭 (러닝/농구 기록)
- 분석 탭 (점수 트렌드, 컨디션 차트)
- watchOS 컴패니언 앱 (홈 화면 점수 표시)

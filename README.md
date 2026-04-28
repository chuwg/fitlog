# 핏로그 (FitLog)

교대근무자를 위한 스마트 운동 파트너 앱.

수면, HRV, 안정시 심박, 최근 운동 기록을 바탕으로 매일의 **훈련 준비 점수**를 계산하고, 교대 근무 패턴에 따라 보충제 알림과 모닝 리포트를 자동 조정해주는 React Native 앱입니다. **러닝과 농구** 두 가지 운동 모드로 실시간 트래킹과 세션 리포트를 제공하며, **인바디 추적**과 **주간/월간 훈련 분석**까지 하나의 앱에서 관리합니다.

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

### 운동 탭 — 러닝 / 농구

운동 탭 상단에서 **러닝 / 농구** 모드를 선택해 시작합니다.

#### 러닝 모드
- 시작 화면: 거리 (5km / 10km / 직접) + 목표 시간 (프로필 자동 또는 직접) + 페이스 가이드 토글 + 러닝화 선택
- **PacePro 4구간 페이스 분배**:
  - 0~20% 워밍업 (목표 +15초)
  - 20~70% 메인 (목표)
  - 70~90% 유지 (목표 −5초)
  - 90~100% 마무리 (목표 −10초)
- 라이브 세션 (GPS + HealthKit HR 폴링):
  - 현재 거리/페이스/목표 대비 ±초/예상 완주 시간
  - 심박수 + Zone 인디케이터 (Z1~Z5)
  - PacePro 진행 커서
- 종료 리포트:
  - 거리·시간·평균 페이스, 목표 달성 배지
  - 평균/최고 심박, Zone 분포 바 + 범례
  - 케이던스 / GCT / 수직진폭 (Apple Watch 기록 있을 때)
  - 이전 동일 거리 세션 비교 (±10%)
  - 자동 생성 한줄 피드백
  - **신발 km 자동 누적**

#### 농구 모드
- 시작 화면: 쿼터 시간 (10분 / 12분 / 무제한 / 직접) + 예상 쿼터 수
- 라이브 세션:
  - 쿼터 번호 + 남은/경과 시간 (총 경과 시간)
  - 실시간 심박 + Zone
  - **CoreMotion 기반 점프/스프린트 자동 카운트** (DeviceMotion 50Hz)
  - 쿼터 종료 / 세션 종료 두 버튼
- 쿼터 종료 모달: 평균/최고 심박, Zone 분포, 점프/스프린트, 한줄 평가
- 종료 리포트:
  - 총 시간 + 칼로리 (심박 기반 추정)
  - 활동량: 점프/스프린트/평균·최고 심박
  - 심박 Zone 분포 바
  - **유산소/무산소 별점** (Z2-3 / Z4-5 비중 0~5점)
  - 쿼터별 심박 추이 막대 차트
  - **내일 훈련 권장** (오늘 부하 점수 기반)

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

### 신발 관리
- 등록/수정/삭제, 활성 토글, 누적 km 자동 추적
- **용도 태그** (일반훈련 / 회복 / 대회) — 색상 구분
- 브랜드 + 모델명 인라인 편집
- 목표 km 설정 시 진행도 바 표시 (90% 초과 시 빨강)
- 러닝 세션 종료 시 선택한 신발에 거리 자동 누적
- **교체 임박 알림** — 90% 도달 시 1회 발송, 사용자가 km 조정 시 플래그 리셋

### 인바디 트래커 (분석 탭 인바디 섹션)
- **Apple Vision OCR**: 결과지를 카메라로 촬영하거나 갤러리에서 불러오면 항목을 자동 인식 (한국어+영어 동시)
  - 인식된 항목만 폼에 자동 채움, 나머지는 수동 입력 안내
  - 로컬 Expo Module(`modules/fitlog-vision-text/`)에서 `VNRecognizeTextRequest` 호출
- 수동 입력 폼: 측정일 + 체중 / 골격근량 / 체지방량 / 체지방률 / BMI / 점수
- 최신 기록 + 직전 기록 대비 ▲▼ 증감 (개선=초록 / 악화=빨강)
- 목표 달성률 진행도 바 (`user_profile.inbody_goal_score` 기반)
- 변화 추이 SVG 라인 차트 — 최근 6회 (체중 / 골격근량 / 체지방률 / 점수 토글)
- 홈 추천 훈련 점수별 분기:
  - 90+: 현재 훈련 유지
  - 85~89: 메인 후 근력 보강 15분
  - 85 미만: 근력 훈련(스쿼트·푸시업·런지 3세트) 추가 권장

### 분석 탭 (4-세그먼트)
- **주간**: 이번 주 거리/시간, 요일별 운동 막대 차트(러닝+농구), ATL/CTL 부하 지수, 균형 +20 이상 시 경고
- **월간**: 거리/세션/시간/칼로리, 5km·10km 베스트(목표 대비), 자동 하이라이트 (지난달 대비 증감, 베스트 단축, 농구 횟수)
- **트렌드**: 평균 페이스 / 평균 심박 / GCT / 인바디 점수 라인 차트
- **인바디**: 위 인바디 트래커 화면

## 기술 스택

- **프레임워크**: React Native 0.74 + Expo SDK 51
- **네비게이션**: Expo Router (파일 기반)
- **로컬 DB**: expo-sqlite
- **알림**: expo-notifications (kind 태그 기반 분리 관리)
- **위치/GPS**: expo-location + Open-Meteo API
- **건강 데이터**: @kingstinct/react-native-healthkit (iOS HealthKit)
- **동작 감지**: expo-sensors (DeviceMotion / CoreMotion)
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

## 심박 Zone 계산

`user_profile.max_heart_rate` 기반 5단계.

| Zone | 비율 | 설명 |
|---|---|---|
| Z1 | <50% | 매우 가벼움 |
| Z2 | 50~60% | 가벼운 유산소 |
| Z3 | 60~70% | 중강도 유산소 |
| Z4 | 70~85% | 역치 |
| Z5 | ≥85% | 최대 |

## 농구 동작 감지

DeviceMotion 50Hz 가속도 샘플링.

```
mag_g  = sqrt(x² + y² + z²) / 9.81  (전체 합성)
horiz_g = sqrt(x² + y²) / 9.81      (수평 성분)

점프:    mag_g > jumpG → prev보다 감소 + jumpG×0.7 이하 → 800ms 쿨다운 후 카운트
스프린트: horiz_g > sprintG → 800ms 쿨다운 후 카운트
```

기본 임계값: **점프 2.5g / 스프린트 1.8g**, 설정에서 조정 가능.

### 유산소/무산소 별점

| Z2+Z3 또는 Z4+Z5 비중 | 별점 |
|---|---|
| ≥60% | 5 |
| 40~60% | 4 |
| 25~40% | 3 |
| 15~25% | 2 |
| 5~15% | 1 |
| <5% | 0 |

### 내일 훈련 권장 (부하 점수)

`load = minutes × (1 + Z4-Z5 비중 × 1.5)`

- ≥90 → 휴식 권고
- ≥60 → 가벼운 훈련 (Zone 2 조깅 30분)
- ≥30 → 일반 훈련 가능
- 그 미만 → 추가 훈련 가능

## 프로젝트 구조

```
fitlog/
├── app/                              # Expo Router (라우팅)
│   ├── _layout.tsx                   # 루트 레이아웃 + 알림 응답 핸들러
│   ├── morning-report.tsx            # 모닝 리포트 상세 화면
│   ├── running-session.tsx           # 러닝 라이브 세션
│   ├── running-report.tsx            # 러닝 종료 리포트
│   ├── basketball-session.tsx        # 농구 라이브 세션
│   ├── basketball-report.tsx         # 농구 종료 리포트
│   ├── inbody-entry.tsx              # 인바디 수동 입력
│   └── (tabs)/
│       ├── _layout.tsx               # 4개 탭 정의
│       ├── index.tsx                 # 홈
│       ├── workout.tsx               # 운동 (러닝/농구 토글)
│       ├── analytics.tsx             # 분석 (주간/월간/트렌드/인바디)
│       └── settings.tsx              # 설정
├── src/
│   ├── theme/colors.ts               # 민트 #00D4AA 다크 팔레트
│   ├── types.ts                      # 도메인 타입
│   ├── lib/
│   │   ├── readiness.ts              # 점수 계산, 추천 훈련
│   │   ├── pace.ts                   # 페이스 / Zone / PacePro / 하버사인
│   │   ├── motion.ts                 # DeviceMotion 점프·스프린트 감지
│   │   ├── basketball.ts             # 칼로리 / 별점 / 내일 권장
│   │   ├── inbody.ts                 # 메트릭 / 증감 / 목표 진행도
│   │   ├── analytics.ts              # 주간·월간·트렌드 집계 + ATL/CTL
│   │   └── time.ts                   # HH:MM ↔ Date 변환
│   ├── services/
│   │   ├── db.ts                     # SQLite (13개 테이블)
│   │   ├── health.ts                 # HealthKit + mock fallback
│   │   ├── shift.ts                  # 사이클 계산, 오늘 근무 유형
│   │   ├── notifications.ts          # 보충제 + 모닝 리포트 + 신발 알림
│   │   ├── location.ts               # expo-location + 기본 좌표
│   │   ├── weather.ts                # Open-Meteo + 대기질
│   │   └── running.ts                # GPS 워처 + HR 폴링
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
│       ├── running/
│       │   ├── StartForm.tsx
│       │   ├── DistancePicker.tsx
│       │   ├── ShoePicker.tsx
│       │   ├── PaceProBar.tsx
│       │   ├── HrZoneIndicator.tsx
│       │   └── ZoneDistributionBar.tsx
│       ├── basketball/
│       │   ├── StartForm.tsx
│       │   └── StarRating.tsx
│       ├── inbody/
│       │   └── LineChart.tsx
│       ├── analytics/
│       │   └── WeekBarChart.tsx
│       └── settings/
│           ├── UserProfileSection.tsx
│           ├── ShiftSection.tsx
│           ├── MorningReportSection.tsx
│           ├── SupplementTimesSection.tsx
│           ├── SupplementsSection.tsx
│           ├── ShoesSection.tsx
│           └── BasketballThresholdsSection.tsx
└── package.json
```

## 데이터 모델 (SQLite)

| 테이블 | 용도 |
|---|---|
| `daily_scores` | 매일 점수 기록 (date, total, breakdown, status) |
| `shift_config` | 교대 사이클, 시작일, 근무 시간 (단일 행) |
| `supplements` | 보충제 목록 (이름, 용량, 타이밍, 교대연동, 활성) |
| `supplement_base_times` | 4가지 타이밍 기본 시간 (단일 행) |
| `user_profile` | 이름, 5k/10k 목표, 최대 심박, 인바디 목표 점수 (단일 행) |
| `morning_report_config` | 알림 시간, 야간 스킵, +2h 옵션 (단일 행) |
| `shoes` | 러닝화 (이름, 브랜드, 용도, 누적 km, 목표 km, 활성, 교체 알림 플래그) |
| `running_sessions` | 러닝 세션 기록 (거리, 시간, 페이스, HR, Zone, 다이내믹스, 신발) |
| `basketball_sessions` | 농구 세션 기록 (쿼터 JSON, 점프/스프린트, HR, 별점, 내일 권장) |
| `basketball_config` | 점프/스프린트 임계값 (단일 행) |
| `inbody_records` | 인바디 측정 기록 (체중, 골격근량, 체지방량/률, BMI, 점수) |

## 시작하기

```bash
cd fitlog
npm install

# 개발 서버
npx expo start

# iOS dev client (HealthKit, CoreMotion 사용시 필수)
npx expo prebuild
npx expo run:ios
```

### 주의사항

- **HealthKit**은 Expo Go에서 동작하지 않습니다. `expo prebuild` + 실기기 또는 개발 빌드가 필요합니다. 시뮬레이터/Expo Go에서는 자동으로 mock 데이터로 fallback 됩니다.
- **GPS**는 시뮬레이터에서 거의 안 옵니다. 실기기 또는 시뮬레이터 "Custom Location" 시뮬레이션 사용 권장.
- **CoreMotion (점프/스프린트)**은 시뮬레이터에서 동작하지 않습니다. 실기기 + 동작 권한 허용이 필요합니다. 권한 거부 시에도 다른 기능은 정상 동작합니다.
- **알림**은 Expo Go/시뮬레이터에서도 로컬 알림으로 동작하지만, 실기기 테스트가 권장됩니다.
- **위치 권한 거부 시** 제주 애월 기본 좌표(33.4637, 126.3379)로 날씨 조회. 권한 허용 시에는 앱 실행/탭 진입마다 현재 위치를 새로 조회합니다.
- **러닝 트래킹은 포그라운드만** 지원합니다. 화면 켜짐 유지를 권장합니다.

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

### Phase 5 — 러닝 모드
- `user_profile`에 `max_heart_rate`, `running_goal_10k` 컬럼 추가 (마이그레이션)
- 신규 테이블: `shoes`, `running_sessions`
- 시작 화면: 거리/시간/페이스 가이드/신발 선택, 오늘 점수 표시
- PacePro 4구간 자동 계산
- 라이브 세션: GPS 워처 + HealthKit HR 폴링 (5초)
- 리포트: Zone 분포, 다이내믹스, 이전 세션 비교, 신발 km 자동 누적
- 자동 한줄 피드백 (페이스/Zone/GCT 기반)

### Phase 6 — 농구 모드
- expo-sensors 도입, app.json에 motion 권한 추가
- 신규 테이블: `basketball_sessions`, `basketball_config`
- 운동 탭을 [러닝 | 농구] 세그먼트 토글로 변경, 러닝 시작 폼 컴포넌트로 추출
- 시작 화면: 쿼터 시간(10/12/무제한/직접) + 예상 쿼터 수
- 라이브 세션: 쿼터 카운터, 실시간 심박/Zone, CoreMotion 점프/스프린트 카운트
- 쿼터 종료 모달 → 다음 쿼터 / 세션 종료
- 리포트: 칼로리(HR 기반), Zone 분포, 유산소/무산소 별점, 쿼터별 심박 추이, 내일 훈련 권장

### Phase 7 — 인바디 트래커
- 신규 테이블: `inbody_records`, `user_profile.inbody_goal_score` 컬럼 추가
- 수동 입력 화면 (`app/inbody-entry.tsx`) — 6개 메트릭, 네이티브 DatePicker
- `src/lib/inbody.ts`: 메트릭 추출, 증감 계산(메트릭별 개선 방향), 목표 진행도
- `react-native-svg` 직접 그린 LineChart 컴포넌트 (의존성 추가 없음)
- 분석 탭에 인바디 섹션 통합 (하단 탭 4개 유지)
- 홈 추천 훈련에 인바디 목표 부족 시 근력 훈련 권장 자동 추가
- `recommendWorkout` 시그니처를 옵션 객체로 확장 (`{goal5kSeconds?, inbodyGoalGap?}`)
- (OCR은 보류, 향후 ML Kit 도입 예정)

### Phase 9 — Apple Vision 인바디 OCR
- 로컬 Expo Module 추가: `modules/fitlog-vision-text/` (Swift + ExpoModulesCore)
- `VNRecognizeTextRequest`로 한국어/영어 동시 텍스트 인식
- `expo-image-picker` 도입 — 카메라 촬영 / 갤러리 선택
- `src/lib/inbody-ocr.ts`: 정규식 패턴 매칭 (체중/골격근량/체지방량·률/BMI/점수)
- 인식 결과를 입력 폼에 자동 채움, 일부 인식 시 알림으로 안내
- `recommendWorkout` 점수별 3단계 분기 (90+/85~89/85↓), `inbodyGoalGap` → `inbodyScore` 시그니처 변경
- 인바디 변화 추이 차트는 최근 6회로 제한
- 홈 화면, 모닝 리포트 모두 최신 인바디 점수를 추천에 반영
- iOS 카메라/갤러리 권한 메시지 추가 (NSCameraUsageDescription 등)

### Phase 8 — 러닝화 관리 + 분석 탭
- `shoes` 컬럼 마이그레이션: `purpose` (용도 태그), `replacement_alerted` (알림 플래그)
- `ShoesSection` 인라인 편집 폼, 용도 칩(일반훈련/회복/대회), 교체 임박 라벨
- 신발 90% 도달 시 1회 푸시 알림 (`sendShoeReplacementAlert`), 사용자가 km 줄이면 플래그 리셋
- `src/lib/analytics.ts`: 주간/월간 집계, ATL/CTL, 트렌드 시계열, 하이라이트 자동 생성
- `WeekBarChart` 요일별 스택 막대 (러닝/농구 색 구분)
- 분석 탭을 4개 세그먼트로 재구성 (주간/월간/트렌드/인바디)

## 향후 계획

- 백그라운드 GPS 트래킹 (실내/긴 세션 대응)
- 세션 히스토리 리스트 (러닝/농구 전체 목록)
- 인바디 OCR (ML Kit 도입)
- watchOS 컴패니언 앱 (홈 화면 점수 표시)

# watchOS 컴패니언 앱 통합 가이드

핏로그 watchOS 앱을 Xcode에서 추가하고 빌드하는 한 번 작업입니다. Expo는 watchOS target을 자동 생성하지 않아 수동 추가가 필요합니다.

## 준비된 자산

```
modules/fitlog-watch-bridge/        # iOS Bridge (Expo Module, 자동 통합됨)
  ├── ios/FitlogWatchBridgeModule.swift
  ├── ios/FitlogWatchBridge.podspec
  ├── package.json
  ├── expo-module.config.json
  └── index.ts

watchos/                            # watchOS 앱 코드 (수동 복사)
  ├── FitLogWatchApp.swift
  ├── ContentView.swift
  └── WatchSessionManager.swift

src/services/watch.ts               # RN에서 호출 (자동 동작)
```

## 통합 단계 (한 번만)

### 1. Prebuild

```bash
cd /Users/woonggi/projects/fitlog
npx expo prebuild --clean
```

`ios/` 폴더가 생성됩니다.

### 2. Xcode에서 watchOS Target 추가

1. `open ios/FitLog.xcworkspace`
2. 프로젝트 네비게이터 → 프로젝트(루트) 선택
3. 하단 **+ (Add Target)** 클릭
4. **watchOS → App** 선택, Next
5. 설정:
   - Product Name: `FitLogWatch`
   - Bundle Identifier: `com.fitlog.app.watchkitapp` (메인 앱 + `.watchkitapp`)
   - Interface: **SwiftUI**
   - Language: **Swift**
   - 메인 앱과 페어링 자동 활성화
6. Finish

### 3. Swift 파일 복사

생성된 watchOS target의 폴더에 다음 3개 파일을 복사 (또는 드래그):
- `watchos/FitLogWatchApp.swift`
- `watchos/ContentView.swift`
- `watchos/WatchSessionManager.swift`

복사 시 **"Copy items if needed"** 체크, **Add to target: FitLogWatch Watch App** 선택.

기본으로 Xcode가 만든 `ContentView.swift`, `*App.swift`는 삭제 (충돌 방지).

### 4. WatchConnectivity 추가

watchOS target과 iOS target 모두에서 자동 활성화됩니다 (별도 entitlement 불필요). 기본으로 사용 가능.

### 5. 빌드

- iPhone 시뮬레이터 + 페어링된 Apple Watch 시뮬레이터로 실행
- 또는 실기기 (Apple Developer 계정 필요)

## 동작 확인

1. iPhone 앱 홈 화면 진입 → `loadHome()`이 자동으로 `syncToWatch()` 호출
2. 워치 앱이 켜져 있으면 즉시 `sendMessage`로 받음
3. 꺼져 있으면 `updateApplicationContext`로 다음 부팅 시 받음
4. 워치 화면: 큰 점수 + 상태 라벨 + 추천 텍스트 + 수면 시간 + 갱신 시각

## 데이터 페이로드

iPhone → Watch로 전송되는 형식:

```ts
{
  score: number,        // 훈련 준비 점수 (0~100)
  status: string,       // "최상" / "양호" / "보통" / "피로"
  advice: string,       // 추천 한줄
  sleepHours?: number,  // 수면 시간 (소수)
  updatedAt: number     // ms timestamp
}
```

## 디자인

워치 화면은 다음 요소로 구성됩니다:

| 영역 | 표시 |
|---|---|
| 상단 caption | "훈련 준비" |
| 메인 | 큰 점수 (점수에 따라 색상: 녹/노/주황/빨) |
| 라벨 | "최상" / "양호" / "보통" / "피로" |
| 본문 | 추천 한줄 텍스트 |
| 하단 | 🌙 수면 시간 |
| 푸터 | 갱신 시각 |

색상은 iPhone 앱과 동일 (민트 #00D4AA 등).

## 트러블슈팅

### 빌드 시 "No such module 'WatchConnectivity'"
- iOS target에서는 자동 import. watchOS target에 파일이 제대로 추가됐는지 확인.

### 워치에 데이터 안 들어옴
- `WCSession.isReachable`이 `false`면 워치가 슬립 상태. iPhone 앱을 새로고침하면 `applicationContext`로 다음에 받음.
- 워치 앱이 설치돼 있어야 함 (`isWatchAppInstalled === true`).

### Prebuild 후 watchOS target 사라짐
- `npx expo prebuild --clean` 시 `ios/` 폴더가 재생성되면서 수동 추가한 watchOS target이 사라집니다.
- 한 번 만든 후엔 `--clean` 없이 `npx expo prebuild` 또는 직접 `npx expo run:ios`만 사용.
- 또는 추가한 target을 별도 백업해두고 prebuild 후 다시 import.

## 향후 개선 아이디어

- 시계 페이스 컴플리케이션 (큰 숫자 + 작은 점수)
- 워치에서 직접 러닝 시작 (HealthKit Workout)
- 워치 → iPhone 새로고침 요청 (역방향 메시지)

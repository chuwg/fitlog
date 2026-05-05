# 핏로그 배포 가이드

iOS App Store (TestFlight 또는 정식) 배포 단계입니다. Expo의 **EAS Build** + **EAS Submit**을 사용하면 macOS 없이도 클라우드에서 빌드해 자동 업로드할 수 있지만, watchOS 앱이 포함된 경우 Xcode local 빌드가 더 안정적입니다.

## 사전 준비

### 1. Apple Developer Program 가입 ($99/년)
- https://developer.apple.com/programs/
- 개인 또는 회사 계정 결정
- 가입 후 Membership 탭에서 Team ID 확인

### 2. App Store Connect에 앱 등록
1. https://appstoreconnect.apple.com → 내 앱 → **+ 새 앱**
2. 정보 입력:
   - 플랫폼: iOS
   - 이름: 핏로그 (FitLog)
   - 기본 언어: 한국어
   - Bundle ID: `com.fitlog.app` (Apple Developer Portal에서 미리 등록)
   - SKU: `fitlog-ios`
3. 카테고리: 건강 및 피트니스
4. 가격: 무료

### 3. App Privacy 정보 작성
사용 데이터 항목 신고:
- **건강 및 피트니스** (HealthKit) — 분석 사용
- **위치** (대략적 위치) — 날씨용
- **위치** (정확한 위치) — 러닝 GPS
- **사용 데이터** (앱 상호작용) — 분석 없음, 디바이스 내부만
- **민감한 정보** (건강 정보) — 디바이스 내부 처리만, 서드파티 미공유

## 옵션 A: EAS Build + EAS Submit (클라우드)

watchOS 앱이 **없는** 경우 가장 간편합니다.

### 1. EAS CLI 설치 및 로그인
```bash
npm install -g eas-cli
eas login
```

### 2. eas.json 생성
```bash
cd /Users/woonggi/projects/fitlog
eas build:configure
```

생성된 `eas.json`에 production 프로파일 확인:
```json
{
  "build": {
    "production": {
      "ios": { "autoIncrement": true }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### 3. 빌드 + 제출
```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

20~40분 후 TestFlight에 자동 등록됩니다.

## 옵션 B: 로컬 Xcode 빌드 (watchOS 포함 시 권장)

### 1. Prebuild
```bash
npx expo prebuild --clean
```

### 2. watchOS Target 추가 (WATCHOS.md 참고)
- Xcode에서 watchOS App + Widget Extension 추가
- Swift 파일 복사
- App Group capability 추가

### 3. 코드 서명
- Xcode → 메인 target → Signing & Capabilities
- Team 선택 (Apple Developer 계정)
- "Automatically manage signing" 체크
- 동일하게 Watch App, Widget Extension target에도 적용

### 4. Archive 빌드
1. Xcode 상단 device를 **Any iOS Device (arm64)** 선택
2. Product → **Archive**
3. 완료 후 Organizer 자동 열림

### 5. App Store 업로드
- Organizer → **Distribute App** → **App Store Connect** → **Upload**
- 옵션 그대로 진행 → 자동 서명 → Upload
- 10~30분 후 App Store Connect의 TestFlight 탭에 빌드 등장

## TestFlight 베타 배포

### 1. 빌드 처리 대기
- Apple이 자동 처리 (5~30분)
- 처리 완료 후 "수출 규제 정보" 입력 필요 (한 번만, 보통 "아니오")

### 2. 내부 테스트
- TestFlight → 내부 테스트 → 그룹 만들기
- 테스터 추가 (App Store Connect 사용자 권한 필요)
- 빌드 활성화 → 즉시 배포

### 3. 외부 테스트 (선택)
- Beta App Review 필요 (24~48h)
- 통과 후 최대 10,000명까지 초대 가능

## App Store 정식 배포

### 1. 스크린샷 + 메타데이터
필수:
- 6.7" iPhone 스크린샷 (최소 3장)
- 앱 아이콘 1024×1024 (이미 `assets/icon.png`로 생성됨)
- 앱 설명 (한국어)
- 키워드 (100자 이내)
- 지원 URL
- 마케팅 URL (선택)

watchOS 추가 시:
- watchOS 스크린샷 1.5"/1.65"/1.9" (Apple Watch Series 별)

### 2. 심사 제출
1. App Store Connect → 앱 → **버전 또는 플랫폼 추가** → iOS
2. 빌드 선택 (TestFlight에 올린 것)
3. 심사용 정보 입력:
   - 데모 계정 (필요 없으면 비워두기)
   - 메모: HealthKit 권한 필요 사유, 백그라운드 위치 사용 사유 명확히 설명
4. **심사를 위해 제출**

심사 기간: 보통 24~48시간, 길면 7일.

### 3. 출시
- 심사 통과 후 자동 출시 또는 수동 출시 선택
- 한국 App Store에서 검색 가능까지 1~2시간

## 자주 묻는 거절 사유 + 대처

| 거절 사유 | 대처 |
|---|---|
| HealthKit 사용 사유 불명확 | 심사 메모에 "훈련 준비 점수 계산을 위해 수면/HRV/심박 데이터 사용" 명시 |
| 백그라운드 위치 사유 불명확 | "러닝 중 화면 꺼져도 GPS 측정 위해" 명시 + Privacy Manifest |
| 앱이 너무 단순함 (4.2) | 핵심 기능 스크린샷 + 동영상 추가 |
| OCR 권한 (카메라) 사유 | "인바디 결과지 자동 인식" 명시 |

## 업데이트 출시

### Production 빌드 번호 자동 증가
`app.json`의 `version`만 올리면 빌드 번호는 EAS/Xcode가 자동 처리합니다.
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": { "buildNumber": "2" }
  }
}
```

### 핫픽스
- 빌드 번호만 올려서 재제출 가능
- "버전 출시" 후 24시간 내 핫픽스는 별도 심사 거치지 않을 수 있음 (Expedited Review 요청)

## 비용 / 시간 요약

| 항목 | 비용 | 시간 |
|---|---|---|
| Apple Developer Program | $99/년 | 가입 1~2일 |
| EAS Build (월 30회) | 무료 | 빌드 20~40분 |
| 빌드 처리 (Apple) | - | 5~30분 |
| 외부 베타 심사 | - | 24~48h |
| 정식 심사 | - | 24h~7일 |

## 권장 순서

1. **먼저 TestFlight 내부 테스트** — 가족/친구 5명에게 배포해 1~2주 사용
2. **외부 베타** — 더 넓은 그룹 (20~50명) 1~2주
3. **정식 출시** — 안정성 확인 후

## 참고 링크

- [Apple Developer](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [EAS Submit 문서](https://docs.expo.dev/submit/introduction/)
- [Apple App Review 가이드라인](https://developer.apple.com/app-store/review/guidelines/)

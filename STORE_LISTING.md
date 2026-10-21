# Chrome 웹스토어 제출 문안

## 이름

Focus Bomber

## 요약 설명

사이트별 이용시간을 제한하고, 시간이 끝나면 픽셀 폭격 애니메이션과 함께 탭을 닫습니다.

## 상세 설명

Focus Bomber는 사용자가 직접 선택한 웹사이트의 하루 이용시간을 제한하는 생산성 확장 프로그램입니다.

- 사이트별 하루 제한시간 설정
- 활성 탭을 보고 있는 동안 사용시간 누적
- 브라우저를 다시 열거나 닫힌 탭을 복구해도 당일 기록 유지
- 제한시간 초과 시 픽셀 아트 편대와 폭발 애니메이션 실행
- 애니메이션 종료 후 해당 탭 자동 닫기
- 오늘 기록 수동 초기화 및 사이트별 기능 켜기/끄기

주의: 제한시간이 끝나면 페이지 요소가 화면에서 사라지고 탭이 자동으로 닫힙니다. 저장하지 않은 입력 내용은 유실될 수 있습니다.

모든 설정과 사용 기록은 브라우저 로컬 저장소에만 저장되며 외부 서버로 전송되지 않습니다.

효과음 출처:

- [Sound Effect - WW2 Fighter Plane Takeoff — ScottishPerson / Pixabay](https://pixabay.com/sound-effects/film-special-effects-sound-effect-ww2-fighter-plane-takeoff-333260/)
- [Explosion Sound Effect — DRAGON-STUDIO / Pixabay](https://pixabay.com/sound-effects/film-special-effects-explosion-sound-effect-425455/)
- [Loud Explosion — DRAGON-STUDIO / Pixabay](https://pixabay.com/sound-effects/film-special-effects-loud-explosion-425457/)
- [Pixabay Content License](https://pixabay.com/service/license-summary/)

항공기 스프라이트 크레딧:

- Original aircraft artwork by Mark Simpson (Prinz Eugn). Used and modified with credit to the original artist.
- [Prinz Eugn on DeviantArt](http://prinzeugn.deviantart.com/)

## 단일 목적

사용자가 선택한 웹사이트의 하루 이용시간을 측정하고, 설정한 시간이 끝나면 시청각 차단 효과와 탭 종료를 통해 사용 제한을 실행합니다.

## 권한 사용 사유

### storage

사용자가 등록한 사이트, 제한시간, 활성화 상태, 날짜별 누적 사용시간과 차단 상태를 브라우저 로컬에 보관합니다.

### scripting

팝업에서 현재 사이트의 제한을 저장한 직후 새로고침 없이 타이머를 시작하고, 사용자가 허용한 사이트에만 타이머 콘텐츠 스크립트를 동적으로 등록하기 위해 사용합니다.

### offscreen

서비스 워커에서 직접 재생할 수 없는 항공기 및 폭발 효과음을 애니메이션 중 재생하기 위해 오프스크린 문서를 사용합니다.

### activeTab

사용자가 팝업을 열고 현재 사이트를 제한 대상으로 저장하는 명시적 동작을 했을 때, 해당 탭의 주소를 확인하고 새로고침 없이 타이머를 적용하기 위해 사용합니다. 이 권한은 사용자가 확장 프로그램을 실행한 현재 탭에서만 일시적으로 작동합니다.

### 선택적 호스트 권한

확장 프로그램은 설치 시 모든 사이트 접근 권한을 요구하지 않습니다. 사용자가 제한 대상으로 등록할 때 해당 도메인 하나에 대해서만 권한을 요청합니다. 허용된 도메인에서 이용시간을 측정하고 제한시간 초과 시 애니메이션을 실행하며, 사이트를 비활성화하거나 삭제하면 권한을 제거합니다. 데이터는 브라우저 외부로 전송되지 않습니다.

## 데이터 공개 답변 참고

- 웹 기록에 해당할 수 있는 사이트 도메인과 사용시간을 기능 제공 목적으로 로컬 처리합니다.
- 페이지 DOM은 애니메이션 대상 탐색을 위해 일시적으로 처리하며 저장하거나 전송하지 않습니다.
- 광고, 분석, 추적, 데이터 판매 및 제3자 공유를 하지 않습니다.
- 개인정보처리방침 URL에는 `https://suhakuijeongseok.github.io/FocusBomber/privacy.html`을 입력합니다.

## 카테고리 및 공개 범위

- 권장 카테고리: 생산성
- 첫 심사 권장 공개 범위: 미등록
- 내부 확인 후 공개로 변경

## 준비된 스토어 이미지

- `store-assets/focus-bomber-settings-1280x800.png`: 설정 화면과 핵심 기능 설명
- `store-assets/focus-bomber-raid-1280x800.png`: 실제 전투기 및 폭격 스타일
- `store-assets/focus-bomber-promo-440x280.png`: 소형 프로모션 이미지
- `store-assets/focus-bomber-marquee-1400x560.png`: 마키 프로모션 타일

## 제출 전 수동 확인

- Chrome 웹스토어 개발자 대시보드에 지원 이메일 입력
- 스토어 아이콘 및 실제 작동 화면 스크린샷 업로드
- 효과음 라이선스 증빙을 로컬에 보관
- GitHub Pages를 활성화해 개인정보처리방침 URL 공개
- 자동 탭 종료와 미저장 데이터 유실 가능성을 상세 설명에 유지

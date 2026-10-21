# Focus Bomber

지정한 사이트의 하루 누적 사용시간이 제한을 넘으면, 폭격기가 나타나 현재 페이지의 실제 DOM 텍스트와 상호작용 요소를 폭격 애니메이션으로 날려버리는 Chrome/Edge 확장 프로그램입니다.

## 설치

1. Chrome에서 `chrome://extensions`, Edge에서 `edge://extensions`를 엽니다.
2. **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
4. 이 `FocusBomber` 폴더를 선택합니다.

## 사용

1. 툴바의 Focus Bomber 아이콘을 누릅니다.
2. 사이트 주소와 하루 제한시간(분)을 입력합니다.
3. 해당 사이트를 활성 탭에서 보고 있는 동안만 시간이 누적됩니다.
4. 제한시간을 넘으면 5대의 전투기가 진행 방향에 수직인 좌상단–우하단 횡대로 배치됩니다. 각 기체에는 서로 평행한 전용 폭격선이 지정되며, 해당 선 주변의 요소만 맡아서 폭격합니다.
5. 폭격이 끝나 페이지 요소가 모두 정리되면 해당 탭이 자동으로 닫힙니다.

각 폭격선은 화면 전체 구간에서 최대 40개, 편대 전체로는 최대 200개의 요소를 직접 폭격합니다.

현재 탭 주소로 제한을 저장하면 콘텐츠 스크립트를 즉시 주입하므로 페이지를 새로고침하지 않아도 타이머가 바로 시작됩니다. 브라우저 내부 페이지처럼 스크립트 주입이 금지된 주소는 제외됩니다.

닫힌 탭을 브라우저의 탭 복구 기능으로 다시 열어도 당일 제한 초과 상태가 유지됩니다. 복구 시 이전 폭격의 숨김 상태와 잔여 애니메이션을 먼저 정리한 뒤 페이지 요소를 다시 수집하여 폭격을 재실행합니다. 다시 이용하려면 팝업의 **오늘 기록 초기화**를 사용하세요.

설정 목록의 **시험·닫기** 버튼을 누르면 현재 탭에서 애니메이션을 즉시 확인할 수 있습니다. 시험이 끝나도 탭이 닫히므로 필요한 작업을 먼저 저장하세요.

설정 변경 후 이미 열려 있던 페이지에 적용이 안 되면 페이지를 한 번 새로고침하세요. 폭격 효과는 페이지를 새로고침하면 복구되지만, 오늘 사용시간은 확장 프로그램 저장소에 유지됩니다.

## 구현 참고자료

- [MDN `Element.animate()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate): DOM 요소별 키프레임 애니메이션
- [Chrome `tabs` API](https://developer.chrome.com/docs/extensions/reference/api/tabs): 완료된 탭 종료
- [OpenGameArt pixel explosion reference](https://opengameart.org/content/explosion-animations): 각진 화염·파편·연기 단계의 시각적 참고

픽셀 폭발 레퍼런스의 그래픽 파일은 복제하지 않았으며, 폭발 효과는 CSS와 DOM으로 새로 제작했습니다.

## 항공기 스프라이트 크레딧

편대 전투기에는 제공된 Aircraft Sprites 팩의 `FA-28 out.PNG`를 투명 배경으로 가공해 사용했습니다.

- Original aircraft artwork: **Mark Simpson (Prinz Eugn), 2001–2008**
- 제작자 요청 조건: 사용 사실을 제작자에게 알리고 크레딧을 포함해야 합니다.
- 제공된 연락처: `prinz_eugn@hotmail.com`

폭발·폭탄·파편 효과는 기존과 동일하게 CSS와 DOM으로 자체 제작되었습니다.

## 사운드 크레딧

사용자가 제공한 다음 효과음을 확장 프로그램의 오프스크린 오디오 문서에서 재생합니다.

- Aircraft: `scottishperson-sound-effect-ww2-fighter-plane-takeoff-333260.mp3`
- Explosions: `dragon-studio-explosion-sound-effect-425455.mp3`
- Explosions / final explosion: `dragon-studio-loud-explosion-425457.mp3`

효과음 출처 표기:

- [Sound Effect - WW2 Fighter Plane Takeoff — ScottishPerson / Pixabay](https://pixabay.com/sound-effects/film-special-effects-sound-effect-ww2-fighter-plane-takeoff-333260/)
- [Explosion Sound Effect — DRAGON-STUDIO / Pixabay](https://pixabay.com/sound-effects/film-special-effects-explosion-sound-effect-425455/)
- [Loud Explosion — DRAGON-STUDIO / Pixabay](https://pixabay.com/sound-effects/film-special-effects-loud-explosion-425457/)
- [Pixabay Content License](https://pixabay.com/service/license-summary/)

세 음원은 Pixabay Content License에 따라 확장 프로그램의 시청각 효과 구성요소로 사용합니다. 음원 파일을 독립 상품이나 원본 상태로 재배포하지 않습니다.

## 개인정보 보호

Focus Bomber는 설정한 사이트, 제한시간, 당일 사용시간 및 차단 상태를 `chrome.storage.local`에만 저장합니다. 별도의 서버로 전송하지 않으며 광고, 분석 및 추적 SDK를 사용하지 않습니다. 자세한 내용은 [PRIVACY.md](PRIVACY.md)를 확인하세요.

## Chrome 웹스토어 배포

제출 문안과 권한 설명은 [STORE_LISTING.md](STORE_LISTING.md)에 정리되어 있습니다. 배포 ZIP은 PowerShell에서 다음 명령으로 생성합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\package-release.ps1
```

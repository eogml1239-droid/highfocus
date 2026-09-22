# fashion-trend-tracker

20~40대 오피스룩 판매를 위한 시즌 키워드 트렌드 추정 Worker.

## 동작 방식

- 실시간 검색 API(네이버 데이터랩 등) 없이, **월별 카테고리·디자인 키워드 시즌 캘린더**(`src/domain/season-calendar.ts`)를 기준으로 매일 검색 비중을 추정한다.
- 기상청 단기예보 API 키(`KMA_SERVICE_KEY`)를 등록하면 당일 기온으로 키워드별 점수를 보정한다. 키가 없으면 캘린더 기본값만으로 동작한다.
- 매일 Cron Trigger(`10 0 * * *` UTC = KST 09:10)로 리포트를 계산해 KV에 저장하고, 전날 스냅샷과 비교한 증감률(%)을 함께 기록한다.
- 다음 달 캘린더와 비교해 검색 비중이 크게 오르는(향후 급증 예상) 키워드도 매 리포트에 포함한다.

## 초기 설정

```powershell
# 저장소 루트가 곧 이 프로젝트다. 하위 폴더로 이동하지 않는다.
npm install

# KV 네임스페이스는 이미 생성되어 wrangler.jsonc에 id가 등록돼 있다.
# 새 계정에서 처음 세팅할 때만 아래를 실행하고, 발급된 id로 교체한다.
npx wrangler kv namespace create TREND_SNAPSHOTS

# (선택) 기상청 서비스키 등록 - 없으면 캘린더 기반으로만 동작
npx wrangler secret put KMA_SERVICE_KEY

# POST /trends/run 인증 토큰 (필수 - 미설정 시 해당 엔드포인트는 항상 401)
npx wrangler secret put ADMIN_TOKEN

npm run cf-typegen
npm run dev
```

## 배포

`main` 브랜치에 커밋이 올라가면 **Cloudflare Workers Builds가 자동으로 빌드·배포**한다.
수동 배포는 필요 없다. 빌드 로그는 Cloudflare 대시보드 → 해당 Worker → Deployment 에서 확인한다.

| 설정 | 값 |
|---|---|
| Git 저장소 | `eogml1239-droid/highfocus` |
| Production 브랜치 | `main` |
| build command | `npm install` |
| deployment command | `npx wrangler deploy` |
| root directory | `/` |

로컬에서 직접 배포해야 할 때만 `npm run deploy`를 쓴다(`wrangler login` 필요).

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/trends/latest` | 가장 최근 저장된 리포트 조회 |
| GET | `/trends/by-date?date=YYYY-MM-DD` | 특정 날짜 리포트 조회 |
| POST | `/trends/run` | 즉시 재계산(테스트/수동 트리거용). `Authorization: Bearer <ADMIN_TOKEN>` 필요 |

> `ADMIN_TOKEN` secret이 없으면 `/trends/run`은 항상 401을 반환한다.

## 날씨 보정 켜기 (`KMA_SERVICE_KEY`)

키가 없으면 `usedWeatherData: false`로 동작하며 점수가 매일 `baseWeight` 고정값이 된다.
이 경우 같은 달 안에서는 점수가 변하지 않으므로 `changePercent`는 계속 `0`이다. 정상 동작이다.

날씨 보정을 켜면 당일 기온으로 키워드별 점수가 매일 달라지고, 그때부터 `changePercent`가 의미를 갖는다.

1. [공공데이터포털](https://www.data.go.kr)에서 **기상청_단기예보 ((구)_동네예보) 조회서비스** 활용 신청
2. 발급된 **일반 인증키(Decoding)** 를 등록한다 — Encoding 키를 넣으면 이중 인코딩되어 실패한다

```powershell
npx wrangler secret put KMA_SERVICE_KEY
```

또는 대시보드에서 워커 → Settings → Variables and Secrets → `KMA_SERVICE_KEY` 추가 (재배포 불필요).

지역을 서울이 아닌 곳으로 바꾸려면 격자 좌표를 변수로 지정한다(기본값 서울 중구 `60, 127`).

| 변수 | 설명 |
|---|---|
| `WEATHER_NX` | 기상청 격자 X 좌표 |
| `WEATHER_NY` | 기상청 격자 Y 좌표 |

> 구현 주의: `TMN`(일 최저)·`TMX`(일 최고)는 발표 시각에 따라 응답에 없을 수 있다.
> cron이 도는 09:10 KST에는 `base_time=0800`이 쓰이는데, 이때 오늘의 `TMN`(06시 항목)은
> 이미 지나가 응답에 포함되지 않는다. 그래서 `TMN`/`TMX`가 없으면 해당 날짜의 시간별
> 기온(`TMP`)에서 min/max를 직접 계산해 폴백한다.

## 한계

- 실제 검색 플랫폼(네이버/구글/무신사 등) 검색량과 연동된 값이 아니라, 계절 반복성에 기반한 추정치다.
- 기상청 API는 최대 며칠 이내 예보만 제공하므로 "한 달 앞 기온"은 예측하지 않고, 당일 기온으로 현재 리포트만 보정한다.
- `season-calendar.ts`의 키워드·baseWeight는 초기값이므로 실제 판매 데이터에 맞춰 주기적으로 조정이 필요하다.

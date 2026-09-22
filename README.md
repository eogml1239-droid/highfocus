# fashion-trend-tracker

20~40대 오피스룩 판매를 위한 시즌 키워드 트렌드 추정 Worker.

## 동작 방식

- 실시간 검색 API(네이버 데이터랩 등) 없이, **월별 카테고리·디자인 키워드 시즌 캘린더**(`src/domain/season-calendar.ts`)를 기준으로 매일 검색 비중을 추정한다.
- 기상청 단기예보 API 키(`KMA_SERVICE_KEY`)를 등록하면 당일 기온으로 키워드별 점수를 보정한다. 키가 없으면 캘린더 기본값만으로 동작한다.
- 매일 Cron Trigger(`10 0 * * *` UTC = KST 09:10)로 리포트를 계산해 KV에 저장하고, 전날 스냅샷과 비교한 증감률(%)을 함께 기록한다.
- 다음 달 캘린더와 비교해 검색 비중이 크게 오르는(향후 급증 예상) 키워드도 매 리포트에 포함한다.

## 초기 설정

```powershell
cd fashion-trend-tracker
npm install

# KV 네임스페이스 생성 후 wrangler.jsonc의 id를 교체
npx wrangler kv namespace create TREND_SNAPSHOTS

# (선택) 기상청 서비스키 등록 - 없으면 캘린더 기반으로만 동작
npx wrangler secret put KMA_SERVICE_KEY

# POST /trends/run 인증 토큰 (필수 - 미설정 시 해당 엔드포인트는 항상 401)
npx wrangler secret put ADMIN_TOKEN

npm run cf-typegen
npm run dev
```

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/trends/latest` | 가장 최근 저장된 리포트 조회 |
| GET | `/trends/by-date?date=YYYY-MM-DD` | 특정 날짜 리포트 조회 |
| POST | `/trends/run` | 즉시 재계산(테스트/수동 트리거용). `Authorization: Bearer <ADMIN_TOKEN>` 필요 |

> `ADMIN_TOKEN` secret이 없으면 `/trends/run`은 항상 401을 반환한다.

## 한계

- 실제 검색 플랫폼(네이버/구글/무신사 등) 검색량과 연동된 값이 아니라, 계절 반복성에 기반한 추정치다.
- 기상청 API는 최대 며칠 이내 예보만 제공하므로 "한 달 앞 기온"은 예측하지 않고, 당일 기온으로 현재 리포트만 보정한다.
- `season-calendar.ts`의 키워드·baseWeight는 초기값이므로 실제 판매 데이터에 맞춰 주기적으로 조정이 필요하다.

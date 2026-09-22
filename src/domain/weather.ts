/**
 * 기상청(공공데이터포털) 단기예보 조회 결과를 이 도메인이 필요로 하는 형태로 축약한 것.
 * 단기예보는 최대 약 3일치까지만 신뢰도 있게 제공되므로, "한 달 앞 기온"을 API로 직접
 * 받아올 수는 없다. 대신 최근 실측/근시일 예보 기온을 시즌 캘린더의 트리거와 비교해
 * "지금 이 기온대에서 뜨는 디자인"을 판별하는 용도로만 사용한다.
 */
export interface DailyTemperature {
	readonly date: string; // YYYY-MM-DD
	readonly minCelsius: number;
	readonly maxCelsius: number;
}

export function averageTemp(day: DailyTemperature): number {
	return (day.minCelsius + day.maxCelsius) / 2;
}

/**
 * 키워드의 triggerTempMax/Min 조건이 현재 기온에서 충족되는지 판단한다.
 * 두 조건 모두 없으면(계절 무관 키워드) 항상 true.
 */
export function isTemperatureTriggered(
	avgTempCelsius: number,
	triggerTempMax?: number,
	triggerTempMin?: number,
): boolean {
	if (triggerTempMax !== undefined && avgTempCelsius > triggerTempMax) {
		return false;
	}
	if (triggerTempMin !== undefined && avgTempCelsius < triggerTempMin) {
		return false;
	}
	return true;
}

interface KmaForecastItem {
	readonly category: string;
	readonly fcstDate: string; // YYYYMMDD
	readonly fcstTime: string; // HHmm
	readonly fcstValue: string;
}

interface KmaResponse {
	readonly response?: {
		readonly header?: { readonly resultCode?: string; readonly resultMsg?: string };
		readonly body?: {
			readonly items?: { readonly item?: readonly KmaForecastItem[] };
		};
	};
}

/** "20260922" → "2026-09-22" */
function toIsoDate(yyyymmdd: string): string {
	return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function toFiniteNumber(raw: string | undefined): number | null {
	if (raw === undefined) {
		return null;
	}
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 기상청 단기예보(getVilageFcst)에서 지정한 날짜의 최저/최고기온을 구한다.
 *
 * TMN(일 최저)·TMX(일 최고)는 하루 중 특정 발표 시각에만 포함된다. 예를 들어
 * base_time=0800으로 조회하면 오늘의 TMN(06시 항목)은 이미 지나가서 응답에 없다.
 * 따라서 TMN/TMX가 있으면 그대로 쓰고, 없으면 **해당 날짜의 시간별 기온(TMP)에서
 * 직접 min/max를 계산**해 폴백한다. 이렇게 하지 않으면 어떤 발표 시각에는 항상
 * null이 되어 날씨 보정이 조용히 비활성화된다.
 *
 * 서비스키가 없거나 호출/파싱이 실패하면 null을 반환하고, 상위 로직은
 * 캘린더 기반 추정으로 폴백한다.
 *
 * 참고: https://www.data.go.kr (기상청_단기예보 ((구)_동네예보) 조회서비스)
 */
export async function fetchShortTermTemperature(
	serviceKey: string,
	nx: number,
	ny: number,
	baseDate: string,
	baseTime: string,
	targetDate: string,
): Promise<DailyTemperature | null> {
	const endpoint =
		"https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
	const params = new URLSearchParams({
		serviceKey,
		// 하루치 전체(시간별 12개 카테고리 × 24시간)를 확보하려면 200으로는 부족하다.
		numOfRows: "1000",
		pageNo: "1",
		dataType: "JSON",
		base_date: baseDate,
		base_time: baseTime,
		nx: String(nx),
		ny: String(ny),
	});

	try {
		const response = await fetch(`${endpoint}?${params.toString()}`);
		if (!response.ok) {
			return null;
		}
		const body = (await response.json()) as KmaResponse;
		// 기상청은 오류도 HTTP 200으로 돌려주므로 resultCode를 반드시 확인한다.
		if (body.response?.header?.resultCode !== "00") {
			return null;
		}

		const forDate = (body.response?.body?.items?.item ?? []).filter(
			(item) => item.fcstDate === targetDate,
		);
		if (forDate.length === 0) {
			return null;
		}

		const hourly = forDate
			.filter((item) => item.category === "TMP")
			.map((item) => toFiniteNumber(item.fcstValue))
			.filter((value): value is number => value !== null);

		const min =
			toFiniteNumber(forDate.find((item) => item.category === "TMN")?.fcstValue) ??
			(hourly.length > 0 ? Math.min(...hourly) : null);
		const max =
			toFiniteNumber(forDate.find((item) => item.category === "TMX")?.fcstValue) ??
			(hourly.length > 0 ? Math.max(...hourly) : null);

		if (min === null || max === null) {
			return null;
		}
		return {
			date: toIsoDate(targetDate),
			minCelsius: min,
			maxCelsius: max,
		};
	} catch {
		return null;
	}
}

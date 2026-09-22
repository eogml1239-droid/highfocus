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

/**
 * 기상청 단기예보(getVilageFcst) 응답 중 TMN(최저)/TMX(최고) 항목만 추출해
 * DailyTemperature로 변환한다. 서비스키가 없거나 호출이 실패하면 null을 반환하고,
 * 상위 로직은 캘린더 기반 추정으로 폴백한다.
 *
 * 참고: https://www.data.go.kr (기상청_단기예보 ((구)_동네예보) 조회서비스)
 */
export async function fetchShortTermTemperature(
	serviceKey: string,
	nx: number,
	ny: number,
	baseDate: string,
	baseTime: string,
): Promise<DailyTemperature | null> {
	const endpoint =
		"https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
	const params = new URLSearchParams({
		serviceKey,
		numOfRows: "200",
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
		const body = (await response.json()) as {
			response?: {
				body?: {
					items?: { item?: readonly { category: string; fcstValue: string }[] };
				};
			};
		};
		const items = body.response?.body?.items?.item ?? [];
		const tmn = items.find((item) => item.category === "TMN")?.fcstValue;
		const tmx = items.find((item) => item.category === "TMX")?.fcstValue;
		if (tmn === undefined || tmx === undefined) {
			return null;
		}
		return {
			date: baseDate,
			minCelsius: Number(tmn),
			maxCelsius: Number(tmx),
		};
	} catch {
		return null;
	}
}

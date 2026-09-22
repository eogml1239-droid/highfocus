import type { ClothingCategory, DesignKeyword, GenderTarget, Instant } from "./common";
import { CATEGORY_LABELS } from "./common";
import { keywordsForMonth } from "./season-calendar";
import { averageTemp, isTemperatureTriggered, type DailyTemperature } from "./weather";

export interface KeywordStat {
	readonly keyword: string;
	readonly category: ClothingCategory;
	readonly categoryLabel: string;
	readonly gender: GenderTarget;
	/** 오늘 추정 검색 비중 지수(0~100대, 상한 없음. 기온 트리거가 걸리면 가중). */
	readonly score: number;
	/** 전날 대비 증감률(%). 전날 데이터가 없으면 null. */
	readonly changePercent: number | null;
	readonly temperatureTriggered: boolean;
}

export interface DailyTrendReport {
	readonly date: string; // YYYY-MM-DD
	readonly generatedAt: Instant;
	readonly month: number;
	readonly usedWeatherData: boolean;
	readonly stats: readonly KeywordStat[];
	/** 향후 최대 30일 이내 기온 하락/상승 국면에서 급증이 예상되는 키워드. */
	readonly upcomingSurgeKeywords: readonly UpcomingSurgeKeyword[];
}

export interface UpcomingSurgeKeyword {
	readonly keyword: string;
	readonly categoryLabel: string;
	readonly reason: string;
	/** 다음 달로 넘어가면서 트리거되는 경우의 예상 시점(YYYY-MM). */
	readonly expectedMonth: string;
}

/** 기온 트리거가 걸린 키워드에 부여하는 가중치(단순 곱). */
const TEMPERATURE_TRIGGER_BOOST = 1.15;

function computeScore(kw: DesignKeyword, avgTemp: number | null): {
	score: number;
	temperatureTriggered: boolean;
} {
	if (avgTemp === null) {
		return { score: kw.baseWeight, temperatureTriggered: false };
	}
	const triggered = isTemperatureTriggered(avgTemp, kw.triggerTempMax, kw.triggerTempMin);
	const score = triggered ? kw.baseWeight * TEMPERATURE_TRIGGER_BOOST : kw.baseWeight * 0.85;
	return { score: Math.round(score * 10) / 10, temperatureTriggered: triggered };
}

/**
 * 지정한 날짜의 트렌드 리포트를 계산한다.
 * @param date 리포트 대상 날짜(로컬 기준, YYYY-MM-DD)
 * @param month 1~12
 * @param today 오늘의 기온(없으면 캘린더 기본값만 사용)
 * @param previousStats 전날 스냅샷의 stats (증감률 계산용, 없으면 최초 실행)
 */
export function buildDailyTrendReport(
	date: string,
	month: number,
	today: DailyTemperature | null,
	previousStats: readonly KeywordStat[] | null,
	generatedAt: Instant,
): DailyTrendReport {
	const keywords = keywordsForMonth(month);
	const avgTemp = today ? averageTemp(today) : null;
	const prevByKeyword = new Map((previousStats ?? []).map((s) => [s.keyword, s]));

	const stats: KeywordStat[] = keywords.map((kw) => {
		const { score, temperatureTriggered } = computeScore(kw, avgTemp);
		const prev = prevByKeyword.get(kw.keyword);
		const changePercent =
			prev && prev.score > 0 ? Math.round(((score - prev.score) / prev.score) * 1000) / 10 : null;
		return {
			keyword: kw.keyword,
			category: kw.category,
			categoryLabel: CATEGORY_LABELS[kw.category],
			gender: kw.gender,
			score,
			changePercent,
			temperatureTriggered,
		};
	});

	return {
		date,
		generatedAt,
		month,
		usedWeatherData: today !== null,
		stats: stats.sort((a, b) => b.score - a.score),
		upcomingSurgeKeywords: computeUpcomingSurge(date, month),
	};
}

/**
 * 다음 달로 넘어갈 때 baseWeight가 크게 오르는(계절 전환) 키워드를 찾아
 * "앞으로 뜰 가능성이 있는 키워드"로 제시한다. 순수 캘린더 비교이므로
 * 날씨 데이터 여부와 무관하게 항상 계산 가능하다.
 */
function computeUpcomingSurge(date: string, month: number): readonly UpcomingSurgeKeyword[] {
	const nextMonth = month === 12 ? 1 : month + 1;
	// 12월 리포트의 "다음 달"은 이듬해 1월이므로 연도를 넘긴다.
	const nextYear = Number(date.slice(0, 4)) + (month === 12 ? 1 : 0);
	const expectedMonth = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

	const current = keywordsForMonth(month);
	const next = keywordsForMonth(nextMonth);
	const currentByKeyword = new Map(current.map((k) => [k.keyword, k.baseWeight]));

	const surges: (UpcomingSurgeKeyword & { readonly increase: number })[] = [];
	for (const kw of next) {
		const currentWeight = currentByKeyword.get(kw.keyword) ?? 0;
		const increase = kw.baseWeight - currentWeight;
		if (increase >= 15) {
			surges.push({
				keyword: kw.keyword,
				categoryLabel: CATEGORY_LABELS[kw.category],
				reason:
					currentWeight === 0
						? `${nextMonth}월에 새로 시즌 진입이 예상되는 디자인`
						: `${nextMonth}월로 갈수록 검색 비중이 커질 것으로 예상 (현재 ${currentWeight} → ${kw.baseWeight})`,
				expectedMonth,
				increase,
			});
		}
	}
	// 모두 같은 달이므로 월 문자열이 아니라 상승폭이 큰 순으로 정렬한다.
	return surges
		.sort((a, b) => b.increase - a.increase)
		.map(({ increase: _increase, ...surge }) => surge);
}

import { buildDailyTrendReport, type DailyTrendReport } from "../domain/trend-report";
import { fetchShortTermTemperature } from "../domain/weather";
import type { Env } from "../infrastructure";
import { loadSnapshot, previousDateOf, saveSnapshot } from "../infrastructure/snapshot-store";

const SEOUL_NX = 60;
const SEOUL_NY = 127;

function formatDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** 기상청 base_time은 3시간 단위로만 유효(02,05,08,11,14,17,20,23시). 가장 최근 발표 시각으로 맞춘다. */
function latestBaseTime(now: Date): { baseDate: string; baseTime: string } {
	const slots = [23, 20, 17, 14, 11, 8, 5, 2];
	const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
	const kstHour = kst.getUTCHours();
	const slot = slots.find((s) => kstHour >= s);

	const baseDateObj = new Date(kst);
	if (slot === undefined) {
		// 00시~01시대에는 전날 23시 발표가 최신이다.
		baseDateObj.setUTCDate(baseDateObj.getUTCDate() - 1);
	}
	const baseDate = formatDate(baseDateObj).replace(/-/g, "");
	return { baseDate, baseTime: `${String(slot ?? 23).padStart(2, "0")}00` };
}

/**
 * 오늘 날짜(KST 기준)에 대한 트렌드 리포트를 계산하고 KV에 저장한다.
 * 날씨 API 키가 없거나 호출이 실패하면 캘린더 기반 값으로 자동 폴백한다.
 */
export async function generateAndStoreTodayReport(env: Env, now: Date = new Date()): Promise<DailyTrendReport> {
	const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
	const date = formatDate(kstNow);
	const month = kstNow.getUTCMonth() + 1;

	let temperature = null;
	if (env.KMA_SERVICE_KEY) {
		const { baseDate, baseTime } = latestBaseTime(now);
		const nx = env.WEATHER_NX ? Number(env.WEATHER_NX) : SEOUL_NX;
		const ny = env.WEATHER_NY ? Number(env.WEATHER_NY) : SEOUL_NY;
		temperature = await fetchShortTermTemperature(env.KMA_SERVICE_KEY, nx, ny, baseDate, baseTime);
	}

	const previous = await loadSnapshot(env.TREND_SNAPSHOTS, previousDateOf(date));
	const report = buildDailyTrendReport(date, month, temperature, previous?.stats ?? null, now.toISOString());

	await saveSnapshot(env.TREND_SNAPSHOTS, report);
	return report;
}

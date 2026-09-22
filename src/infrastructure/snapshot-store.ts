import type { DailyTrendReport } from "../domain/trend-report";

const KEY_PREFIX = "snapshot:";
const LATEST_KEY = "latest";
/** 90일 후 자동 만료(스토리지 무한 증가 방지). */
const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24 * 90;

function keyFor(date: string): string {
	return `${KEY_PREFIX}${date}`;
}

export async function saveSnapshot(
	kv: KVNamespace,
	report: DailyTrendReport,
): Promise<void> {
	const payload = JSON.stringify(report);
	await kv.put(keyFor(report.date), payload, { expirationTtl: SNAPSHOT_TTL_SECONDS });
	await kv.put(LATEST_KEY, payload, { expirationTtl: SNAPSHOT_TTL_SECONDS });
}

export async function loadSnapshot(
	kv: KVNamespace,
	date: string,
): Promise<DailyTrendReport | null> {
	return kv.get<DailyTrendReport>(keyFor(date), "json");
}

export async function loadLatestSnapshot(
	kv: KVNamespace,
): Promise<DailyTrendReport | null> {
	return kv.get<DailyTrendReport>(LATEST_KEY, "json");
}

export function previousDateOf(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

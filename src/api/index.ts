import { generateAndStoreTodayReport } from "../application";
import type { Env } from "../infrastructure";
import { loadLatestSnapshot, loadSnapshot } from "../infrastructure/snapshot-store";

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" },
	});
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** ADMIN_TOKEN이 설정되지 않은 경우 항상 거부한다(안전한 기본값). */
function isAuthorized(request: Request, env: Env): boolean {
	if (!env.ADMIN_TOKEN) {
		return false;
	}
	const header = request.headers.get("authorization") ?? "";
	return header === `Bearer ${env.ADMIN_TOKEN}`;
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);

	if (url.pathname === "/trends/latest") {
		const report = await loadLatestSnapshot(env.TREND_SNAPSHOTS);
		if (!report) {
			return json({ error: "아직 생성된 리포트가 없습니다. /trends/run으로 먼저 생성하세요." }, 404);
		}
		return json(report);
	}

	if (url.pathname === "/trends/by-date") {
		const date = url.searchParams.get("date") ?? "";
		if (!DATE_PATTERN.test(date)) {
			return json({ error: "date 쿼리 파라미터는 YYYY-MM-DD 형식이어야 합니다." }, 400);
		}
		const report = await loadSnapshot(env.TREND_SNAPSHOTS, date);
		if (!report) {
			return json({ error: `${date} 스냅샷이 없습니다.` }, 404);
		}
		return json(report);
	}

	if (url.pathname === "/trends/run" && request.method === "POST") {
		if (!isAuthorized(request, env)) {
			return json({ error: "Unauthorized" }, 401);
		}
		const report = await generateAndStoreTodayReport(env);
		return json(report);
	}

	return json(
		{
			error: "Not Found",
			availableRoutes: [
				"GET /trends/latest",
				"GET /trends/by-date?date=YYYY-MM-DD",
				"POST /trends/run",
			],
		},
		404,
	);
}

import { handleRequest } from "./api";
import { generateAndStoreTodayReport } from "./application";
import type { Env } from "./infrastructure";

/**
 * 오피스룩 시즌 키워드 트렌드 트래커.
 *
 * - scheduled: 매일 Cron Trigger(wrangler.jsonc의 triggers.crons)로 실행되어
 *   당일 트렌드 리포트를 계산하고 KV에 저장한다.
 * - fetch: 저장된 리포트를 조회하거나(GET) 수동으로 재계산(POST /trends/run)한다.
 */
export default {
	async fetch(request, env): Promise<Response> {
		return handleRequest(request, env);
	},

	async scheduled(_controller, env, ctx): Promise<void> {
		ctx.waitUntil(generateAndStoreTodayReport(env));
	},
} satisfies ExportedHandler<Env>;

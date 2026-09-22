import type { DesignKeyword } from "./common";

/**
 * 월별(1~12) 오피스룩 디자인 키워드 시즌 캘린더.
 *
 * 국내 패션 이커머스(무신사/W컨셉/지그재그/에이블리 등)의 연간 검색 트렌드는
 * 매년 계절 반복성이 강하다는 전제로, 실시간 검색 API 없이도 월별 상승/하강
 * 패턴을 근사할 수 있도록 구성한 참조 데이터다.
 *
 * baseWeight(0~100)는 해당 월의 상대적 기본 검색 비중 추정치이며,
 * 실측 데이터가 아니라 계절 패턴에 기반한 휴리스틱이다.
 * triggerTempMax/triggerTempMin은 일평균 체감기온(섭씨) 기준으로,
 * 날씨 데이터가 있으면 이 값과 비교해 급증 예상 키워드를 보정한다.
 */
export const SEASON_CALENDAR: Readonly<Record<number, readonly DesignKeyword[]>> = {
	1: [
		{ keyword: "패딩", category: "outer", gender: "both", baseWeight: 92, triggerTempMax: 5 },
		{ keyword: "코트", category: "outer", gender: "both", baseWeight: 80, triggerTempMax: 10 },
		{ keyword: "터틀넥", category: "top", gender: "both", baseWeight: 85, triggerTempMax: 8 },
		{ keyword: "목폴라", category: "top", gender: "women", baseWeight: 78, triggerTempMax: 8 },
		{ keyword: "숏패딩", category: "outer", gender: "both", baseWeight: 70, triggerTempMax: 5 },
		{ keyword: "니트원피스", category: "dress_skirt", gender: "women", baseWeight: 60, triggerTempMax: 10 },
	],
	2: [
		{ keyword: "코트", category: "outer", gender: "both", baseWeight: 88, triggerTempMax: 12 },
		{ keyword: "가디건", category: "knit", gender: "both", baseWeight: 65, triggerTempMax: 15 },
		{ keyword: "터틀넥", category: "top", gender: "both", baseWeight: 72, triggerTempMax: 10 },
		{ keyword: "니트", category: "knit", gender: "both", baseWeight: 80, triggerTempMax: 13 },
		{ keyword: "트렌치코트", category: "outer", gender: "both", baseWeight: 45, triggerTempMax: 15 },
	],
	3: [
		{ keyword: "트렌치코트", category: "outer", gender: "both", baseWeight: 82, triggerTempMax: 18 },
		{ keyword: "가디건", category: "knit", gender: "both", baseWeight: 85, triggerTempMax: 18 },
		{ keyword: "블라우스", category: "top", gender: "women", baseWeight: 70, triggerTempMin: 10 },
		{ keyword: "슬랙스", category: "pants", gender: "both", baseWeight: 68, triggerTempMin: 8 },
		{ keyword: "하프넥", category: "top", gender: "women", baseWeight: 55, triggerTempMax: 16 },
	],
	4: [
		{ keyword: "블라우스", category: "top", gender: "women", baseWeight: 85, triggerTempMin: 12 },
		{ keyword: "자켓", category: "outer", gender: "both", baseWeight: 78, triggerTempMin: 10, triggerTempMax: 20 },
		{ keyword: "슬랙스", category: "pants", gender: "both", baseWeight: 80, triggerTempMin: 12 },
		{ keyword: "가디건", category: "knit", gender: "both", baseWeight: 60, triggerTempMax: 18 },
		{ keyword: "원피스", category: "dress_skirt", gender: "women", baseWeight: 65, triggerTempMin: 14 },
	],
	5: [
		{ keyword: "린넨자켓", category: "outer", gender: "both", baseWeight: 75, triggerTempMin: 16 },
		{ keyword: "반팔블라우스", category: "top", gender: "women", baseWeight: 78, triggerTempMin: 18 },
		{ keyword: "슬랙스", category: "pants", gender: "both", baseWeight: 82, triggerTempMin: 15 },
		{ keyword: "원피스", category: "dress_skirt", gender: "women", baseWeight: 80, triggerTempMin: 17 },
		{ keyword: "니트베스트", category: "knit", gender: "both", baseWeight: 40, triggerTempMax: 20 },
	],
	6: [
		{ keyword: "린넨셔츠", category: "top", gender: "both", baseWeight: 85, triggerTempMin: 20 },
		{ keyword: "슬리브리스", category: "top", gender: "women", baseWeight: 70, triggerTempMin: 23 },
		{ keyword: "쿨소재슬랙스", category: "pants", gender: "both", baseWeight: 75, triggerTempMin: 20 },
		{ keyword: "원피스", category: "dress_skirt", gender: "women", baseWeight: 82, triggerTempMin: 21 },
		{ keyword: "하프넥", category: "top", gender: "women", baseWeight: 45, triggerTempMin: 18, triggerTempMax: 24 },
	],
	7: [
		{ keyword: "린넨셔츠", category: "top", gender: "both", baseWeight: 88, triggerTempMin: 24 },
		{ keyword: "슬리브리스", category: "top", gender: "women", baseWeight: 85, triggerTempMin: 26 },
		{ keyword: "쿨소재슬랙스", category: "pants", gender: "both", baseWeight: 80, triggerTempMin: 24 },
		{ keyword: "린넨원피스", category: "dress_skirt", gender: "women", baseWeight: 82, triggerTempMin: 25 },
		{ keyword: "쿨자켓", category: "outer", gender: "both", baseWeight: 40, triggerTempMin: 26 },
	],
	8: [
		{ keyword: "린넨셔츠", category: "top", gender: "both", baseWeight: 85, triggerTempMin: 25 },
		{ keyword: "슬리브리스", category: "top", gender: "women", baseWeight: 82, triggerTempMin: 27 },
		{ keyword: "쿨자켓", category: "outer", gender: "both", baseWeight: 50, triggerTempMin: 26 },
		{ keyword: "린넨원피스", category: "dress_skirt", gender: "women", baseWeight: 80, triggerTempMin: 26 },
		{ keyword: "하프넥", category: "top", gender: "women", baseWeight: 55, triggerTempMax: 22 },
	],
	9: [
		{ keyword: "가디건", category: "knit", gender: "both", baseWeight: 80, triggerTempMax: 22 },
		{ keyword: "하프넥", category: "top", gender: "women", baseWeight: 78, triggerTempMax: 20 },
		{ keyword: "자켓", category: "outer", gender: "both", baseWeight: 72, triggerTempMax: 22 },
		{ keyword: "슬랙스", category: "pants", gender: "both", baseWeight: 75, triggerTempMax: 24 },
		{ keyword: "니트", category: "knit", gender: "both", baseWeight: 60, triggerTempMax: 18 },
	],
	10: [
		{ keyword: "니트", category: "knit", gender: "both", baseWeight: 88, triggerTempMax: 16 },
		{ keyword: "가디건", category: "knit", gender: "both", baseWeight: 85, triggerTempMax: 18 },
		{ keyword: "후드집업", category: "outer", gender: "both", baseWeight: 75, triggerTempMax: 15 },
		{ keyword: "트렌치코트", category: "outer", gender: "both", baseWeight: 70, triggerTempMax: 16 },
		{ keyword: "하프넥", category: "top", gender: "women", baseWeight: 65, triggerTempMax: 17 },
		{ keyword: "터틀넥", category: "top", gender: "both", baseWeight: 60, triggerTempMax: 14 },
	],
	11: [
		{ keyword: "코트", category: "outer", gender: "both", baseWeight: 90, triggerTempMax: 12 },
		{ keyword: "니트", category: "knit", gender: "both", baseWeight: 85, triggerTempMax: 12 },
		{ keyword: "터틀넥", category: "top", gender: "both", baseWeight: 82, triggerTempMax: 10 },
		{ keyword: "후드집업", category: "outer", gender: "both", baseWeight: 68, triggerTempMax: 10 },
		{ keyword: "패딩", category: "outer", gender: "both", baseWeight: 70, triggerTempMax: 8 },
	],
	12: [
		{ keyword: "패딩", category: "outer", gender: "both", baseWeight: 95, triggerTempMax: 5 },
		{ keyword: "코트", category: "outer", gender: "both", baseWeight: 82, triggerTempMax: 8 },
		{ keyword: "터틀넥", category: "top", gender: "both", baseWeight: 88, triggerTempMax: 6 },
		{ keyword: "목폴라", category: "top", gender: "women", baseWeight: 80, triggerTempMax: 6 },
		{ keyword: "니트원피스", category: "dress_skirt", gender: "women", baseWeight: 65, triggerTempMax: 8 },
	],
};

export function keywordsForMonth(month: number): readonly DesignKeyword[] {
	const entry = SEASON_CALENDAR[month];
	if (!entry) {
		throw new RangeError(`month must be 1-12, received ${month}`);
	}
	return entry;
}

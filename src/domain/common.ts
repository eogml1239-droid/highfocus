export type Instant = string;

/**
 * 오피스룩 카테고리. 실제 상품 분류 체계에 맞춰 필요 시 확장한다.
 */
export const CLOTHING_CATEGORIES = [
	"outer",
	"top",
	"knit",
	"dress_skirt",
	"pants",
	"shoes_bag",
] as const;

export type ClothingCategory = (typeof CLOTHING_CATEGORIES)[number];

export const CATEGORY_LABELS: Readonly<Record<ClothingCategory, string>> = {
	outer: "아우터",
	top: "상의",
	knit: "니트/스웨터",
	dress_skirt: "원피스/스커트",
	pants: "팬츠",
	shoes_bag: "신발/잡화",
};

/**
 * 성별 타겟. 오피스룩 판매 특성상 유니섹스 디자인은 both로 표기한다.
 */
export const GENDER_TARGETS = ["women", "men", "both"] as const;

export type GenderTarget = (typeof GENDER_TARGETS)[number];

/**
 * 디자인 키워드 하나의 정의.
 * baseWeight는 해당 시즌/카테고리 내에서의 상대적 기본 검색 비중(0~100)을 의미하는
 * 휴리스틱 값이며, 실측 검색 지수가 없는 상태에서의 시즌 캘린더 기반 추정치다.
 */
export interface DesignKeyword {
	readonly keyword: string;
	readonly category: ClothingCategory;
	readonly gender: GenderTarget;
	readonly baseWeight: number;
	/** 이 키워드가 급증하기 시작하는 기준 체감기온(섭씨). 낮을수록 추울 때 뜨는 디자인. */
	readonly triggerTempMax?: number;
	/** 이 키워드가 급증하기 시작하는 기준 체감기온 하한(섭씨). 높을수록 더울 때 뜨는 디자인. */
	readonly triggerTempMin?: number;
}

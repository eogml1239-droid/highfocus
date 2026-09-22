export interface ResourceBindings {
	readonly TREND_SNAPSHOTS: KVNamespace;
}

export interface RuntimeVars {
	/** 기상청 단기예보 격자 좌표. 기본값은 서울(중구) 기준. */
	readonly WEATHER_NX?: string;
	readonly WEATHER_NY?: string;
}

/** 공공데이터포털에서 발급받은 기상청 단기예보 서비스키. 없으면 캘린더 기반으로만 동작한다. */
export interface SecretBindings {
	readonly KMA_SERVICE_KEY?: string;
	/** POST /trends/run 호출 인증용 토큰. 미설정 시 해당 엔드포인트는 항상 401을 반환한다. */
	readonly ADMIN_TOKEN?: string;
}

export interface Env extends ResourceBindings, RuntimeVars, SecretBindings {}

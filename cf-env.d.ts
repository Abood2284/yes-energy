// import * as schema from "./schema";

declare global {
	namespace NodeJS {
		interface ProcessEnv extends CloudflareEnv {}
	}
}

export type {};

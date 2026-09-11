// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { UserAccount } from "@novwrite/bridge";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: UserAccount | null;
			token: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

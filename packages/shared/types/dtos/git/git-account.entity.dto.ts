import type { AccountTypeDto } from "@shared/types";

export type GitAccountEntityDto = {
	id: string;
	platformName: string;
	username: string;
	password: string;
	type: AccountTypeDto;
	token: string;
	/**
	 * @format date-time
	 * @example "2023-10-05 14:48:00"
	 */
	createdAt: string;
	/**
	 * @format date-time
	 * @example "2023-10-05 14:48:00"
	 */
	updatedAt: string;
};

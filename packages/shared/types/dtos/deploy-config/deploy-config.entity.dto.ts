import type { RefType } from "@shared/types/dtos/deploy-config/deploy-config.enum.ts";


export type DeployConfigEntityDto = {
	id: string;
	name: string;
	projectId: string;
	gitAccountId: string;
	vmAccountId: string;
	repoUrl: string;
	refType: RefType;
	refName: string;
	deployScript: string;
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

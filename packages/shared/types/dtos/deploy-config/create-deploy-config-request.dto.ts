import type { RefType } from "@shared/types/dtos/deploy-config/deploy-config.enum.ts";

export type CreateDeployConfigRequestDto = {
	name: string;
	projectId: string;
	gitAccountId: string;
	vmAccountId: string;
	repoUrl: string;
	refType: RefType;
	refName: string;
	deployScript: string;
};

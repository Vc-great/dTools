import type { ProjectDeployConfigDto, ProjectType } from "@shared/types";

export type ProjectResponseDto = {
	id: string;
	name: string;
	type: ProjectType;
	parentId?: string;
	deployConfigs: ProjectDeployConfigDto[];
	createdAt: string;
	updatedAt: string;
};

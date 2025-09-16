import type { DeployStatusEnum } from "@shared/types";

export type GetDeployScriptLogResponseVo = {
	log: string;
	status: DeployStatusEnum;
};

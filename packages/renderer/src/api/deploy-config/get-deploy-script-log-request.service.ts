import { trpcClient } from "@renderer/utils/trpc-client.ts";

import type { GetDeployScriptLogRequestDto } from "@shared/types";

export async function getDeployScriptLogService(
	data: GetDeployScriptLogRequestDto,
) {
	return await trpcClient.getDeployScriptLog.query(data);
}

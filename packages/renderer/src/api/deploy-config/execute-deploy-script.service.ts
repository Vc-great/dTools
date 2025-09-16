import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { ExecuteDeployScriptRequestDto } from "@shared/types";

export async function executeDeployScriptService(
	data: ExecuteDeployScriptRequestDto,
): Promise<{message:string}> {
	return trpcClient.executeDeployScript.mutate(data);
}

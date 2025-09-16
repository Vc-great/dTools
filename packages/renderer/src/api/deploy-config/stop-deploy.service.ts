import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { ExecuteDeployScriptRequestDto } from "@shared/types";

export async function stopDeployService(
  id:string,
): Promise<{message:string}> {
  return trpcClient.stopDeploy.mutate(id);
}

import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { DeleteDeployConfigRequestDto } from "@shared/types";

export async function deleteDeployConfigService(
	data: DeleteDeployConfigRequestDto,
) {
	return await trpcClient.deleteDeployConfig.mutate(data);
}

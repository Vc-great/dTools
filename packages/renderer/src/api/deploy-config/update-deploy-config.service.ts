import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { UpdateDeployConfigRequestDto } from "@shared/types";

export async function updateDeployConfigService(
	data: UpdateDeployConfigRequestDto,
) {
	return await trpcClient.updateDeployConfig.mutate(data);
}

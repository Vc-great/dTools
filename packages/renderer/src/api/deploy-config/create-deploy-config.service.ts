import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { CreateDeployConfigRequestDto } from "@shared/types";

export async function createDeployConfigService(
	data: CreateDeployConfigRequestDto,
) {
	return await trpcClient.createDeployConfig.mutate(data);
}

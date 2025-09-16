import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { GetDeployConfigByIdRequestDto } from "@shared/types";

export async function getDeployConfigByIdService(
	data: GetDeployConfigByIdRequestDto,
) {
	return await trpcClient.getDeployConfigById.query(data);
}

import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { UpdateDataPathRequestDto } from "@shared/types";

export async function updateDataFolderPathService(
	data: UpdateDataPathRequestDto,
) {
	return await trpcClient.updateDataFolderPath.mutate(data);
}

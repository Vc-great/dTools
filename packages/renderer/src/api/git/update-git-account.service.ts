import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { UpdateGitAccountRequestDto } from "@shared/types";

export async function updateGitAccountService(
	data: UpdateGitAccountRequestDto,
) {
	return await trpcClient.updateGitAuthentication.mutate(data);
}

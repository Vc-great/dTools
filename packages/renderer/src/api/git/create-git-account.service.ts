import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { CreateGitAccountRequestDto } from "@shared/types";

export async function createGitAccountService(
	data: CreateGitAccountRequestDto,
) {
	return await trpcClient.createGitAuthentication.mutate(data);
}

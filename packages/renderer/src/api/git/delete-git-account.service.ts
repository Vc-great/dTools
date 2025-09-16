import { trpcClient } from "@renderer/utils/trpc-client";

import type { DeleteGitAccountRequestDto } from "@shared/types/dtos/git/delete-git-account-request.dto.ts";

export async function deleteGitAccountService(
	data: DeleteGitAccountRequestDto,
) {
	return await trpcClient.deleteGitAuthentication.mutate(data);
}

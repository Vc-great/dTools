import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { GetGitRemoteInfoRequestDto } from "@shared/types";

export async function getGitRemoteInfoService(
	params: GetGitRemoteInfoRequestDto,
) {
	return trpcClient.getGitRemoteInfo.query(params);
}

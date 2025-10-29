import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { TestConnectionRequestDto } from "@shared/types";

export function testGitConnectionService(data: TestConnectionRequestDto) {
	return trpcClient.testConnection.mutate(data);
}

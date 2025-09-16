import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { TestConnectionRequestDto } from "@shared/types";

export function testGitConnectionService(data: TestConnectionRequestDto) {
	console.log("-> data", data);
	return trpcClient.testConnection.mutate(data);
}

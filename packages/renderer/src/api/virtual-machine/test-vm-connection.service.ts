import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type {
	TestVmConnectionRequestDto,
	TestVmConnectionResponseVo,
} from "@shared/types";

export async function testVmConnectionService(
	data: TestVmConnectionRequestDto,
): Promise<TestVmConnectionResponseVo> {
	return trpcClient.testVmConnection.mutate(data);
}

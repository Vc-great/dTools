import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { CreateVirtualMachineRequestDto } from "@shared/types";

export async function createVirtualMachineService(
	data: CreateVirtualMachineRequestDto,
) {
	return trpcClient.createVirtualMachine.mutate(data);
}

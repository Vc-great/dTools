import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type { DeleteVirtualMachineRequestDto } from "@shared/types";

export async function deleteVirtualMachinesService(
	data: DeleteVirtualMachineRequestDto,
) {
	return trpcClient.deleteVirtualMachine.mutate(data);
}

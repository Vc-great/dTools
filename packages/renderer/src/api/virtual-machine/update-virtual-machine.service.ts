import { trpcClient } from "@renderer/utils/trpc-client.ts";
import type {
	CreateVirtualMachineRequestDto,
	UpdateVirtualMachineRequestDto,
} from "@shared/types";

export async function updateVirtualMachineService(
	data: UpdateVirtualMachineRequestDto,
) {
	return trpcClient.updateVirtualMachine.mutate(data);
}

import { trpcClient } from "@renderer/utils/trpc-client.ts";

export async function findAllVirtualMachinesService() {
	return trpcClient.findAllVirtualMachines.query();
}

import { trpcClient } from "@renderer/utils/trpc-client";

export async function findProjectByIdService(params: { id: string }) {
	return trpcClient.findProjectById.query(params);
}

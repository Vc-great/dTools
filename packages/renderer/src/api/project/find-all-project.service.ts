import { trpcClient } from "@renderer/utils/trpc-client";

export async function findAllProjectService() {
	return trpcClient.findAllProjects.query();
}

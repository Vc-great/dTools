import { trpcClient } from "@renderer/utils/trpc-client";

export async function getSettingsService() {
	return await trpcClient.getSettings.query();
}

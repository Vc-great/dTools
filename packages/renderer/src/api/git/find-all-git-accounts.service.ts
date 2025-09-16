import { trpcClient } from "@renderer/utils/trpc-client.ts";

export async function findAllGitAccountsService() {
  return await trpcClient.findAllGitAuthentications.query();
}

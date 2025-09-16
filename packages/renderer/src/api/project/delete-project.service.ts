import { trpcClient } from "@renderer/utils/trpc-client";

import type { DeleteProjectRequestDto } from "@shared/types";

export async function deleteProjectService(data: DeleteProjectRequestDto) {
  return await trpcClient.deleteProject.mutate(data);
}

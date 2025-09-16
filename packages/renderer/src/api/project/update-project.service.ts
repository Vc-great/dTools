import { trpcClient } from "@renderer/utils/trpc-client";
import type { UpdateProjectRequestDto } from "@shared/types";

export async function updateProjectService(data: UpdateProjectRequestDto) {
  return await trpcClient.updateProject.mutate(data);
}

import { trpcClient } from "@renderer/utils/trpc-client";
import type { CreateProjectRequestDto } from "@shared/types";

export async function createProjectService(data: CreateProjectRequestDto) {
  return await trpcClient.createProject.mutate(data);
}

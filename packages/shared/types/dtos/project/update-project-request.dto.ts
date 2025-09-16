import type { ProjectType } from "@shared/types";

export type UpdateProjectRequestDto = {
  id: string;
  name: string;
  type: ProjectType;
  parentId?: string;
};

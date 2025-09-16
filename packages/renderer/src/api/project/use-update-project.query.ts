import { updateProjectService } from "@renderer/api/project/update-project.service.ts";

import type {
  ProjectResponseDto,
  UpdateProjectRequestDto,
} from "@shared/types";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

export const updateProjectQueryKey = () => ["updateProjectQueryKey"] as const;

type TData = ProjectResponseDto;
type TError = unknown;
type TVariables = UpdateProjectRequestDto;
type TContext = unknown;

export function useUpdateProjectQuery({
  mutation,
}: {
  mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationKey: updateProjectQueryKey(),
    mutationFn: (data: TVariables) => updateProjectService(data),
    ...mutation,
  });
}

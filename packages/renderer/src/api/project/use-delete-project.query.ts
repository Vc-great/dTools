import { deleteProjectService } from "@renderer/api/project/delete-project.service.ts";
import type { DeleteProjectRequestDto } from "@shared/types/dtos/project/delete-project-request.dto.ts";
import type { DeleteProjectResponseVo } from "@shared/types/dtos/project/delete-project-response.vo.ts";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

export const deleteProjectQueryKey = () => ["deleteProjectQueryKey"] as const;

type TData = DeleteProjectResponseVo;
type TError = unknown;
type TVariables = DeleteProjectRequestDto;
type TContext = unknown;

export function useDeleteProjectQuery({
  mutation,
}: {
  mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationKey: deleteProjectQueryKey(),
    mutationFn: (data: TVariables) => deleteProjectService(data),
    ...mutation,
  });
}

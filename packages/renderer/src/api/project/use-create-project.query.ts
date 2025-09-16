import type {
  CreateProjectRequestDto,
  ProjectResponseDto,
} from "@shared/types";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { createProjectService } from "./create-project.service.ts";

export const createProjectQueryKey = () => ["createProjectQueryKey"] as const;

type TData = ProjectResponseDto;
type TError = unknown;
type TVariables = CreateProjectRequestDto;
type TContext = unknown;

export function useCreateProjectQuery({
  mutation,
}: {
  mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationKey: createProjectQueryKey(),
    mutationFn: (data: TVariables) => createProjectService(data),
    ...mutation,
  });
}

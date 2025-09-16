import type {
	DeleteProjectRequestDto,
	DeleteProjectResponseVo,
} from "@shared/types";

import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { deleteGitAccountService } from "./delete-git-account.service.ts";

export const deleteGitAuthenticationQueryKey = () =>
	["deleteProjectQueryKey"] as const;

type TData = DeleteProjectResponseVo;
type TError = unknown;
type TVariables = DeleteProjectRequestDto;
type TContext = unknown;

export function useDeleteGitAccountQuery(option?: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation = {} } = option || {};
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: deleteGitAuthenticationQueryKey(),
		mutationFn: (data: TVariables) => deleteGitAccountService(data),
		...mutation,
	});
}

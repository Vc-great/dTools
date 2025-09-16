import type {
	CreateGitAccountRequestDto,
	GitAccountEntityDto,
} from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { createGitAccountService } from "./create-git-account.service.ts";

export const createGitAuthenticationQueryKey = () =>
	["createProjectQueryKey"] as const;

type TData = GitAccountEntityDto;
type TError = unknown;
type TVariables = CreateGitAccountRequestDto;
type TContext = unknown;

export function useCreateGitAccountQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: createGitAuthenticationQueryKey(),
		mutationFn: (data: TVariables) => createGitAccountService(data),
		...mutation,
	});
}

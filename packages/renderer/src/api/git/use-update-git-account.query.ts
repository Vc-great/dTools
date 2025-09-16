import type {
	GitAccountEntityDto,
	UpdateGitAccountRequestDto,
} from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { updateGitAccountService } from "./update-git-account.service.ts";

export const updateGitAuthenticationQueryKey = () =>
	["updateGitAuthenticationQueryKey"] as const;

type TData = GitAccountEntityDto;
type TError = unknown;
type TVariables = UpdateGitAccountRequestDto;
type TContext = unknown;

export function updateGitAuthenticationQuery({
	mutation,
}: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: updateGitAuthenticationQueryKey(),
		mutationFn: (data: TVariables) => updateGitAccountService(data),
		...mutation,
	});
}

import type { TestConnectionRequestDto } from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { testGitConnectionService } from "./test-git-connection.service.ts";

export const testGitConnectionQueryKey = () =>
	["testGitConnectionQueryKey"] as const;

type TData = boolean;
type TError = unknown;
type TVariables = TestConnectionRequestDto;
type TContext = unknown;

export function useTestGitConnectionQuery({
	mutation,
}: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: testGitConnectionQueryKey(),
		mutationFn: (data: TVariables) => testGitConnectionService(data),
		...mutation,
	});
}

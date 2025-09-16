import type { ExecuteDeployScriptRequestDto } from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { executeDeployScriptService } from "./execute-deploy-script.service.ts";

export const executeDeployScriptQueryKey = () =>
	["executeDeployScriptQueryKey"] as const;

type TData = string;
type TError = unknown;
type TVariables = ExecuteDeployScriptRequestDto;
type TContext = unknown;

export function useExecuteDeployScriptQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: executeDeployScriptQueryKey(),
		mutationFn: (data: TVariables) => executeDeployScriptService(data),
		...mutation,
	});
}

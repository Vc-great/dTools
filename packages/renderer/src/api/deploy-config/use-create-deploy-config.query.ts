import type {
	CreateDeployConfigRequestDto,
	DeployConfigEntityDto,
} from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";

import { createDeployConfigService } from "./create-deploy-config.service.ts";

export const createDeployConfigQueryKey = () =>
	["createDeployConfigQueryKey"] as const;

type TData = DeployConfigEntityDto;
type TError = unknown;
type TVariables = CreateDeployConfigRequestDto;
type TContext = unknown;

export function useCreateDeployConfigQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: createDeployConfigQueryKey(),
		mutationFn: (data: TVariables) => createDeployConfigService(data),
		...mutation,
	});
}

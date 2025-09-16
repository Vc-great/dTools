import type {
	DeployConfigEntityDto,
	UpdateDeployConfigRequestDto,
} from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";

import { updateDeployConfigService } from "./update-deploy-config.service.ts";

export const updateDeployConfigQueryKey = () =>
	["updateDeployConfigQueryKey"] as const;

type TData = DeployConfigEntityDto;
type TError = unknown;
type TVariables = UpdateDeployConfigRequestDto;
type TContext = unknown;

export function useUpdateDeployConfigQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: updateDeployConfigQueryKey(),
		mutationFn: (data: TVariables) => updateDeployConfigService(data),
		...mutation,
	});
}

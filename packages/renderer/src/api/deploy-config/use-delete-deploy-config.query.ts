import type {
	DeleteDeployConfigRequestDto,
	DeleteDeployConfigResponseDto,
} from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";

import { deleteDeployConfigService } from "./delete-deploy-config.service.ts";

export const deleteDeployConfigQueryKey = () =>
	["deleteDeployConfigQueryKey"] as const;

type TData = DeleteDeployConfigResponseDto;
type TError = unknown;
type TVariables = DeleteDeployConfigRequestDto;
type TContext = unknown;

export function useDeleteDeployConfigQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: deleteDeployConfigQueryKey(),
		mutationFn: (data: TVariables) => deleteDeployConfigService(data),
		...mutation,
	});
}

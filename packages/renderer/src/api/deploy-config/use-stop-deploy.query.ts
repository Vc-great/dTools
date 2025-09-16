import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import {stopDeployService} from '@renderer/api/deploy-config/stop-deploy.service.ts';

export const stopDeployQueryKey = () =>
	["stopDeployQueryKey"] as const;

type TData = {
  message:string
};
type TError = unknown;
type TVariables = string;
type TContext = unknown;

export function useStopDeployQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: stopDeployQueryKey(),
		mutationFn: (data: TVariables) => stopDeployService(data),
		...mutation,
	});
}

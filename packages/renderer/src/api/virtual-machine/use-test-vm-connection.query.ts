import type {
	TestVmConnectionRequestDto,
	TestVmConnectionResponseVo,
} from "@shared/types";

import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { testVmConnectionService } from "./test-vm-connection.service.ts";

export const testVmConnectionQueryKey = () =>
	["testVmConnectionQueryKey"] as const;

type TData = TestVmConnectionResponseVo;
type TError = unknown;
type TVariables = TestVmConnectionRequestDto;
type TContext = unknown;

export function useTestVmConnectionQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: testVmConnectionQueryKey(),
		mutationFn: (data: TVariables) => testVmConnectionService(data),
		...mutation,
	});
}

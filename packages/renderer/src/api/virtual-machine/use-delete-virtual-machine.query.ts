import type {
	DeleteVirtualMachineRequestDto,
	DeleteVirtualMachineResponseVo,
} from "@shared/types";

import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { deleteVirtualMachinesService } from "./delete-virtual-machines.service.ts";

export const deleteVirtualMachinesQueryKey = () =>
	["deleteVirtualMachinesQueryKey"] as const;

type TData = DeleteVirtualMachineResponseVo;
type TError = unknown;
type TVariables = DeleteVirtualMachineRequestDto;
type TContext = unknown;

export function useDeleteVirtualMachineQuery({
	mutation,
}: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: deleteVirtualMachinesQueryKey(),
		mutationFn: (data: TVariables) => deleteVirtualMachinesService(data),
		...mutation,
	});
}

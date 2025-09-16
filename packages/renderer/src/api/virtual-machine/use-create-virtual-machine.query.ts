import type {
	CreateVirtualMachineRequestDto,
	VirtualMachineEntityDto,
} from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { createVirtualMachineService } from "./create-virtual-machine.service.ts";

export const createVirtualMachineRequestQuery = () =>
	["createVirtualMachineRequestQuery"] as const;

type TData = VirtualMachineEntityDto;
type TError = unknown;
type TVariables = CreateVirtualMachineRequestDto;
type TContext = unknown;

export function useCreateVirtualMachineQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: createVirtualMachineRequestQuery(),
		mutationFn: (data: TVariables) => createVirtualMachineService(data),
		...mutation,
	});
}

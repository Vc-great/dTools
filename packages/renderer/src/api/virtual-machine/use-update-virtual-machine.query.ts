import type {
	UpdateVirtualMachineRequestDto,
	VirtualMachineEntityDto,
} from "@shared/types";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { updateVirtualMachineService } from "./update-virtual-machine.service.ts";

export const updateVirtualMachineRequestQuery = () =>
	["updateVirtualMachineRequestQuery"] as const;

type TData = VirtualMachineEntityDto;
type TError = unknown;
type TVariables = UpdateVirtualMachineRequestDto;
type TContext = unknown;

export function useUpdateVirtualMachineQuery(option: {
	mutation?: UseMutationOptions<TData, TError, TVariables, TContext>;
}) {
	const { mutation } = option;
	return useMutation<TData, TError, TVariables, TContext>({
		mutationKey: updateVirtualMachineRequestQuery(),
		mutationFn: (data: TVariables) => updateVirtualMachineService(data),
		...mutation,
	});
}

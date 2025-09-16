import { useQuery } from "@tanstack/react-query";
import { findAllVirtualMachinesService } from "./find-all-virtual-machines.service.ts";

export const findAllVirtualMachinesQuery = () =>
	["findAllVirtualMachinesRequestQuery"] as const;

export function useFindAllVirtualMachinesQuery() {
	return useQuery({
		queryKey: findAllVirtualMachinesQuery(),
		queryFn: findAllVirtualMachinesService,
	});
}

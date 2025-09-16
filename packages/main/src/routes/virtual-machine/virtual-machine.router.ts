import { trpc } from "@main/utils/trpc-base";
import {
	createVirtualMachineRequestSchema,
	deleteVirtualMachineRequestSchema,
	testVmConnectionSchema,
	updateVirtualMachineRequestSchema,
} from "@shared/schemas";

import { virtualMachineService } from "./virtual-machine.service.ts";

//trpc router for virtual machine related operations
export const virtualMachineRouter = trpc.router({
	findAllVirtualMachines: trpc.procedure.query(async () => {
		return await virtualMachineService.findAllVirtualMachines();
	}),

	createVirtualMachine: trpc.procedure
		.input(createVirtualMachineRequestSchema)
		.mutation(async ({ input }) => {
			console.log("-> input", input);
			return await virtualMachineService.createVirtualMachine(input);
		}),

	updateVirtualMachine: trpc.procedure
		.input(updateVirtualMachineRequestSchema)
		.mutation(async ({ input }) => {
			return await virtualMachineService.updateVirtualMachine(input);
		}),
	deleteVirtualMachine: trpc.procedure
		.input(deleteVirtualMachineRequestSchema)
		.mutation(async ({ input }) => {
			return await virtualMachineService.deleteVirtualMachine(input);
		}),

	testVmConnection: trpc.procedure
		.input(testVmConnectionSchema)
		.mutation(async ({ input }) => {
			return await virtualMachineService.testVmConnection(input);
		}),
});

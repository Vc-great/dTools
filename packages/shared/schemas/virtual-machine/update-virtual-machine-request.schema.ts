import z from "zod";

export const updateVirtualMachineRequestSchema = z.object({
	id: z.string(),
	name: z.string(),
	host: z.string(),
	port: z.number(),
	username: z.string(),
	password: z.string(),
});

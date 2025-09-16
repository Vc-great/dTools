import z from "zod";
export const createVirtualMachineRequestSchema = z.object({
	name: z.string(),
	host: z.string(),
	port: z.number(),
	username: z.string(),
	password: z.string(),
});

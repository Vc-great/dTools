import z from "zod";
export const getDeployConfigByIdRequestSchema = z.object({
	id: z.uuid(),
});

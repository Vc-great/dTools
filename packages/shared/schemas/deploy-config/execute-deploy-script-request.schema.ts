import z from "zod";

export const executeDeployScriptRequestSchema = z.object({
	deployConfigId: z.string(),
});

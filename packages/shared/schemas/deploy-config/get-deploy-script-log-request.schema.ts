import { z } from "zod";

export const getDeployScriptLogRequestSchema = z.object({
	deployConfigId: z.string(),
});

import { RefType } from "@shared/types";
import z from "zod";

export const updateDeployConfigRequestSchema = z.object({
	id: z.uuid(),
	projectId: z.uuid(),
	name: z.string(),
	gitAccountId: z.uuid(),
	vmAccountId: z.uuid(),
	repoUrl: z.url(),
	refType: z.enum(RefType),
	refName: z.string(),
	deployScript: z.string(),
});

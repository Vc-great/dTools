import { RefType } from "@shared/types";
import z from "zod";

export const createDeployConfigRequestSchema = z.object({
	name: z.string(),
	projectId: z.string(),
	gitAccountId: z.string(),
	vmAccountId: z.string(),
	repoUrl: z.url(),
	refType: z.enum(RefType),
	refName: z.string(),
	deployScript: z.string(),
});

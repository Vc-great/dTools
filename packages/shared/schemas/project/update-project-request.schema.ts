import { ProjectType } from "@shared/types";
import { z } from "zod";
//
export const updateProjectRequestSchema = z.object({
	name: z.string(),
	type: z.enum(ProjectType),
	parentId: z.string().optional(),
	id: z.string(),
});

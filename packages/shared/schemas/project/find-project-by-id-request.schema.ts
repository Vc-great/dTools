import { z } from "zod";
//
export const findProjectByIdRequestSchema = z.object({
	id: z.string(),
});

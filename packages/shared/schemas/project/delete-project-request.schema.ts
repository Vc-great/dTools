import { z } from "zod";
//
export const deleteProjectRequestSchema = z.object({
	id: z.string(),
});

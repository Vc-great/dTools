import { z } from "zod";

//
export const deleteGitAuthenticationRequestSchema = z.object({
	id: z.string(),
});

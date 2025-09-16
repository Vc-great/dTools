import z from "zod";
export const deleteDeployConfigRequestSchema = z.object({
  id: z.string().uuid(),
});

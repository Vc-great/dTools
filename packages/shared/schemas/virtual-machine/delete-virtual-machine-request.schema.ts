import z from "zod";

export const deleteVirtualMachineRequestSchema = z.object({
  id: z.string(),
});

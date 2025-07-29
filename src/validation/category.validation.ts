import z from "zod";

export class CategoryValidation {
  static readonly POST = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(600).nullable().optional(),
  });
  static readonly PATCH = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(600).nullable().optional(),
  });
}

import z from "zod";

export class CategoryValidation {
  static readonly QUERY = z.object({
    title: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    size: z.coerce.number().int().min(1).max(100).optional().default(10),
    cursor: z.string().optional().describe("id from last item in last page"),
    sortBy: z.enum(["title", "createdAt", "updatedAt"]).optional().default("createdAt"),
    orderBy: z.enum(["asc", "desc"]).optional().default("desc"),
  });
  static readonly POST = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(600).nullable().optional(),
  });
  static readonly PATCH = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(600).nullable().optional(),
  });
}

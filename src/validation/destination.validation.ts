import z from "zod";

class DestinationValidation {
  static readonly QUERY = z.object({
    title: z.string().optional(),
    address: z.string().optional(),
    category: z.string().optional().describe("Filter berdasarkan categoryId"),
    tags: z.string().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    size: z.coerce.number().int().min(1).max(100).optional().default(10),
    cursor: z
      .string()
      .optional()
      .describe("ID dari item terakhir di halaman sebelumnya"),
    sortBy: z
      .enum(["price", "createdAt", "updatedAt"])
      .optional()
      .default("createdAt"),
    orderBy: z.enum(["asc", "desc"]).optional().default("desc"),
  });
}

export default DestinationValidation;

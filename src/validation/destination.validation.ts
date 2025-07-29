import z from "zod";

export class DestinationValidation {
  static readonly QUERY = z.object({
    title: z.string().optional(),
    address: z.string().optional(),
    category: z.string().optional().describe("Filter berdasarkan category slug"),
    tags: z.string().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    size: z.coerce.number().int().min(1).max(100).optional().default(10),
    cursor: z.string().optional().describe("ID dari item terakhir di halaman sebelumnya"),
    sortBy: z.enum(["price", "createdAt", "updatedAt"]).optional().default("createdAt"),
    orderBy: z.enum(["asc", "desc"]).optional().default("desc"),
  });

  static readonly POST = z.object({
    title: z.string().min(1).max(200),
    content: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    mapUrl: z.string().url().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    categoryId: z.string().cuid({ message: "invalid category id" }),
    price: z.number().optional().nullable(),
    tags: z.array(z.string().min(1)).optional(),
    cover: z
      .object({
        url: z.string().url().nullable(),
        publicId: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  });

  static readonly PATCH = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    mapUrl: z.string().url().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    categoryId: z.string().cuid({ message: "invalid category id" }).optional(),
    price: z.number().optional().nullable(),
    tags: z.array(z.string().min(1)).optional(),
    cover: z
      .object({
        url: z.string().url().nullable(),
        publicId: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  });
}

export class DestinationCommentValidation {
  static readonly POST = z.object({
    content: z.string().min(3).max(300),
    parentId: z.string().cuid().optional(),
  });
}

export class DestinationGalleryVaidation {
  static readonly POST = z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().nullable().optional(),
      }),
    )
    .nonempty();
  static readonly DELETE = z.array(z.string()).nonempty();
}

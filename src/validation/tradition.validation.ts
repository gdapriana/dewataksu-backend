import z from "zod";

export class TraditionValidation {
  static readonly QUERY = z.object({
    title: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    size: z.coerce.number().int().min(1).max(100).optional().default(10),
    cursor: z.string().optional().describe("id from last item in last page"),
    sortBy: z.enum(["price", "createdAt", "updatedAt", "like", "bookmark"]).optional().default("createdAt"),
    orderBy: z.enum(["asc", "desc"]).optional().default("desc"),
  });

  static readonly POST = z.object({
    title: z.string().min(1).max(200),
    content: z.string().max(1000000),
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
    content: z.string().max(1000000).optional(),
    cover: z
      .object({
        url: z.string().url().nullable(),
        publicId: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  });
}

export class TraditionCommentValidation {
  static readonly POST = z.object({
    content: z.string().min(3).max(300),
    parentId: z.string().cuid().optional(),
  });
}

export class TraditionGalleryVaidation {
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

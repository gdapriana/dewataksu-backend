import z from "zod";

export class StoryValidation {
  static readonly QUERY = z.object({
    title: z.string().optional(),
    username: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    size: z.coerce.number().int().min(1).max(100).optional().default(10),
    cursor: z.string().optional().describe("id from last item in last page"),
    sortBy: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
    orderBy: z.enum(["asc", "desc"]).optional().default("desc"),
  });

  static readonly POST = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(10).max(1000000),
    isPublished: z.boolean().default(true),
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
    content: z.string().min(10).max(1000000).optional(),
    isPublished: z.boolean().optional(),
    cover: z
      .object({
        url: z.string().url().nullable(),
        publicId: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  });
}

export class StoryCommentValidation {
  static readonly POST = z.object({
    content: z.string().min(3).max(300),
    parentId: z.string().cuid().optional(),
  });
}

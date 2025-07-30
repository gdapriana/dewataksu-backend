import z from "zod";
import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { CategoryValidation } from "../validation/category.validation";
import Validation from "../validation/validation";
import { Prisma } from "@prisma/client";
import { CategoryRelation } from "../utils/relation/category";
import { UserPayload } from "../utils/types";
import slugify from "../utils/slugify";
import activityLog from "../utils/activity-log";

export class CategoryService {
  static async GET(id: string) {
    const checkCategory = await db.category.findUnique({
      where: { id },
      include: CategoryRelation.GETS,
    });
    if (!checkCategory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("category"));
    return checkCategory;
  }
  static async GETS(query: z.infer<typeof CategoryValidation.QUERY>) {
    const validatedQuery: z.infer<typeof CategoryValidation.QUERY> = Validation.validate(CategoryValidation.QUERY, query);
    const { page, size, cursor, sortBy, orderBy, ...filters } = validatedQuery;
    const where: Prisma.CategoryWhereInput = {};
    if (filters.title) where.name = { contains: filters.title, mode: "insensitive" };
    const categories = await db.category.findMany({
      where,
      include: CategoryRelation.GETS,
      take: size,
      skip: cursor ? 1 : (page - 1) * size,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [sortBy]: orderBy },
    });
    const totalItems = await db.category.count({ where });
    const nextCursor = categories.length === size ? categories[size - 1].id : null;
    return {
      data: categories,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / size),
        currentPage: page,
        pageSize: size,
        nextCursor,
      },
    };
  }
  static async POST(body: z.infer<typeof CategoryValidation.POST>, admin: UserPayload) {
    const validatedBody: z.infer<typeof CategoryValidation.POST> = Validation.validate(CategoryValidation.POST, body);
    const slug = slugify(validatedBody.name);
    const checkCategory = await db.category.findUnique({ where: { slug } });
    if (checkCategory) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("category"));
    const category = await db.category.create({
      data: {
        ...validatedBody,
        slug,
      },
      select: CategoryRelation.POST,
    });

    await db.activityLog.create({
      data: {
        username: admin.username,
        from: admin.role,
        action: "CREATE_CATEGORY",
        details: activityLog("category", category.slug),
      },
    });
    return category;
  }
  static async PATCH(id: string, body: z.infer<typeof CategoryValidation.PATCH>, admin: UserPayload) {
    const checkCategory = await db.category.findUnique({ where: { id }, select: { id: true } });
    if (!checkCategory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("category"));
    const validatedBody: z.infer<typeof CategoryValidation.PATCH> = Validation.validate(CategoryValidation.PATCH, body);
    const result = await db.$transaction(async (tx) => {
      let newSlug = undefined;
      if (validatedBody.name) {
        newSlug = slugify(validatedBody.name);
        const checkSlug = await db.category.findUnique({
          where: { slug: newSlug },
          select: { slug: true },
        });
        if (checkSlug) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("category"));
        return tx.category.update({
          where: {
            id,
          },
          data: {
            ...validatedBody,
            slug: newSlug,
          },
          select: CategoryRelation.PATCH,
        });
      }
    });
    await db.activityLog.create({
      data: {
        username: admin.username,
        from: admin.role,
        action: "UPDATE_CATEGORY",
        details: activityLog("category", result?.slug),
      },
    });
    return "success";
  }
  static async DELETE(id: string, admin: UserPayload) {
    const checkCategory = await db.category.findUnique({ where: { id }, select: { id: true } });
    if (!checkCategory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("category"));

    const category = await db.category.delete({
      where: {
        id,
      },
      select: CategoryRelation.DELETE,
    });

    await db.activityLog.create({
      data: {
        username: admin.username,
        from: admin.role,
        action: "DELETE_CATEGORY",
        details: activityLog("category", category.slug),
      },
    });

    return category;
  }
}

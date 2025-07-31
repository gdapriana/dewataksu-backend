import z from "zod";
import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { TraditionRelation } from "../utils/relation/tradition";
import { TraditionValidation } from "../validation/tradition.validation";
import Validation from "../validation/validation";
import { Prisma } from "@prisma/client";
import slugify from "../utils/slugify";
import { UserPayload } from "../utils/types";
import activityLog from "../utils/activity-log";

export class TraditionService {
  static async GET(slug: string) {
    const checkTradition = await db.tradition.findUnique({ where: { slug }, include: TraditionRelation.GET });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));
    return checkTradition;
  }
  static async GETS(query: z.infer<typeof TraditionValidation.QUERY>) {
    const validatedQuery: z.infer<typeof TraditionValidation.QUERY> = Validation.validate(TraditionValidation.QUERY, query);
    const { page, size, cursor, sortBy, orderBy, ...filters } = validatedQuery;
    const where: Prisma.TraditionWhereInput = {};
    if (filters.title) where.title = { contains: query.title, mode: "insensitive" };
    let orderByClause: Prisma.TraditionOrderByWithRelationInput;
    if (sortBy === "like") {
      orderByClause = { likes: { _count: orderBy } };
    } else if (sortBy === "bookmark") {
      orderByClause = { bookmarks: { _count: orderBy } };
    } else {
      orderByClause = { [sortBy]: orderBy };
    }

    const [totalItems, traditions] = await Promise.all([
      db.tradition.count({ where }),
      db.tradition.findMany({
        where,
        orderBy: orderByClause,
        take: size,
        skip: cursor ? 1 : (page - 1) * size,
        cursor: cursor ? { id: cursor } : undefined,
        include: TraditionRelation.GETS,
      }),
    ]);

    const nextCursor = traditions.length === size ? traditions[size - 1].id : null;
    return {
      data: traditions,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / size),
        currentPage: page,
        pageSize: size,
        nextCursor,
      },
    };
  }

  static async POST(body: z.infer<typeof TraditionValidation.POST>, admin: UserPayload) {
    const validatedBody: z.infer<typeof TraditionValidation.POST> = Validation.validate(TraditionValidation.POST, body);
    const { cover, ...traditionData } = validatedBody;
    const slug = slugify(validatedBody.title);
    const checkTradition = await db.tradition.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (checkTradition) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("tradition"));
    const createData: Prisma.TraditionCreateInput = {
      ...traditionData,
      slug,
      cover: {
        create: {
          url: cover?.url,
          publicId: cover?.publicId,
        },
      },
    };
    const newTradition = await db.tradition.create({
      data: { ...createData },
    });

    await db.activityLog.create({
      data: {
        action: "CREATE_CATEGORY",
        from: admin.role,
        username: admin.username,
        details: activityLog("tradition", newTradition.slug),
      },
    });
    return newTradition;
  }
}

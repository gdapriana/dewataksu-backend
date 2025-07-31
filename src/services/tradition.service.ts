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
      select: TraditionRelation.POST,
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
  static async PATCH(id: string, body: z.infer<typeof TraditionValidation.PATCH>, admin: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));

    const validatedBody: z.infer<typeof TraditionValidation.PATCH> = Validation.validate(TraditionValidation.PATCH, body);
    const { cover, ...traditionData } = validatedBody;

    const updatedTradition = await db.$transaction(async (tx) => {
      let newSlug = undefined;

      if (traditionData.title) {
        newSlug = slugify(traditionData.title);
        console.log({ newSlug });
        const checkSlug = await tx.tradition.findUnique({
          where: { slug: newSlug },
          select: { slug: true },
        });
        if (checkSlug) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("tradition"));
      }

      let newCoverId = undefined;
      if ((cover !== null || cover !== undefined) && checkTradition.coverId === null) {
        newCoverId = (await tx.image.create({ data: { url: cover?.url, publicId: cover?.publicId }, select: { id: true } })).id;
      }
      if ((cover !== null || cover !== undefined) && checkTradition.coverId) await tx.image.update({ where: { id: checkTradition.coverId }, data: { url: cover?.url, publicId: cover?.publicId } });
      if (cover === null && checkTradition.coverId) newCoverId = null;

      return tx.tradition.update({
        where: { id },
        data: {
          slug: newSlug,
          ...traditionData,
          coverId: newCoverId,
        },
        select: TraditionRelation.PATCH,
      });
    });

    if (cover === null && checkTradition.coverId) {
      await db.image.delete({
        where: { id: checkTradition.coverId },
      });
    }

    await db.activityLog.create({
      data: {
        action: "UPDATE_DESTINATION",
        from: admin.role,
        username: admin.username,
        details: activityLog("destination", updatedTradition.slug),
      },
    });

    return updatedTradition;
  }

  static async DELETE(id: string, admin: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true, coverId: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));

    const deletedTradition = await db.$transaction(async (tx) => {
      const traditionGalleries = await tx.gallery.findMany({ where: { traditionId: checkTradition.id }, select: { imageId: true } });
      const imageIds = traditionGalleries.map((id) => id.imageId) as string[];
      if (imageIds.length > 0) await tx.image.deleteMany({ where: { id: { in: imageIds } } });
      const tradition = await tx.tradition.delete({ where: { id }, select: { id: true, slug: true } });
      if (checkTradition.coverId) await tx.image.delete({ where: { id: checkTradition.coverId } });
      return tradition;
    });

    await db.activityLog.create({
      data: {
        username: admin.username,
        from: admin.role,
        action: "DELETE_DESTINATION",
        details: activityLog("tradition", deletedTradition.slug),
      },
    });
    return deletedTradition;
  }
}

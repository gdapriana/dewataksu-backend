import z from "zod";
import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { TraditionRelation } from "../utils/relation/tradition";
import { TraditionCommentValidation, TraditionGalleryVaidation, TraditionValidation } from "../validation/tradition.validation";
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
        details: activityLog("tradition", updatedTradition.slug),
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
export class TraditionCommentService {
  static async POST(id: string, body: z.infer<typeof TraditionCommentValidation.POST>, user: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));
    const validatedBody: z.infer<typeof TraditionCommentValidation.POST> = Validation.validate(TraditionCommentValidation.POST, body);
    if (validatedBody.parentId) {
      const checkComment = await db.comment.findUnique({ where: { id: validatedBody.parentId } });
      if (!checkComment) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("comment"));
    }

    const comment = await db.comment.create({
      data: {
        ...validatedBody,
        authorId: user.id,
        traditionId: id,
      },
      select: { id: true },
    });

    await db.activityLog.create({
      data: {
        action: validatedBody.parentId ? "REPLY_COMMENT" : "CREATE_COMMENT",
        from: user.role,
        username: user.username,
        details: activityLog("comment", checkTradition.slug),
      },
    });

    return comment;
  }
  static async DELETE(traditionId: string, commentId: string, user: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id: traditionId }, select: { id: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));
    const checkComment = await db.comment.findUnique({ where: { id: commentId }, select: { tradition: { select: { slug: true } }, author: { select: { username: true } } } });
    if (!checkComment) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("comment"));
    if (checkComment.author.username !== user.username) throw new ResponseError(ErrorResponseMessage.FORBIDDEN());
    const deletedComment = await db.comment.delete({ where: { id: commentId }, select: { id: true } });
    await db.activityLog.create({
      data: {
        action: "DELETE_COMMENT",
        from: user.role,
        username: user.username,
        details: activityLog("comment", checkComment.tradition?.slug),
      },
    });
    return deletedComment;
  }
}
export class TraditionBookmarkService {
  static async POST(id: string, user: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));
    const checkBookmarked = await db.bookmark.findFirst({ where: { traditionId: id, userId: user.id } });
    if (checkBookmarked) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("bookmark"));
    const bookmark = await db.bookmark.create({
      data: {
        traditionId: id,
        userId: user.id,
      },
      select: {
        tradition: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });
    await db.activityLog.create({
      data: {
        action: "BOOKMARK_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("bookmark", bookmark.tradition?.slug),
      },
    });
    return bookmark;
  }
  static async DELETE(id: string, user: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));

    await db.bookmark.deleteMany({
      where: {
        AND: [{ userId: user.id }, { traditionId: id }],
      },
    });

    await db.activityLog.create({
      data: {
        action: "UNBOOKMARK_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("bookmark", checkTradition.slug),
      },
    });
    return "ok";
  }
}
export class TraditionLikeService {
  static async POST(id: string, user: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));
    const checkLiked = await db.like.findFirst({ where: { traditionId: id, userId: user.id } });
    if (checkLiked) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("like"));
    const like = await db.like.create({
      data: {
        traditionId: id,
        userId: user.id,
      },
      select: {
        tradition: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });
    await db.activityLog.create({
      data: {
        action: "LIKE_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("like", like.tradition?.slug),
      },
    });
    return like;
  }
  static async DELETE(id: string, user: UserPayload) {
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));

    await db.like.deleteMany({
      where: {
        AND: [{ userId: user.id }, { traditionId: id }],
      },
    });

    await db.activityLog.create({
      data: {
        action: "LIKE_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("like", checkTradition.slug),
      },
    });
    return "ok";
  }
}
export class TraditionGalleryService {
  static async POST(id: string, body: z.infer<typeof TraditionGalleryVaidation.POST>, admin: UserPayload) {
    const validatedBody: z.infer<typeof TraditionGalleryVaidation.POST> = Validation.validate(TraditionGalleryVaidation.POST, body);
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));

    const result = db.$transaction(async (tx) => {
      const imageData = await tx.image.createManyAndReturn({
        data: validatedBody,
        select: {
          id: true,
        },
      });

      const galleryData = imageData.map((image) => ({
        traditionId: id,
        imageId: image.id,
      }));

      const createdGallery = await tx.gallery.createMany({
        data: galleryData,
      });
      return createdGallery;
    });

    await db.activityLog.create({
      data: {
        action: "ADD_GALLERY",
        username: admin.username,
        details: activityLog("gallery", checkTradition.slug),
      },
    });
    return result;
  }
  static async DELETE(id: string, body: z.infer<typeof TraditionGalleryVaidation.DELETE>, admin: UserPayload) {
    const validatedBody: z.infer<typeof TraditionGalleryVaidation.DELETE> = Validation.validate(TraditionGalleryVaidation.DELETE, body);
    const checkTradition = await db.tradition.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkTradition) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("tradition"));

    const result = db.$transaction(async (tx) => {
      const galleryData = await tx.gallery.findMany({ where: { id: { in: validatedBody } }, select: { id: true, imageId: true } });
      if (validatedBody.length !== galleryData.length) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("gallery"));
      const imageIds = galleryData.map((image) => image.imageId) as string[];

      if (galleryData.length !== imageIds.length) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("image"));

      await tx.gallery.deleteMany({ where: { id: { in: validatedBody } } });
      await tx.image.deleteMany({ where: { id: { in: imageIds } } });

      return "success";
    });

    await db.activityLog.create({
      data: {
        username: admin.username,
        action: "REMOVE_GALLERY",
        details: activityLog("gallery", checkTradition.slug),
      },
    });

    return result;
  }
}

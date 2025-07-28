import z from "zod";
import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { GET, GETS } from "../utils/relation/destination";
import { DestinationCommentValidation, DestinationValidation } from "../validation/destination.validation";
import Validation from "../validation/validation";
import { Prisma } from "@prisma/client";
import slugify from "../utils/slugify";
import { UserPayload } from "../utils/types";
import activityLog from "../utils/activity-log";
import { cloudinary } from "../utils/cloudinary";

export class DestinationService {
  static async GET(slug: string) {
    const destinationCheck = await db.destination.findUnique({
      where: { slug },
      include: {
        ...GET,
      },
    });
    if (!destinationCheck) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));
    return destinationCheck;
  }
  static async GETS(query: z.infer<typeof DestinationValidation.QUERY>) {
    const validatedQuery: z.infer<typeof DestinationValidation.QUERY> = Validation.validate(DestinationValidation.QUERY, query);
    const { page, size, cursor, sortBy, orderBy, ...filters } = validatedQuery;
    const where: Prisma.DestinationWhereInput = {};
    if (filters.title) where.title = { contains: filters.title, mode: "insensitive" };
    if (filters.address) where.address = { contains: filters.address, mode: "insensitive" };
    if (filters.category) where.categoryId = filters.category;
    if (filters.tags) {
      const tagSlugs = filters.tags.split(",").map((slug) => slug.trim());
      where.tags = { some: { slug: { in: tagSlugs } } };
    }
    const priceFilter: { gte?: number; lte?: number } = {};
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }
    const destinations = await db.destination.findMany({
      where,
      include: GETS,
      take: size,
      skip: cursor ? 1 : (page - 1) * size,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [sortBy]: orderBy },
    });
    const totalItems = await db.destination.count({ where });
    const nextCursor = destinations.length === size ? destinations[size - 1].id : null;
    return {
      data: destinations,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / size),
        currentPage: page,
        pageSize: size,
        nextCursor,
      },
    };
  }
  static async POST(body: z.infer<typeof DestinationValidation.POST>, admin: UserPayload) {
    const validatedBody: z.infer<typeof DestinationValidation.POST> = Validation.validate(DestinationValidation.POST, body);
    const { tags, categoryId, cover, ...destinationData } = validatedBody;
    const slug = slugify(validatedBody.title);
    const checkDestination = await db.destination.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (checkDestination) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("destination"));
    const checkCategory = await db.category.findUnique({
      where: {
        id: categoryId,
      },
    });
    if (!checkCategory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("category"));
    const createData: Prisma.DestinationCreateInput = {
      ...destinationData,
      slug,
      cover: {
        create: {
          url: cover?.url,
          publicId: cover?.publicId,
        },
      },
      category: {
        connect: { id: validatedBody.categoryId },
      },
    };
    if (tags && tags.length > 0) {
      createData.tags = {
        connectOrCreate: tags.map((tagName) => {
          const slug = slugify(tagName);
          return {
            where: { slug: slug },
            create: { name: tagName, slug: slug },
          };
        }),
      };
    }
    const newDestination = await db.destination.create({
      data: { ...createData },
      include: {
        category: true,
        tags: true,
      },
    });

    await db.activityLog.create({
      data: {
        action: "CREATE_DESTINATION",
        from: admin.role,
        username: admin.username,
        details: activityLog("destination", newDestination.slug),
      },
    });
    return newDestination;
  }
  static async PATCH(id: string, body: z.infer<typeof DestinationValidation.PATCH>, admin: UserPayload) {
    const validatedBody: z.infer<typeof DestinationValidation.PATCH> = Validation.validate(DestinationValidation.PATCH, body);
    const { tags, cover, ...destinationData } = validatedBody;
    const checkDestination = await db.destination.findUnique({ where: { id } });
    if (!checkDestination) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));

    const updatedDestination = await db.$transaction(async (tx) => {
      let newSlug = undefined;
      if (destinationData.categoryId) {
        const checkCategory = await db.category.findUnique({ where: { id: destinationData.categoryId } });
        if (!checkCategory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("category"));
      }
      if (destinationData.title) {
        newSlug = slugify(destinationData.title);
        const checkSlug = await db.destination.findUnique({
          where: { slug: newSlug },
          select: { slug: true },
        });
        if (checkSlug) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("destination"));
      }

      let newCoverId = undefined;
      if ((cover !== null || cover !== undefined) && checkDestination.coverId === null) {
        newCoverId = (await tx.image.create({ data: { url: cover?.url, publicId: cover?.publicId }, select: { id: true } })).id;
      }
      if ((cover !== null || cover !== undefined) && checkDestination.coverId) await tx.image.update({ where: { id: checkDestination.coverId }, data: { url: cover?.url, publicId: cover?.publicId } });
      if (cover === null && checkDestination.coverId) {
        newCoverId = null;
      }

      if (tags) {
        const tagIds = await Promise.all(
          tags.map(async (tagName) => {
            const slug = slugify(tagName);
            const tag = await tx.tag.upsert({
              where: { slug },
              update: {},
              create: { name: tagName, slug },
            });
            return tag.id;
          }),
        );
        return tx.destination.update({
          where: { id },
          data: {
            ...destinationData,
            coverId: newCoverId,
            tags: {
              set: tagIds.map((id) => ({ id })),
            },
          },
          include: { category: true, tags: true },
        });
      } else {
        return tx.destination.update({
          where: { id: id },
          data: {
            ...destinationData,
            coverId: newCoverId,
          },
          include: { category: true, tags: true },
        });
      }
    });

    if (cover === null && checkDestination.coverId) {
      await db.image.delete({
        where: { id: checkDestination.coverId },
      });
    }
    await db.activityLog.create({
      data: {
        action: "UPDATE_DESTINATION",
        from: admin.role,
        username: admin.username,
        details: activityLog("destination", updatedDestination.slug),
      },
    });
    return updatedDestination;
  }
  static async DELETE(id: string, admin: UserPayload) {
    const checkDestianation = await db.destination.findUnique({ where: { id }, select: { id: true, coverId: true } });
    if (!checkDestianation) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));
    const deletedDestination = await db.destination.delete({ where: { id }, select: { id: true, slug: true } });
    if (checkDestianation.coverId) {
      const coverPublicId = await db.image.delete({ where: { id: checkDestianation.coverId }, select: { publicId: true } });
      coverPublicId.publicId && (await cloudinary.uploader.destroy(coverPublicId.publicId));
    }
    await db.activityLog.create({
      data: {
        action: "DELETE_DESTINATION",
        from: admin.role,
        username: admin.username,
        details: activityLog("destination", deletedDestination.slug),
      },
    });
    return deletedDestination;
  }
}

export class DestinationCommentService {
  static async POST(id: string, body: z.infer<typeof DestinationCommentValidation.POST>, user: UserPayload) {
    const validatedBody: z.infer<typeof DestinationCommentValidation.POST> = Validation.validate(DestinationCommentValidation.POST, body);
    const checkDestination = await db.destination.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
      },
    });
    if (!checkDestination) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));
    if (validatedBody.parentId) {
      const checkComment = await db.comment.findUnique({ where: { id: validatedBody.parentId } });
      if (!checkComment) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("comment"));
    }
    const comment = await db.comment.create({
      data: {
        ...validatedBody,
        authorId: user.id,
        destinationId: id,
      },
      select: {
        id: true,
      },
    });
    await db.activityLog.create({
      data: {
        action: validatedBody.parentId ? "REPLY_COMMENT" : "CREATE_COMMENT",
        from: user.role,
        username: user.username,
        details: activityLog("comment", checkDestination.title),
      },
    });
    return comment;
  }
  static async DELETE(id: string, user: UserPayload) {
    const checkComment = await db.comment.findUnique({ where: { id }, select: { destination: { select: { title: true } }, author: { select: { username: true } } } });
    if (!checkComment) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("comment"));
    if (checkComment.author.username !== user.username) throw new ResponseError(ErrorResponseMessage.FORBIDDEN());
    const deletedComment = await db.comment.delete({ where: { id }, select: { id: true } });
    await db.activityLog.create({
      data: {
        action: "DELETE_COMMENT",
        from: user.role,
        username: user.username,
        details: activityLog("comment", checkComment.destination?.title),
      },
    });
    return deletedComment;
  }
}

export class DestinationBookmarkService {
  static async POST(id: string, user: UserPayload) {
    const checkDestination = await db.destination.findUnique({ where: { id }, select: { id: true } });
    if (!checkDestination) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));
    const checkBookmarked = await db.bookmark.findFirst({ where: { destinationId: id, userId: user.id } });
    if (checkBookmarked) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("bookmark"));
    const bookmark = await db.bookmark.create({
      data: {
        destinationId: id,
        userId: user.id,
      },
      select: {
        destination: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });
    await db.activityLog.create({
      data: {
        action: "SAVE_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("bookmark", bookmark.destination?.slug),
      },
    });
    return bookmark;
  }

  static async DELETE(id: string, user: UserPayload) {
    const checkDestination = await db.destination.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkDestination) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));

    await db.bookmark.deleteMany({
      where: {
        AND: [{ userId: user.id }, { destinationId: id }],
      },
    });

    await db.activityLog.create({
      data: {
        action: "SAVE_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("bookmark", checkDestination.slug),
      },
    });
    return "ok";
  }
}

export class DestinationLikeService {
  static async POST(id: string, user: UserPayload) {
    const checkDestination = await db.destination.findUnique({ where: { id }, select: { id: true } });
    if (!checkDestination) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));
    const checkLiked = await db.like.findFirst({ where: { destinationId: id, userId: user.id } });
    if (checkLiked) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("like"));
    const like = await db.like.create({
      data: {
        destinationId: id,
        userId: user.id,
      },
      select: {
        destination: {
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
        details: activityLog("like", like.destination?.slug),
      },
    });
    return like;
  }

  static async DELETE(id: string, user: UserPayload) {
    const checkDestination = await db.destination.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkDestination) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));

    await db.like.deleteMany({
      where: {
        AND: [{ userId: user.id }, { destinationId: id }],
      },
    });

    await db.activityLog.create({
      data: {
        action: "LIKE_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("bookmark", checkDestination.slug),
      },
    });
    return "ok";
  }
}

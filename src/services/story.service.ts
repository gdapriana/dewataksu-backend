import z from "zod";
import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { DestinationCommentValidation, DestinationGalleryVaidation, DestinationValidation } from "../validation/destination.validation";
import Validation from "../validation/validation";
import { Prisma } from "@prisma/client";
import slugify from "../utils/slugify";
import { UserPayload } from "../utils/types";
import activityLog from "../utils/activity-log";
import { cloudinary } from "../utils/cloudinary";
import { DestinationRelation } from "../utils/relation/destination";
import { StoryRelation } from "../utils/relation/story";
import { StoryCommentValidation, StoryValidation } from "../validation/story.validation";

export class StoryService {
  static async GET(slug: string) {
    const storyCheck = await db.story.findUnique({
      where: { slug },
      include: StoryRelation.GET,
    });
    if (!storyCheck) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));
    return storyCheck;
  }

  static async GETS(query: z.infer<typeof StoryValidation.QUERY>) {
    const validatedQuery: z.infer<typeof StoryValidation.QUERY> = Validation.validate(StoryValidation.QUERY, query);
    const { page, size, cursor, sortBy, orderBy, ...filters } = validatedQuery;
    const where: Prisma.StoryWhereInput = {};
    if (filters.title) where.title = { contains: filters.title, mode: "insensitive" };
    if (filters.username) {
      where.author = {
        username: { contains: filters.username, mode: "insensitive" },
      };
    }
    const stories = await db.story.findMany({
      where,
      include: StoryRelation.GETS,
      take: size,
      skip: cursor ? 1 : (page - 1) * size,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [sortBy]: orderBy },
    });
    const totalItems = await db.story.count({ where });
    const nextCursor = stories.length === size ? stories[size - 1].id : null;
    return {
      data: stories,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / size),
        currentPage: page,
        pageSize: size,
        nextCursor,
      },
    };
  }
  static async POST(body: z.infer<typeof StoryValidation.POST>, user: UserPayload) {
    const validatedBody: z.infer<typeof StoryValidation.POST> = Validation.validate(StoryValidation.POST, body);
    const { cover, ...storyData } = validatedBody;
    const slug = `${slugify(storyData.title)}-${Date.now().toString(36)}`;
    const checkStory = await db.story.findUnique({
      where: { slug },
      select: { slug: true },
    });
    if (checkStory) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("story"));
    const createData: Prisma.StoryCreateInput = {
      ...storyData,
      author: {
        connect: {
          id: user.id,
        },
      },
      slug,
      cover: {
        create: {
          url: cover?.url,
          publicId: cover?.publicId,
        },
      },
    };
    const newStory = await db.story.create({
      data: { ...createData },
      select: StoryRelation.POST,
    });

    await db.activityLog.create({
      data: {
        action: "CREATE_STORY",
        from: user.role,
        username: user.username,
        details: activityLog("story", newStory.slug),
      },
    });
    return newStory;
  }
  static async PATCH(id: string, body: z.infer<typeof StoryValidation.PATCH>, user: UserPayload) {
    const validatedBody: z.infer<typeof StoryValidation.PATCH> = Validation.validate(StoryValidation.PATCH, body);
    const { cover, ...storyData } = validatedBody;
    const checkStory = await db.story.findUnique({ where: { id } });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));
    if (user.id !== checkStory.authorId) throw new ResponseError(ErrorResponseMessage.FORBIDDEN());
    const updatedStory = await db.$transaction(async (tx) => {
      let newSlug = undefined;
      if (storyData.title) {
        newSlug = `${slugify(storyData.title)}-${Date.now().toString(36)}`;
        const checkSlug = await tx.story.findUnique({
          where: { slug: newSlug },
          select: { slug: true },
        });
        if (checkSlug) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("story"));
      }

      let newCoverId = undefined;
      if ((cover !== null || cover !== undefined) && checkStory.coverId === null) {
        newCoverId = (await tx.image.create({ data: { url: cover?.url, publicId: cover?.publicId }, select: { id: true } })).id;
      }
      if ((cover !== null || cover !== undefined) && checkStory.coverId) await tx.image.update({ where: { id: checkStory.coverId }, data: { url: cover?.url, publicId: cover?.publicId } });
      if (cover === null && checkStory.coverId) {
        newCoverId = null;
      }

      return tx.story.update({
        where: { id: id },
        data: {
          ...storyData,
          coverId: newCoverId,
        },
        select: StoryRelation.PATCH,
      });
    });

    if (cover === null && checkStory.coverId) {
      await db.image.delete({
        where: { id: checkStory.coverId },
      });
    }
    await db.activityLog.create({
      data: {
        action: "UPDATE_STORY",
        from: user.role,
        username: user.username,
        details: activityLog("story", updatedStory.slug),
      },
    });
    return updatedStory;
  }
  static async DELETE(id: string, user: UserPayload) {
    const checkStory = await db.story.findUnique({ where: { id }, select: { id: true, coverId: true, authorId: true } });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));
    if (user.id !== checkStory.authorId) throw new ResponseError(ErrorResponseMessage.FORBIDDEN());
    const deletedStory = await db.story.delete({ where: { id }, select: StoryRelation.DELETE });
    if (checkStory.coverId) {
      const coverPublicId = await db.image.delete({ where: { id: checkStory.coverId }, select: { publicId: true } });
      coverPublicId.publicId && (await cloudinary.uploader.destroy(coverPublicId.publicId));
    }
    await db.activityLog.create({
      data: {
        action: "DELETE_DESTINATION",
        from: user.role,
        username: user.username,
        details: activityLog("destination", deletedStory.slug),
      },
    });
    return deletedStory;
  }
}
export class StoryCommentService {
  static async POST(id: string, body: z.infer<typeof StoryCommentValidation.POST>, user: UserPayload) {
    const validatedBody: z.infer<typeof StoryCommentValidation.POST> = Validation.validate(StoryCommentValidation.POST, body);
    const checkStory = await db.story.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
      },
    });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));
    if (validatedBody.parentId) {
      const checkComment = await db.comment.findUnique({ where: { id: validatedBody.parentId } });
      if (!checkComment) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("comment"));
    }
    const comment = await db.comment.create({
      data: {
        ...validatedBody,
        authorId: user.id,
        storyId: id,
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
        details: activityLog("comment", checkStory.slug),
      },
    });
    return comment;
  }
  static async DELETE(storyId: string, commentId: string, user: UserPayload) {
    const checkStory = await db.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));
    const checkComment = await db.comment.findUnique({ where: { id: commentId }, select: { story: { select: { slug: true } }, author: { select: { username: true } } } });
    if (!checkComment) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("comment"));
    if (checkComment.author.username !== user.username) throw new ResponseError(ErrorResponseMessage.FORBIDDEN());
    const deletedComment = await db.comment.delete({ where: { id: commentId }, select: { id: true } });
    await db.activityLog.create({
      data: {
        action: "DELETE_COMMENT",
        from: user.role,
        username: user.username,
        details: activityLog("comment", checkComment.story?.slug),
      },
    });
    return deletedComment;
  }
}

export class StoryBookmarkService {
  static async POST(id: string, user: UserPayload) {
    const checkStory = await db.story.findUnique({ where: { id }, select: { id: true } });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));
    const checkBookmarked = await db.bookmark.findFirst({ where: { storyId: id, userId: user.id } });
    if (checkBookmarked) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("bookmark"));
    const bookmark = await db.bookmark.create({
      data: {
        storyId: id,
        userId: user.id,
      },
      select: {
        story: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });
    await db.activityLog.create({
      data: {
        action: "BOOKMARK_STORY",
        from: user.role,
        username: user.username,
        details: activityLog("bookmark", bookmark.story?.slug),
      },
    });
    return bookmark;
  }

  static async DELETE(id: string, user: UserPayload) {
    const checkStory = await db.story.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));

    await db.bookmark.deleteMany({
      where: {
        AND: [{ userId: user.id }, { destinationId: id }],
      },
    });

    await db.activityLog.create({
      data: {
        action: "UNBOOKMARK_STORY",
        from: user.role,
        username: user.username,
        details: activityLog("bookmark", checkStory.slug),
      },
    });
    return "ok";
  }
}
export class StoryLikeService {
  static async POST(id: string, user: UserPayload) {
    const checkStory = await db.story.findUnique({ where: { id }, select: { id: true } });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));
    const checkLiked = await db.like.findFirst({ where: { storyId: id, userId: user.id } });
    if (checkLiked) throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("like"));
    const like = await db.like.create({
      data: {
        storyId: id,
        userId: user.id,
      },
      select: {
        story: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });
    await db.activityLog.create({
      data: {
        action: "LIKE_STORY",
        from: user.role,
        username: user.username,
        details: activityLog("like", like.story?.slug),
      },
    });
    return like;
  }

  static async DELETE(id: string, user: UserPayload) {
    const checkStory = await db.story.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!checkStory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("story"));

    await db.like.deleteMany({
      where: {
        AND: [{ userId: user.id }, { storyId: id }],
      },
    });

    await db.activityLog.create({
      data: {
        action: "UNLIKE_STORY",
        from: user.role,
        username: user.username,
        details: activityLog("like", checkStory.slug),
      },
    });
    return "ok";
  }
}

import z from "zod";
import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { GET, GETS } from "../utils/relation/destination";
import DestinationValidation from "../validation/destination.validation";
import Validation from "../validation/validation";
import { Prisma } from "@prisma/client";
import slugify from "../utils/slugify";
import { UserPayload } from "../utils/types";
import activityLog from "../utils/activity-log";

class DestinationService {
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
    const { tags, categoryId, ...destinationData } = validatedBody;
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
      data: createData,
      include: {
        category: true,
        tags: true,
      },
    });
    await db.activityLog.create({
      data: {
        action: "CREATE_DESTINATION",
        from: admin.role,
        userId: admin.id,
        details: activityLog("destination", newDestination.slug),
      },
    });
    return newDestination;
  }
}

export default DestinationService;

import z from "zod";
import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { GET, GETS } from "../utils/relation/destination";
import DestinationValidation from "../validation/destination.validation";
import Validation from "../validation/validation";
import { Prisma } from "@prisma/client";

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
}

export default DestinationService;

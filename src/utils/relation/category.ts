import { Prisma } from "@prisma/client";

export class CategoryRelation {
  static readonly GET: Prisma.CategoryInclude = {
    _count: true,
    destinations: {
      select: {
        id: true,
        cover: {
          select: {
            url: true,
          },
        },
        title: true,
        price: true,
        _count: true,
        category: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    },
  };
  static readonly GETS: Prisma.CategoryInclude = {
    _count: true,
  };
  static readonly POST: Prisma.CategorySelect = {
    name: true,
    slug: true,
  };
  static readonly PATCH: Prisma.CategorySelect = {
    name: true,
    slug: true,
  };
  static readonly DELETE: Prisma.CategorySelect = {
    id: true,
  };
}

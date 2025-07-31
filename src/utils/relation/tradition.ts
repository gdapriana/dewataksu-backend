import { Prisma } from "@prisma/client";

export class TraditionRelation {
  static readonly GET: Prisma.TraditionInclude = {
    _count: true,
    comments: {
      select: {
        author: {
          select: {
            username: true,
            profileImage: {
              select: {
                url: true,
              },
            },
          },
        },
        content: true,
      },
    },
    cover: {
      select: {
        url: true,
      },
    },
    galleries: {
      select: {
        image: {
          select: {
            url: true,
          },
        },
      },
    },
  };

  static readonly GETS: Prisma.TraditionInclude = {
    _count: {
      select: { likes: true, bookmarks: true, comments: true },
    },
    cover: {
      select: {
        url: true,
      },
    },
  };

  static readonly POST: Prisma.TraditionSelect = {
    slug: true,
  };
  static readonly PATCH: Prisma.TraditionSelect = {
    slug: true,
  };
}

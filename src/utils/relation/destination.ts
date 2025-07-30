import { Prisma } from "@prisma/client";

export class DestinationRelation {
  static readonly GET: Prisma.DestinationInclude = {
    _count: true,
    category: {
      select: {
        slug: true,
        name: true,
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
    tags: {
      select: {
        name: true,
      },
    },
    cover: {
      select: {
        url: true,
      },
    },
    comments: {
      where: {
        parentId: null,
      },
      select: {
        content: true,
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
        replies: {
          select: {
            content: true,
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
            replies: {
              // second level replies (grandchildren)
              select: {
                content: true,
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
              },
            },
          },
        },
      },
    },
  };
  static readonly GETS: Prisma.DestinationInclude = {
    cover: { select: { url: true } },
    category: { select: { name: true, slug: true } },
    tags: { select: { name: true, slug: true } },
    _count: { select: { likes: true, bookmarks: true } },
  };
  static readonly POST: Prisma.DestinationSelect = {
    slug: true,
  };
  static readonly PATCH: Prisma.DestinationSelect = {
    slug: true,
  };
  static readonly DELETE: Prisma.DestinationSelect = {
    id: true,
    slug: true,
  };
}

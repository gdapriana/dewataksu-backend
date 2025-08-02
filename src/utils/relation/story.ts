import { Prisma } from "@prisma/client";

export class StoryRelation {
  static readonly GET: Prisma.StoryInclude = {
    _count: true,
    author: {
      select: {
        username: true,
        profileImage: {
          select: {
            url: true,
          },
        },
        name: true,
      },
    },
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
            name: true,
          },
        },
        content: true,
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
  static readonly GETS: Prisma.StoryInclude = {
    cover: { select: { url: true } },
    _count: { select: { likes: true, bookmarks: true } },
  };
  static readonly POST: Prisma.StorySelect = {
    slug: true,
  };
  static readonly PATCH: Prisma.StorySelect = {
    slug: true,
  };
  static readonly DELETE: Prisma.StorySelect = {
    id: true,
    slug: true,
  };
}

import { Prisma } from "@prisma/client";

export class UserRelation {
  static readonly GET: Prisma.UserInclude = {
    _count: true,
    bookmarks: {
      select: {
        destination: {
          select: {
            cover: {
              select: {
                url: true,
              },
            },
            title: true,
          },
        },
      },
    },
    profileImage: {
      select: {
        url: true,
      },
    },
  };
}

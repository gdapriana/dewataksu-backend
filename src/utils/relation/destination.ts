export const GET = {
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

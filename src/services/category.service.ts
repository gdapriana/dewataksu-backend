import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";

export class CategoryService {
  static async GET(id: string) {
    const checkCategory = await db.category.findUnique({
      where: { id },
      include: {
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
      },
    });
    if (!checkCategory) throw new ResponseError(ErrorResponseMessage.NOT_FOUND("category"));
    return checkCategory;
  }
}

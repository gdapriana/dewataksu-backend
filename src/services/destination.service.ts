import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { GET } from "../utils/relation/destination";

class DestinationService {
  static async GET(slug: string) {
    const destinationCheck = await db.destination.findUnique({
      where: { slug },
      include: {
        ...GET,
      },
    });
    if (!destinationCheck)
      throw new ResponseError(ErrorResponseMessage.NOT_FOUND("destination"));
    return destinationCheck;
  }
}

export default DestinationService;

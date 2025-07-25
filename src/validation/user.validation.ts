import { z } from "zod";

class UserValidation {
    static readonly REGISTER  = z.object({
        email: z.string().email().max(100).optional(),
        username: z.string().min(2).max(40),
        password: z.string().min(3),
        name: z.string().max(100).optional()
    })
    static readonly LOGIN = z.object({
        username: z.string().min(2).max(40),
        password: z.string().min(3),
    })
}

export default UserValidation;
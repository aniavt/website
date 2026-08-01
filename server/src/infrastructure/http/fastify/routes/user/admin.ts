import { z } from "zod";
import type { PaginationOptions, UserRepository } from "@domain/repositories/UserRepository";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../../types";
import { authenticate } from "../../middlewares/auth";
import { sendUserError } from "../../errors";
import { clearAuthCookie, userToResponse } from "./helpers";
import { UserIdParamsSchema } from "../../route-schemas";

const ListUsersQuerySchema = z.object({
    limit: z.string().optional(),
    offset: z.string().optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    sortBy: z.enum(["id", "username", "createdAt", "updatedAt"]).optional(),
    isActive: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const registerUserAdminRoutes: RegisterRouteFn<{
    userUseCases: IUserUseCases;
    userRepository: UserRepository;
}> = (
    app,
    prefixUrl,
    { userUseCases, userRepository },
) => {
    app.post(
        prefixUrl("/user/deactivate/:userId"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: UserIdParamsSchema },
        },
        async (request, reply) => {
            const result = await userUseCases.deactivate.execute(request.params.userId, request.user!.id);
            if (result.isError()) {
                return sendUserError(reply, result.error);
            }
            clearAuthCookie(reply);
            return reply.send({ message: "user_deactivated" });
        },
    );

    app.post(
        prefixUrl("/user/activate/:userId"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: UserIdParamsSchema },
        },
        async (request, reply) => {
            const result = await userUseCases.activate.execute(request.params.userId, request.user!.id);
            if (result.isError()) {
                return sendUserError(reply, result.error);
            }
            return reply.send({ message: "user_activated" });
        },
    );

    app.get(
        prefixUrl("/users"),
        {
            preHandler: authenticate(userRepository),
            schema: { querystring: ListUsersQuerySchema },
        },
        async (request, reply) => {
            const options: PaginationOptions = {
                limit: request.query.limit ? parseInt(request.query.limit) : undefined,
                offset: request.query.offset ? parseInt(request.query.offset) : undefined,
                sort: request.query.sort === "asc" ? "asc" : "desc",
                sortBy: request.query.sortBy,
                filter: {
                    isActive: request.query.isActive ? request.query.isActive === "true" : undefined,
                    createdAt: request.query.createdAt ? new Date(request.query.createdAt) : undefined,
                    updatedAt: request.query.updatedAt ? new Date(request.query.updatedAt) : undefined,
                },
            };

            const result = await userUseCases.getAll.execute(request.user!.id, options);

            if (result.isError()) {
                return sendUserError(reply, result.error);
            }
            return reply.send(result.data.map(userToResponse));
        },
    );
};

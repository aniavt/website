import type { PaginationOptions } from "@domain/repositories/UserRepository";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../../types";
import { authenticate } from "../../middlewares/auth";
import { sendUserError } from "../../errors";
import { clearAuthCookie, userToResponse } from "./helpers";

export const registerUserAdminRoutes: RegisterRouteFn<{ userUseCases: IUserUseCases }> = (
    app,
    prefixUrl,
    { userUseCases },
) => {
    app.post<{ Params: { userId: string } }>(
        prefixUrl("/user/deactivate/:userId"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await userUseCases.deactivate.execute(request.params.userId, request.user!.id);
            if (result.isError()) {
                return sendUserError(reply, result.error);
            }
            clearAuthCookie(reply);
            return reply.send({ message: "user_deactivated" });
        },
    );

    app.post<{ Params: { userId: string } }>(
        prefixUrl("/user/activate/:userId"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await userUseCases.activate.execute(request.params.userId, request.user!.id);
            if (result.isError()) {
                return sendUserError(reply, result.error);
            }
            return reply.send({ message: "user_activated" });
        },
    );

    app.get<{
        Querystring: {
            limit?: string;
            offset?: string;
            sort?: "asc" | "desc";
            sortBy?: "id" | "username" | "createdAt" | "updatedAt";
            isActive?: string;
            createdAt?: string;
            updatedAt?: string;
        };
    }>(prefixUrl("/users"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const options: PaginationOptions = {
            limit: request.query.limit ? parseInt(request.query.limit) : undefined,
            offset: request.query.offset ? parseInt(request.query.offset) : undefined,
            sort: request.query.sort === "asc" ? "asc" : "desc",
            sortBy:
                request.query.sortBy === "id"
                    ? "id"
                    : request.query.sortBy === "username"
                      ? "username"
                      : request.query.sortBy === "createdAt"
                        ? "createdAt"
                        : request.query.sortBy === "updatedAt"
                          ? "updatedAt"
                          : undefined,
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
    });
};

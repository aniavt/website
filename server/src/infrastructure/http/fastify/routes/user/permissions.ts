import type { PermissionNamespace } from "@domain/value-object/Permissions";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { ManagePermissionBodySchema } from "@ania/api-contract/user";
import type { RegisterRouteFn } from "../../types";
import { authenticate } from "../../middlewares/auth";
import { sendUserError } from "../../errors";
import { PermissionCheckQuerySchema, UserIdParamsSchema } from "../../route-schemas";

export const registerUserPermissionRoutes: RegisterRouteFn<{
    userUseCases: IUserUseCases;
    userRepository: UserRepository;
}> = (
    app,
    prefixUrl,
    { userUseCases, userRepository },
) => {
    app.post(
        prefixUrl("/user/:userId/permissions/grant"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: UserIdParamsSchema, body: ManagePermissionBodySchema },
        },
        async (request, reply) => {
            const { userId } = request.params;
            const { namespace, permission } = request.body;

            const result = await userUseCases.managePermission.execute({
                userId,
                requesterId: request.user!.id,
                namespace,
                permission,
                action: "grant",
            });

            if (result.isError()) {
                return sendUserError(reply, result.error);
            }

            return reply.send({ message: "permission_granted" });
        },
    );

    app.post(
        prefixUrl("/user/:userId/permissions/revoke"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: UserIdParamsSchema, body: ManagePermissionBodySchema },
        },
        async (request, reply) => {
            const { userId } = request.params;
            const { namespace, permission } = request.body;

            const result = await userUseCases.managePermission.execute({
                userId,
                requesterId: request.user!.id,
                namespace,
                permission,
                action: "revoke",
            });

            if (result.isError()) {
                return sendUserError(reply, result.error);
            }

            return reply.send({ message: "permission_revoked" });
        },
    );

    app.get(
        prefixUrl("/user/:userId/permissions"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: UserIdParamsSchema },
        },
        async (request, reply) => {
            const requester = request.user!;
            const targetUserId = request.params.userId;

            const result = await userUseCases.getUserPermissions.execute({
                userId: targetUserId,
                requesterId: requester.id,
            });
            if (result.isError()) {
                return sendUserError(reply, result.error);
            }

            return reply.send({ permissions: result.data.permissions });
        },
    );

    app.get(
        prefixUrl("/user/:userId/permissions/check"),
        {
            preHandler: authenticate(userRepository),
            schema: {
                params: UserIdParamsSchema,
                querystring: PermissionCheckQuerySchema,
            },
        },
        async (request, reply) => {
            const { userId } = request.params;
            const { namespace, permission } = request.query;
            const requester = request.user!;

            const result = await userUseCases.getUserPermissions.execute({
                userId,
                requesterId: requester.id,
            });
            if (result.isError()) {
                return sendUserError(reply, result.error);
            }

            const slugs = result.data.permissions[namespace as PermissionNamespace] as readonly string[];
            const hasPermission = slugs.includes(`${namespace}.${permission}`);

            return reply.send({ hasPermission });
        },
    );
};

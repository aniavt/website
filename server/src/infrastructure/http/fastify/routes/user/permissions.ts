import type { FastifySchema } from "fastify";
import { namespaces, type PermissionNamespace } from "@domain/value-object/Permissions";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../../types";
import { authenticate } from "../../middlewares/auth";
import { sendUserError } from "../../errors";

const managePermissionSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["namespace", "permission"],
        properties: {
            namespace: { type: "string", enum: namespaces },
            permission: { type: "string", minLength: 1 },
        },
        additionalProperties: false,
    },
};

export const registerUserPermissionRoutes: RegisterRouteFn<{ userUseCases: IUserUseCases }> = (
    app,
    prefixUrl,
    { userUseCases },
) => {
    app.post<{ Params: { userId: string }; Body: { namespace: PermissionNamespace; permission: string } }>(
        prefixUrl("/user/:userId/permissions/grant"),
        { preHandler: authenticate(userUseCases), schema: managePermissionSchema },
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

    app.post<{ Params: { userId: string }; Body: { namespace: PermissionNamespace; permission: string } }>(
        prefixUrl("/user/:userId/permissions/revoke"),
        { preHandler: authenticate(userUseCases), schema: managePermissionSchema },
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

    app.get<{ Params: { userId: string } }>(
        prefixUrl("/user/:userId/permissions"),
        { preHandler: authenticate(userUseCases) },
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

    app.get<{ Params: { userId: string }; Querystring: { namespace: PermissionNamespace; permission: string } }>(
        prefixUrl("/user/:userId/permissions/check"),
        { preHandler: authenticate(userUseCases) },
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

            const slugs = result.data.permissions[namespace] as readonly string[];
            const hasPermission = slugs.includes(`${namespace}.${permission}`);

            return reply.send({ hasPermission });
        },
    );
};

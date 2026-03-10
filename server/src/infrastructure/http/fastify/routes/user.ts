import type { FastifyReply, FastifySchema } from "fastify";
import jsonwebtoken from "jsonwebtoken";

import type { PaginationOptions } from "@domain/repositories/UserRepository";
import { namespaces, type PermissionNamespace } from "@domain/value-object/Permissions";

import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { UserError, PermissionError } from "@application/users/errors";
import type { UserDto } from "@application/users/dto";

import type { RegisterRouteFn } from "../types";
import { environment, jwt } from "../config";
import { authenticate } from "../middlewares/auth";


export interface UserRoutesDependencies {
    userUseCases: IUserUseCases;
}

type UserOrPermissionError = UserError | PermissionError;

const loginSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string" },
            password: { type: "string" },
        },
        additionalProperties: false,
    }
}

function mapErrorToHttpErrorCode(error: UserOrPermissionError): number {
    switch (error) {
        case "user_not_found":
            return 404;
        case "user_not_authorized":
        case "password_verify_failed":
        case "permission_not_authorized":
            return 401;
        case "username_already_exists":
        case "username_too_long":
        case "password_too_short":
        case "password_too_long":
        case "password_week_upper_case_letter":
        case "password_week_lower_case_letter":
        case "password_week_number":
        case "password_week_symbol":
        case "username_too_short":
        case "permission_invalid_action":
        case "permission_invalid_namespace":
        case "permission_invalid_slug":
            return 400;
        case "user_repo_error":
        case "user_save_failed":
            return 500;
    }
    return 500;
}

function setAuthCookie(reply: FastifyReply, user: UserDto) {
    const payload = {
        userId: user.id,
        version: user.sessionVersion,
    };
    const token = jsonwebtoken.sign(
        payload,
        jwt.secret,
        { expiresIn: `${jwt.expiresIn}s`,
    });
    
    reply.setCookie("auth", token, {
        httpOnly: true,                       // Only accessible by the server
        secure: environment === "production", // Only send over HTTPS in production
        sameSite: "strict",                   // Prevent CSRF attacks
        maxAge: jwt.expiresIn * 1000,         // In milliseconds
        path: "/",
    });
}

function clearAuthCookie(reply: FastifyReply) {
    reply.clearCookie("auth", {
        path: "/",
    });
}

function sendErrorResponse(reply: FastifyReply, error: UserOrPermissionError) {
    return reply
        .status(mapErrorToHttpErrorCode(error))
        .send({ error });
}

function userToResponse(user: UserDto) {
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        permissions: user.permissions,
    }
}

export const registerUserRoutes: RegisterRouteFn<UserRoutesDependencies> = (app, prefixUrl, { userUseCases }) => {
    app.post(prefixUrl("/login"), { schema: loginSchema }, async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };
        const result = await userUseCases.getByUsername.execute(username);

        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }

        const user = result.data;
        const verifyPasswordResult = await userUseCases.verifyPassword.execute(user.id, password);

        if (verifyPasswordResult.isError()) {
            return sendErrorResponse(reply, verifyPasswordResult.error);
        }

        setAuthCookie(reply, user);
        return reply.send(userToResponse(user));
    });

    app.post(prefixUrl("/signup"), { schema: loginSchema }, async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };
        const result = await userUseCases.create.execute({ username, password });

        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }

        const user = result.data;

        setAuthCookie(reply, user);
        return reply.send(userToResponse(user));
    });


    app.get(prefixUrl("/me"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        return reply.send(userToResponse(request.user!));
    });

    app.post<{ Querystring: { all?: string } }>(prefixUrl("/logout"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        clearAuthCookie(reply);
        // if ?all=true, increment the session version for all users
        if (request.query.all === "true") {
            await userUseCases.incrementSessionVersion.execute(request.user!.id);
        }
        return reply.send({ message: "logout_success" });
    });


    app.post(prefixUrl("/update-password"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const { password } = request.body as { password: string };
        const result = await userUseCases.updatePassword.execute(request.user!.id, password);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "password_updated" });
    });

    app.post(prefixUrl("/refresh-token"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        setAuthCookie(reply, request.user!);
        return reply.send(userToResponse(request.user!));
    });

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
                return sendErrorResponse(reply, result.error);
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
                return sendErrorResponse(reply, result.error);
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
                return sendErrorResponse(reply, result.error);
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
                return sendErrorResponse(reply, result.error);
            }

            const slugs = result.data.permissions[namespace];
            const hasPermission = slugs.includes(`${namespace}.${permission}`);

            return reply.send({ hasPermission });
        },
    );

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/deactivate/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.deactivate.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        clearAuthCookie(reply);
        return reply.send({ message: "user_deactivated" });
    });

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/activate/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.activate.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "user_activated" });
    });

    app.get<{Querystring: {
        limit?: string;
        offset?: string;
        sort?: "asc" | "desc";
        sortBy?: "id" | "username" | "createdAt" | "updatedAt";
        isActive?: string;
        createdAt?: string;
        updatedAt?: string;
    }}>(prefixUrl("/users"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const options: PaginationOptions = {
            limit: request.query.limit ? parseInt(request.query.limit) : undefined,
            offset: request.query.offset ? parseInt(request.query.offset) : undefined,
            sort: request.query.sort === "asc" ? "asc" : "desc",
            sortBy: request.query.sortBy === "id" ? "id" : request.query.sortBy === "username" ? "username" : request.query.sortBy === "createdAt" ? "createdAt" : request.query.sortBy === "updatedAt" ? "updatedAt" : undefined,
            filter: {
                isActive: request.query.isActive ? request.query.isActive === "true" : undefined,
                createdAt: request.query.createdAt ? new Date(request.query.createdAt) : undefined,
                updatedAt: request.query.updatedAt ? new Date(request.query.updatedAt) : undefined,
            }
        };
        
        const result = await userUseCases.getAll.execute(request.user!.id, options);

        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send(result.data.map(userToResponse));
    });
}

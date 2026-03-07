import type { FastifyReply, FastifySchema } from "fastify";
import jsonwebtoken from "jsonwebtoken";

import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../types";
import type { UserError } from "@application/users/errors";
import type { UserDto } from "@application/users/dto";

import { environment, jwt } from "../config";
import { authenticate } from "../middlewares/auth";
import type { PaginationOptions } from "@domain/repositories/UserRepository";


export interface UserRoutesDependencies {
    userUseCases: IUserUseCases;
}

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

function mapUserErrorToHttpErrorCode(error: UserError): number {
    switch (error) {
        case "user_not_found":
            return 404;
        case "user_not_authorized":
        case "password_verify_failed":
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

function sendErrorResponse(reply: FastifyReply, error: UserError) {
    return reply
        .status(mapUserErrorToHttpErrorCode(error))
        .send({ error });
}

function userToResponse(user: UserDto) {
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        isRoot: user.isRoot,
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
        return reply.send({ message: "Logged out successfully" });
    });


    app.post(prefixUrl("/update-password"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const { password } = request.body as { password: string };
        const result = await userUseCases.updatePassword.execute(request.user!.id, password);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "Password updated successfully" });
    });

    app.post(prefixUrl("/refresh-token"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        setAuthCookie(reply, request.user!);
        return reply.send(userToResponse(request.user!));
    });

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/deactivate/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.deactivate.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        clearAuthCookie(reply);
        return reply.send({ message: "User deactivated successfully" });
    });

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/activate/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.activate.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "User activated successfully" });
    });

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/grant-admin/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.grantAdmin.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "Admin granted successfully" });
    });

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/revoke-admin/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.revokeAdmin.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "Admin revoked successfully" });
    });

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/grant-root/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.grantRoot.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "Root granted successfully" });
    });

    app.post<{ Params: { userId: string } }>(prefixUrl("/user/revoke-root/:userId"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await userUseCases.revokeRoot.execute(request.params.userId, request.user!.id);
        if (result.isError()) {
            return sendErrorResponse(reply, result.error);
        }
        return reply.send({ message: "Root revoked successfully" });
    });

    app.get<{Querystring: {
        limit?: string;
        offset?: string;
        sort?: "asc" | "desc";
        sortBy?: "id" | "username" | "createdAt" | "updatedAt";
        isRoot?: string;
        isAdmin?: string;
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
                isRoot: request.query.isRoot ? request.query.isRoot === "true" : undefined,
                isAdmin: request.query.isAdmin ? request.query.isAdmin === "true" : undefined,
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

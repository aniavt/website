import type { FastifyReply, FastifyRequest } from "fastify";
import jsonwebtoken from "jsonwebtoken";

import { err, ok, type Result } from "@lib/result";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { UserDto } from "@application/users/dto";
import type { UserError } from "@application/users/errors";

import { jwt } from "../config";


export type UserAuthenticationError = 
    | UserError
    | "token_verification_failed"
    | "token_revoked"
    | "token_not_found"
    | "token_expired";

// Extension of the FastifyRequest interface to add the user property
declare module "fastify" {
    interface FastifyRequest {
        user?: UserDto | null;
    }
}

export function authenticate(userUseCases: IUserUseCases) {
    return async (request: FastifyRequest, reply: FastifyReply) =>  {
        const result = await getUserFromRequest(request, userUseCases);
        if (result.isError()) {
            if (result.error.startsWith("token_") || result.error === "user_not_found") {
                return reply.status(401).send({ error: result.error });
            }
            return reply.status(500).send({ error: result.error });
        }

        request.user = result.data;
    }
}

/** Sets request.user when auth succeeds; leaves it undefined when no/invalid token. Does not reply 401. */
export function optionalAuthenticate(userUseCases: IUserUseCases) {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
        const result = await getUserFromRequest(request, userUseCases);
        request.user = result.isSuccess() ? result.data : undefined;
    }
}

export async function getUserFromRequest(request: FastifyRequest, userUseCases: IUserUseCases): Promise<Result<UserDto, UserAuthenticationError>> {
    const token = request.cookies.auth;
    if (!token) return err("token_not_found");

    const decoded = verifyToken(token);
    if (!decoded) return err("token_verification_failed");

    const result = await userUseCases.getById.execute(decoded.userId);
    if (result.isError() || !result.data.isActive) return err("user_not_found");

    const user = result.data;
    if (user.sessionVersion !== decoded.version) return err("token_revoked");

    return ok(user);
}

function verifyToken(token: string) {
    try {
        const decoded = jsonwebtoken.verify(token, jwt.secret);
        if (typeof decoded !== "object" || decoded === null) {
            return null;
        }

        return {
            userId: decoded["userId"] as string,
            version: decoded["version"] as number,
        };
    } catch (_error) {
        return null;
    }
}
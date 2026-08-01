import type { FastifyReply } from "fastify";
import jsonwebtoken from "jsonwebtoken";

import type { UserDto } from "@application/users/dto";
import { environment, jwt } from "../../config";

export function setAuthCookie(reply: FastifyReply, user: UserDto) {
    const payload = {
        userId: user.id,
        version: user.sessionVersion,
    };
    const token = jsonwebtoken.sign(
        payload,
        jwt.secret,
        { expiresIn: `${jwt.expiresIn}s` },
    );

    reply.setCookie("auth", token, {
        httpOnly: true,
        secure: environment === "production",
        sameSite: "strict",
        maxAge: jwt.expiresIn * 1000,
        path: "/",
    });
}

export function clearAuthCookie(reply: FastifyReply) {
    reply.clearCookie("auth", {
        path: "/",
    });
}

export function userToResponse(user: UserDto) {
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        permissions: user.permissions,
    };
}

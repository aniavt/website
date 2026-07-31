import type { FastifySchema } from "fastify";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../../types";
import { authenticate } from "../../middlewares/auth";
import { sendUserError } from "../../errors";
import { clearAuthCookie, setAuthCookie, userToResponse } from "./helpers";

const loginSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string" },
            password: { type: "string" },
        },
        additionalProperties: false,
    },
};

export const registerUserAuthRoutes: RegisterRouteFn<{ userUseCases: IUserUseCases }> = (
    app,
    prefixUrl,
    { userUseCases },
) => {
    app.post(prefixUrl("/login"), { schema: loginSchema }, async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };
        const result = await userUseCases.login.execute({ username, password });

        if (result.isError()) {
            return sendUserError(reply, result.error);
        }

        setAuthCookie(reply, result.data);
        return reply.send(userToResponse(result.data));
    });

    app.post(prefixUrl("/signup"), { schema: loginSchema }, async (request, reply) => {
        const { username, password } = request.body as { username: string; password: string };
        const result = await userUseCases.create.execute({ username, password });

        if (result.isError()) {
            return sendUserError(reply, result.error);
        }

        setAuthCookie(reply, result.data);
        return reply.send(userToResponse(result.data));
    });

    app.get(prefixUrl("/me"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        return reply.send(userToResponse(request.user!));
    });

    app.post<{ Querystring: { all?: string } }>(
        prefixUrl("/logout"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            clearAuthCookie(reply);
            if (request.query.all === "true") {
                await userUseCases.incrementSessionVersion.execute(request.user!.id);
            }
            return reply.send({ message: "logout_success" });
        },
    );

    app.post(prefixUrl("/update-password"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const { password } = request.body as { password: string };
        const result = await userUseCases.updatePassword.execute(request.user!.id, password);
        if (result.isError()) {
            return sendUserError(reply, result.error);
        }
        return reply.send({ message: "password_updated" });
    });

    app.post(prefixUrl("/refresh-token"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        setAuthCookie(reply, request.user!);
        return reply.send(userToResponse(request.user!));
    });
};

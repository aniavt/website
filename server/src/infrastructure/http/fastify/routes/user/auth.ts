import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import {
    CreateUserInputSchema,
    LoginRequestSchema,
    UpdatePasswordInputSchema,
} from "@ania/api-contract/user";
import type { RegisterRouteFn } from "../../types";
import { authenticate } from "../../middlewares/auth";
import { sendUserError } from "../../errors";
import { clearAuthCookie, setAuthCookie, userToResponse } from "./helpers";
import { LogoutQuerySchema } from "../../route-schemas";

export const registerUserAuthRoutes: RegisterRouteFn<{
    userUseCases: IUserUseCases;
    userRepository: UserRepository;
}> = (
    app,
    prefixUrl,
    { userUseCases, userRepository },
) => {
    app.post(
        prefixUrl("/login"),
        { schema: { body: LoginRequestSchema } },
        async (request, reply) => {
            const { username, password } = request.body;
            const result = await userUseCases.login.execute({ username, password });

            if (result.isError()) {
                return sendUserError(reply, result.error);
            }

            setAuthCookie(reply, result.data);
            return reply.send(userToResponse(result.data));
        },
    );

    app.post(
        prefixUrl("/signup"),
        {
            preHandler: authenticate(userRepository),
            schema: { body: CreateUserInputSchema },
        },
        async (request, reply) => {
            const { username, password } = request.body;
            const result = await userUseCases.create.execute(request.user!.id, {
                username,
                password,
            });

            if (result.isError()) {
                return sendUserError(reply, result.error);
            }

            return reply.status(201).send(userToResponse(result.data));
        },
    );

    app.get(prefixUrl("/me"), { preHandler: authenticate(userRepository) }, async (request, reply) => {
        return reply.send(userToResponse(request.user!));
    });

    app.post(
        prefixUrl("/logout"),
        {
            preHandler: authenticate(userRepository),
            schema: { querystring: LogoutQuerySchema },
        },
        async (request, reply) => {
            clearAuthCookie(reply);
            if (request.query.all === "true") {
                await userUseCases.incrementSessionVersion.execute(request.user!.id);
            }
            return reply.send({ message: "logout_success" });
        },
    );

    app.post(
        prefixUrl("/update-password"),
        {
            preHandler: authenticate(userRepository),
            schema: { body: UpdatePasswordInputSchema },
        },
        async (request, reply) => {
            const { password } = request.body;
            const result = await userUseCases.updatePassword.execute(request.user!.id, password);
            if (result.isError()) {
                return sendUserError(reply, result.error);
            }
            return reply.send({ message: "password_updated" });
        },
    );

    app.post(
        prefixUrl("/refresh-token"),
        { preHandler: authenticate(userRepository) },
        async (request, reply) => {
            setAuthCookie(reply, request.user!);
            return reply.send(userToResponse(request.user!));
        },
    );
};

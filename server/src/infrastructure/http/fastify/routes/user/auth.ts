import type { IUserUseCases } from "@application/users/IUserUseCases";
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

export const registerUserAuthRoutes: RegisterRouteFn<{ userUseCases: IUserUseCases }> = (
    app,
    prefixUrl,
    { userUseCases },
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
        { schema: { body: CreateUserInputSchema } },
        async (request, reply) => {
            const { username, password } = request.body;
            const result = await userUseCases.create.execute({ username, password });

            if (result.isError()) {
                return sendUserError(reply, result.error);
            }

            setAuthCookie(reply, result.data);
            return reply.send(userToResponse(result.data));
        },
    );

    app.get(prefixUrl("/me"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        return reply.send(userToResponse(request.user!));
    });

    app.post(
        prefixUrl("/logout"),
        {
            preHandler: authenticate(userUseCases),
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
            preHandler: authenticate(userUseCases),
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
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            setAuthCookie(reply, request.user!);
            return reply.send(userToResponse(request.user!));
        },
    );
};

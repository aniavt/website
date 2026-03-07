import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import Fastify from "fastify";
import cookie from "@fastify/cookie";

import { startRequestLogging, endRequestLogging } from "./middlewares/logger";
import { registerUserRoutes } from "./routes/user";
import { registerFaqRoutes } from "./routes/faq";


export interface FastifyServerDependencies {
    userUseCases: IUserUseCases;
    faqUseCases: IFaqUseCases;
}

export async function createFastifyServer(
    listenPort: number,
    listenHostname: string,
    deps: FastifyServerDependencies
): Promise<void> {
    const { userUseCases, faqUseCases } = deps;
    const app = Fastify();
    const prefixUrl = (path: string) => path === "/" ? "" : path;

    app.register(cookie, {
        secret: Bun.env.COOKIE_SECRET,
    });

    app.addHook("onRequest", startRequestLogging);
    app.addHook("onResponse", endRequestLogging);

    app.get("/", async (request, reply) => {
        return reply.send({ message: "Ania API is running" });
    });

    // Decorate the FastifyRequest interface to add the user property
    // In "middlewares/auth.ts" we declare the type of the user property
    app.decorateRequest("user", null);

    registerUserRoutes(app, prefixUrl, { userUseCases });
    registerFaqRoutes(app, prefixUrl, { userUseCases, faqUseCases });

    await app.listen({ port: listenPort, host: listenHostname }).then(() => {
        console.log(`Server is running on port ${listenPort}`);
    });
}
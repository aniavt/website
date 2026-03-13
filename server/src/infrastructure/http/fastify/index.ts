import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import type { IWeeklyScheduleUseCases } from "@application/weekly_schedule/IWeeklyScheduleUseCases";
import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";

import { startRequestLogging, endRequestLogging } from "./middlewares/logger";
import { registerUserRoutes } from "./routes/user";
import { registerFaqRoutes } from "./routes/faq";
import { registerWeeklyScheduleRoutes } from "./routes/weekly_schedule";
import { registerMediaRoutes } from "./routes/media";


export interface FastifyServerDependencies {
    userUseCases: IUserUseCases;
    faqUseCases: IFaqUseCases;
    weeklyScheduleUseCases: IWeeklyScheduleUseCases;
    mediaUseCases: IMediaUseCases;
}

export async function createFastifyServer(
    listenPort: number,
    listenHostname: string,
    deps: FastifyServerDependencies
): Promise<void> {
    const { userUseCases, faqUseCases, weeklyScheduleUseCases, mediaUseCases } = deps;
    const app = Fastify();
    const prefixUrl = (path: string) => path === "/" ? "" : path;

    app.register(cookie, {
        secret: Bun.env.COOKIE_SECRET,
    });
    app.register(multipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        },
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
    registerWeeklyScheduleRoutes(app, prefixUrl, { userUseCases, weeklyScheduleUseCases, mediaUseCases });
    registerMediaRoutes(app, prefixUrl, { mediaUseCases });

    await app.listen({ port: listenPort, host: listenHostname }).then(() => {
        console.log(`Server is running on port ${listenPort}`);
    });
}
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import type { IWeeklyScheduleUseCases } from "@application/weekly_schedule/IWeeklyScheduleUseCases";
import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import type { IAnimeUseCases } from "@application/anime/IAnimeUseCases";
import type { IChapterUseCases } from "@application/chapter/IChapterUseCases";
import type { INavItemsUseCases } from "@application/navItems/INavItemsUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { UPLOAD_MAX_FILE_BYTES } from "@ania/api-contract/media";

import { startRequestLogging, endRequestLogging } from "./middlewares/logger";
import { registerUserRoutes } from "./routes/user";
import { registerFaqRoutes } from "./routes/faq";
import { registerWeeklyScheduleRoutes } from "./routes/weekly_schedule";
import { registerMediaRoutes } from "./routes/media";
import { registerAnimeRoutes } from "./routes/anime";
import { registerChapterRoutes } from "./routes/chapter";
import { registerNavItemsRoutes } from "./routes/navItems";


export interface FastifyServerDependencies {
    userUseCases: IUserUseCases;
    userRepository: UserRepository;
    faqUseCases: IFaqUseCases;
    weeklyScheduleUseCases: IWeeklyScheduleUseCases;
    mediaUseCases: IMediaUseCases;
    animeUseCases: IAnimeUseCases;
    chapterUseCases: IChapterUseCases;
    navItemsUseCases: INavItemsUseCases;
}

export async function createFastifyServer(
    listenPort: number,
    listenHostname: string,
    deps: FastifyServerDependencies
): Promise<void> {
    const {
        userUseCases,
        userRepository,
        faqUseCases,
        weeklyScheduleUseCases,
        mediaUseCases,
        animeUseCases,
        chapterUseCases,
        navItemsUseCases,
    } = deps;
    const app = Fastify({ bodyLimit: UPLOAD_MAX_FILE_BYTES }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    const prefixUrl = (path: string) => path === "/" ? "" : path;

    app.register(cookie, {
        secret: Bun.env.COOKIE_SECRET,
    });
    app.register(multipart, {
        limits: {
            fileSize: UPLOAD_MAX_FILE_BYTES,
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
    app.decorateRequest("userEntity", null);

    registerUserRoutes(app, prefixUrl, { userUseCases, userRepository });
    registerFaqRoutes(app, prefixUrl, { userUseCases, userRepository, faqUseCases });
    registerWeeklyScheduleRoutes(app, prefixUrl, { userUseCases, userRepository, weeklyScheduleUseCases });
    registerMediaRoutes(app, prefixUrl, { mediaUseCases, userUseCases, userRepository });
    registerAnimeRoutes(app, prefixUrl, { userUseCases, userRepository, animeUseCases });
    registerChapterRoutes(app, prefixUrl, { userUseCases, userRepository, chapterUseCases });
    registerNavItemsRoutes(app, prefixUrl, { userUseCases, userRepository, navItemsUseCases });

    await app.listen({ port: listenPort, host: listenHostname }).then(() => {
        console.log(`Server is running on port ${listenPort}`);
    });
}

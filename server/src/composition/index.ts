import { createFastifyServer } from "@infrastructure/http/fastify";
import { createCli } from "@infrastructure/cli";

export { userUseCases } from "./users";
export { mediaService } from "./media";
export { faqUseCases } from "./faq";
export { weeklyScheduleUseCases } from "./weekly_schedule";
export { animeUseCases, chapterUseCases } from "./anime";
export { navItemsUseCases } from "./nav_items";

import { userUseCases, userRepository } from "./users";
import { mediaService } from "./media";
import { faqUseCases } from "./faq";
import { weeklyScheduleUseCases } from "./weekly_schedule";
import { animeUseCases, chapterUseCases } from "./anime";
import { navItemsUseCases } from "./nav_items";

export async function startHttpServer(): Promise<void> {
    const hostname = Bun.env.HOSTNAME || "0.0.0.0";
    await createFastifyServer(
        Number(Bun.env.PORT),
        hostname,
        {
            userUseCases,
            userRepository,
            faqUseCases,
            weeklyScheduleUseCases,
            mediaService,
            animeUseCases,
            chapterUseCases,
            navItemsUseCases,
        },
    );
}

export async function startCli(interactive: boolean = false): Promise<void> {
    await createCli(
        interactive,
        userUseCases,
    );
}

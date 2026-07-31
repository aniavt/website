import { createFastifyServer } from "@infrastructure/http/fastify";
import { createCli } from "@infrastructure/cli";

export { userUseCases } from "./users";
export { mediaUseCases } from "./media";
export { faqUseCases } from "./faq";
export { weeklyScheduleUseCases } from "./weekly_schedule";
export { animeUseCases, chapterUseCases } from "./anime";
export { navItemsUseCases } from "./navItems";

import { userUseCases, userRepository } from "./users";
import { mediaUseCases } from "./media";
import { faqUseCases } from "./faq";
import { weeklyScheduleUseCases } from "./weekly_schedule";
import { animeUseCases, chapterUseCases } from "./anime";
import { navItemsUseCases } from "./navItems";

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
            mediaUseCases,
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

import type { FastifyReply } from "fastify";
import type { RegisterRouteFn } from "../types";
import type { IMediaUseCases } from "@application/media/IMediaUseCases";

export interface MediaRoutesDependencies {
    mediaUseCases: IMediaUseCases;
}

export const registerMediaRoutes: RegisterRouteFn<MediaRoutesDependencies> = (
    app,
    prefixUrl,
    { mediaUseCases },
) => {
    app.get<{ Params: { id: string } }>(prefixUrl("/media/:id"), async (request, reply: FastifyReply) => {
        const { id } = request.params;
        const url = await mediaUseCases.getFileUrl.execute(id);
        if (!url) {
            return reply.status(404).send({ error: "media_not_found" });
        }

        return reply.redirect(url, 302);
    });
};


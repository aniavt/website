import type { FastifyReply, FastifyRequest } from "fastify";
import type { RegisterRouteFn } from "../types";
import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import type { MediaError } from "@application/media/errors";

export interface MediaRoutesDependencies {
    mediaUseCases: IMediaUseCases;
}

function mapMediaErrorToHttpCode(error: MediaError): number {
    switch (error) {
        case "media_invalid_input":
            return 400;
        case "media_upload_failed":
        case "media_delete_failed":
            return 500;
        default:
            return 500;
    }
}

function sendMediaError(reply: FastifyReply, error: MediaError) {
    return reply.status(mapMediaErrorToHttpCode(error)).send({ error });
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

    app.post(prefixUrl("/media/upload"), async (request: FastifyRequest, reply: FastifyReply) => {
        const file = await (request as any).file?.();
        if (!file) {
            return sendMediaError(reply, "media_invalid_input");
        }

        const buffer = await file.toBuffer();
        const uploadResult = await mediaUseCases.uploadFile.execute({
            name: file.filename,
            contentType: file.mimetype,
            size: buffer.length,
            body: buffer,
            isPrivate: false,
        });

        if (uploadResult.isError()) {
            return sendMediaError(reply, uploadResult.error);
        }

        return reply.status(201).send(uploadResult.data);
    });
};


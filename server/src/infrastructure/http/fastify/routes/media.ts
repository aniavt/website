import type { RegisterRouteFn } from "../types";
import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { sendMediaError } from "../errors";
import { authenticate } from "../middlewares/auth";
import { parseMultipartFile } from "../multipart";
import { IdParamsSchema } from "../route-schemas";

export interface MediaRoutesDependencies {
    mediaUseCases: IMediaUseCases;
    userUseCases: IUserUseCases;
    userRepository: UserRepository;
}

export const registerMediaRoutes: RegisterRouteFn<MediaRoutesDependencies> = (
    app,
    prefixUrl,
    { mediaUseCases, userRepository },
) => {
    app.get(
        prefixUrl("/media/:id"),
        { schema: { params: IdParamsSchema } },
        async (request, reply) => {
            const url = await mediaUseCases.getFileUrl.execute(request.params.id);
            if (!url) {
                return reply.status(404).send({ error: "media_not_found" });
            }

            return reply.redirect(url, 302);
        },
    );

    app.post(
        prefixUrl("/media/upload"),
        { preHandler: authenticate(userRepository) },
        async (request, reply) => {
            const parsed = await parseMultipartFile(request);
            if (!parsed.ok) {
                return sendMediaError(reply, "media_invalid_input");
            }

            const uploadResult = await mediaUseCases.uploadFile.execute({
                ...parsed.file,
                isPrivate: false,
            });

            if (uploadResult.isError()) {
                return sendMediaError(reply, uploadResult.error);
            }

            return reply.status(201).send(uploadResult.data);
        },
    );
};

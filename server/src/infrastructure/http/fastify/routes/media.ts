import type { RegisterRouteFn } from "../types";
import type { MediaService } from "@domain/services/MediaService";
import { toFileDto } from "@application/media/dto";
import { mediaErrorFromUnknown } from "@application/media/errors";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { sendMediaError } from "../errors";
import { authenticate } from "../middlewares/auth";
import { parseMultipartFile } from "../multipart";
import { IdParamsSchema } from "../route-schemas";

export interface MediaRoutesDependencies {
    mediaService: MediaService;
    userUseCases: IUserUseCases;
    userRepository: UserRepository;
}

export const registerMediaRoutes: RegisterRouteFn<MediaRoutesDependencies> = (
    app,
    prefixUrl,
    { mediaService, userRepository },
) => {
    app.get(
        prefixUrl("/media/:id"),
        { schema: { params: IdParamsSchema } },
        async (request, reply) => {
            const url = await mediaService.getUrl(request.params.id);
            if (!url) {
                return sendMediaError(reply, "media_not_found");
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

            try {
                const file = await mediaService.upload(parsed.file);
                return reply.status(201).send(toFileDto(file));
            } catch (error) {
                return sendMediaError(reply, mediaErrorFromUnknown(error, "media_upload_failed"));
            }
        },
    );
};

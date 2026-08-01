import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IAnimeUseCases } from "@application/anime/IAnimeUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import {
   CreateAnimeInputSchema,
   UpdateAnimeInputSchema,
} from "@ania/api-contract/anime";
import type { RegisterRouteFn } from "../types";
import { sendAnimeError } from "../errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import { ActiveOnlyQuerySchema, IdParamsSchema } from "../route-schemas";

export interface AnimeRoutesDependencies {
   userUseCases: IUserUseCases;
   userRepository: UserRepository;
   animeUseCases: IAnimeUseCases;
}

export const registerAnimeRoutes: RegisterRouteFn<AnimeRoutesDependencies> = (
   app,
   prefixUrl,
   { userRepository, animeUseCases },
) => {
   app.post(
      prefixUrl("/anime"),
      {
         preHandler: authenticate(userRepository),
         schema: { body: CreateAnimeInputSchema },
      },
      async (request, reply) => {
         const result = await animeUseCases.createAnime.execute(request.user!.id, request.body);
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.status(201).send(result.data);
      },
   );

   app.patch(
      prefixUrl("/anime/:id"),
      {
         preHandler: authenticate(userRepository),
         schema: { params: IdParamsSchema, body: UpdateAnimeInputSchema },
      },
      async (request, reply) => {
         const result = await animeUseCases.updateAnime.execute(request.user!.id, {
            id: request.params.id,
            ...request.body,
         });
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.delete(
      prefixUrl("/anime/:id"),
      {
         preHandler: authenticate(userRepository),
         schema: { params: IdParamsSchema },
      },
      async (request, reply) => {
         const result = await animeUseCases.deleteAnime.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.post(
      prefixUrl("/anime/:id/restore"),
      {
         preHandler: authenticate(userRepository),
         schema: { params: IdParamsSchema },
      },
      async (request, reply) => {
         const result = await animeUseCases.restoreAnime.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get(
      prefixUrl("/anime"),
      {
         preHandler: optionalAuthenticate(userRepository),
         schema: { querystring: ActiveOnlyQuerySchema },
      },
      async (request, reply) => {
         const activeOnly = request.query.activeOnly === "true";
         const requesterId = activeOnly ? null : (request.user?.id ?? null);
         const result = await animeUseCases.listAnimes.execute(requesterId, { activeOnly });
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get(
      prefixUrl("/anime/:id"),
      { schema: { params: IdParamsSchema } },
      async (request, reply) => {
         const result = await animeUseCases.getAnimeById.execute(request.params.id);
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );
};

import type { FastifyReply, FastifySchema } from "fastify";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IAnimeUseCases } from "@application/anime/IAnimeUseCases";
import type { RegisterRouteFn } from "../types";
import type { AnimeError } from "@application/anime/errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";

export interface AnimeRoutesDependencies {
   userUseCases: IUserUseCases;
   animeUseCases: IAnimeUseCases;
}

function mapAnimeErrorToHttpCode(error: AnimeError): number {
   switch (error) {
      case "anime_not_found":
         return 404;
      case "anime_not_authorized":
         return 401;
      case "anime_invalid_transition":
         return 400;
      case "anime_save_failed":
         return 500;
      default:
         return 500;
   }
}

function sendAnimeError(reply: FastifyReply, error: AnimeError) {
   return reply.status(mapAnimeErrorToHttpCode(error)).send({ error });
}

const createAnimeSchema: FastifySchema = {
   body: {
      type: "object",
      required: ["title", "genre", "status"],
      properties: {
         title: { type: "string" },
         description: { type: "string" },
         coverImageURL: { type: "string" },
         genre: { type: "string" },
         status: { type: "string", enum: ["watching", "completed", "upcoming"] },
      },
      additionalProperties: false,
   },
};

const updateAnimeSchema: FastifySchema = {
   body: {
      type: "object",
      properties: {
         title: { type: "string" },
         description: { type: "string" },
         coverImageURL: { type: "string" },
         genre: { type: "string" },
         status: { type: "string", enum: ["watching", "completed", "upcoming"] },
      },
      additionalProperties: false,
   },
};

export const registerAnimeRoutes: RegisterRouteFn<AnimeRoutesDependencies> = (
   app,
   prefixUrl,
   { userUseCases, animeUseCases },
) => {
   app.post(
      prefixUrl("/anime"),
      { preHandler: authenticate(userUseCases), schema: createAnimeSchema },
      async (request, reply) => {
         const body = request.body as { title: string; description?: string; coverImageURL?: string; genre: string; status: "watching" | "completed" | "upcoming" };
         const result = await animeUseCases.createAnime.execute(request.user!.id, body);
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.status(201).send(result.data);
      },
   );

   app.patch<{ Params: { id: string } }>(
      prefixUrl("/anime/:id"),
      { preHandler: authenticate(userUseCases), schema: updateAnimeSchema },
      async (request, reply) => {
         const body = request.body as { title?: string; description?: string; coverImageURL?: string; genre?: string; status?: "watching" | "completed" | "upcoming" };
         const result = await animeUseCases.updateAnime.execute(request.user!.id, {
            id: request.params.id,
            ...body,
         });
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.delete<{ Params: { id: string } }>(
      prefixUrl("/anime/:id"),
      { preHandler: authenticate(userUseCases) },
      async (request, reply) => {
         const result = await animeUseCases.deleteAnime.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.post<{ Params: { id: string } }>(
      prefixUrl("/anime/:id/restore"),
      { preHandler: authenticate(userUseCases) },
      async (request, reply) => {
         const result = await animeUseCases.restoreAnime.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get<{ Querystring: { activeOnly?: string } }>(
      prefixUrl("/anime"),
      { preHandler: optionalAuthenticate(userUseCases) },
      async (request, reply) => {
         const activeOnly = request.query.activeOnly === "true";
         const requesterId = activeOnly ? null : (request.user?.id ?? null);
         const result = await animeUseCases.listAnimes.execute(requesterId, { activeOnly });
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get<{ Params: { id: string } }>(
      prefixUrl("/anime/:id"),
      async (request, reply) => {
         const result = await animeUseCases.getAnimeById.execute(request.params.id);
         if (result.isError()) return sendAnimeError(reply, result.error);
         return reply.send(result.data);
      },
   );
};

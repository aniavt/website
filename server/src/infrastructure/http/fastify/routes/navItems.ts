import type { FastifyReply, FastifySchema } from "fastify";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../types";
import { sendNavItemsError } from "../errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import type { INavItemsUseCases } from "@application/navItems/INavItemsUseCases";

export interface NavItemsRoutesDependencies {
   userUseCases: IUserUseCases;
   navItemsUseCases: INavItemsUseCases;
}

const createNavItemsSchema: FastifySchema = {
   body: {
      type: "object",
      required: ["title", "path", "position"],
      properties: {
         title: { type: "string" },
         path: { type: "string" },
         position: { type: "number"}
      },
      additionalProperties: false,
   },
};

const updateNavItemsSchema: FastifySchema = {
   body: {
      type: "object",
      properties: {
         title: { type: "string" },
         path: { type: "string" },
         position: { type: "number"}
      },
      additionalProperties: false,
   },
};

export const registerNavItemsRoutes: RegisterRouteFn<NavItemsRoutesDependencies> = (
   app,
   prefixUrl,
   { userUseCases, navItemsUseCases },
) => {
   app.post(
      prefixUrl("/navItems"),
      { preHandler: authenticate(userUseCases), schema: createNavItemsSchema },
      async (request, reply) => {
         const body = request.body as { title: string; path: string, position: number};
         const result = await navItemsUseCases.createNavItems.execute(request.user!.id, body);
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.status(201).send(result.data);
      },
   );

   app.patch<{ Params: { id: string } }>(
      prefixUrl("/navItems/:id"),
      { preHandler: authenticate(userUseCases), schema: updateNavItemsSchema },
      async (request, reply) => {
         const body = request.body as { title?: string; path?: string, position: number };
         const result = await navItemsUseCases.updateNavItems.execute(request.user!.id, {
            id: request.params.id,
            ...body,
         });
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.delete<{ Params: { id: string } }>(
      prefixUrl("/navItems/:id"),
      { preHandler: authenticate(userUseCases) },
      async (request, reply) => {
         const result = await navItemsUseCases.deleteNavItems.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.post<{ Params: { id: string } }>(
      prefixUrl("/navItems/:id/restore"),
      { preHandler: authenticate(userUseCases) },
      async (request, reply) => {
         const result = await navItemsUseCases.restoreNavItems.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get<{ Querystring: { activeOnly?: string } }>(
      prefixUrl("/navItems"),
      { preHandler: optionalAuthenticate(userUseCases) },
      async (request, reply) => {
         const activeOnly = request.query.activeOnly === "true";
         const requesterId = activeOnly ? null : (request.user?.id ?? null);
         const result = await navItemsUseCases.listNavItemss.execute(requesterId, { activeOnly });
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get<{ Params: { id: string } }>(
      prefixUrl("/navItems/:id"),
      async (request, reply) => {
         const result = await navItemsUseCases.getNavItemsById.execute(request.params.id);
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );
};

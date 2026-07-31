import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { RegisterRouteFn } from "../types";
import { sendNavItemsError } from "../errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import type { INavItemsUseCases } from "@application/navItems/INavItemsUseCases";
import {
   CreateNavItemsInputSchema,
   UpdateNavItemsInputSchema,
} from "@ania/api-contract/nav-items";
import { ActiveOnlyQuerySchema, IdParamsSchema } from "../route-schemas";

export interface NavItemsRoutesDependencies {
   userUseCases: IUserUseCases;
   navItemsUseCases: INavItemsUseCases;
}

export const registerNavItemsRoutes: RegisterRouteFn<NavItemsRoutesDependencies> = (
   app,
   prefixUrl,
   { userUseCases, navItemsUseCases },
) => {
   app.post(
      prefixUrl("/navItems"),
      {
         preHandler: authenticate(userUseCases),
         schema: { body: CreateNavItemsInputSchema },
      },
      async (request, reply) => {
         const result = await navItemsUseCases.createNavItems.execute(
            request.user!.id,
            request.body,
         );
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.status(201).send(result.data);
      },
   );

   app.patch(
      prefixUrl("/navItems/:id"),
      {
         preHandler: authenticate(userUseCases),
         schema: { params: IdParamsSchema, body: UpdateNavItemsInputSchema },
      },
      async (request, reply) => {
         const result = await navItemsUseCases.updateNavItems.execute(request.user!.id, {
            id: request.params.id,
            ...request.body,
         });
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.delete(
      prefixUrl("/navItems/:id"),
      {
         preHandler: authenticate(userUseCases),
         schema: { params: IdParamsSchema },
      },
      async (request, reply) => {
         const result = await navItemsUseCases.deleteNavItems.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.post(
      prefixUrl("/navItems/:id/restore"),
      {
         preHandler: authenticate(userUseCases),
         schema: { params: IdParamsSchema },
      },
      async (request, reply) => {
         const result = await navItemsUseCases.restoreNavItems.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get(
      prefixUrl("/navItems"),
      {
         preHandler: optionalAuthenticate(userUseCases),
         schema: { querystring: ActiveOnlyQuerySchema },
      },
      async (request, reply) => {
         const activeOnly = request.query.activeOnly === "true";
         const requesterId = activeOnly ? null : (request.user?.id ?? null);
         const result = await navItemsUseCases.listNavItemss.execute(requesterId, { activeOnly });
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.get(
      prefixUrl("/navItems/:id"),
      { schema: { params: IdParamsSchema } },
      async (request, reply) => {
         const result = await navItemsUseCases.getNavItemsById.execute(request.params.id);
         if (result.isError()) return sendNavItemsError(reply, result.error);
         return reply.send(result.data);
      },
   );
};

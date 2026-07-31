import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import {
  CreateFaqItemInputSchema,
  UpdateFaqItemInputSchema,
} from "@ania/api-contract/faq";
import type { RegisterRouteFn } from "../types";
import { sendFaqError } from "../errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import { ActiveOnlyQuerySchema, IdParamsSchema } from "../route-schemas";

export interface FaqRoutesDependencies {
  userUseCases: IUserUseCases;
  faqUseCases: IFaqUseCases;
}

export const registerFaqRoutes: RegisterRouteFn<FaqRoutesDependencies> = (
  app,
  prefixUrl,
  { userUseCases, faqUseCases },
) => {
  app.post(
    prefixUrl("/faq"),
    {
      preHandler: authenticate(userUseCases),
      schema: { body: CreateFaqItemInputSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.createFaqItem.execute(
        request.user!.id,
        request.body,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.status(201).send(result.data);
    },
  );

  app.patch(
    prefixUrl("/faq/:id"),
    {
      preHandler: authenticate(userUseCases),
      schema: { params: IdParamsSchema, body: UpdateFaqItemInputSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.updateFaqItem.execute(request.user!.id, {
        id: request.params.id,
        ...request.body,
      });
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );

  app.delete(
    prefixUrl("/faq/:id"),
    {
      preHandler: authenticate(userUseCases),
      schema: { params: IdParamsSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.deleteFaqItem.execute(
        request.user!.id,
        request.params.id,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );

  app.post(
    prefixUrl("/faq/:id/restore"),
    {
      preHandler: authenticate(userUseCases),
      schema: { params: IdParamsSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.restoreFaqItem.execute(
        request.user!.id,
        request.params.id,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );

  app.get(
    prefixUrl("/faq"),
    {
      preHandler: optionalAuthenticate(userUseCases),
      schema: { querystring: ActiveOnlyQuerySchema },
    },
    async (request, reply) => {
      const activeOnly = request.query.activeOnly === "true";
      const requesterId = request.user?.id ?? null;
      const result = !activeOnly
        ? await faqUseCases.listFaqItems.execute(requesterId, { activeOnly })
        : await faqUseCases.listFaqItems.execute(null, { activeOnly });
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );

  app.get(
    prefixUrl("/faq/:id"),
    { schema: { params: IdParamsSchema } },
    async (request, reply) => {
      const result = await faqUseCases.getFaqItem.execute(request.params.id);
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );

  app.get(
    prefixUrl("/faq/:id/history"),
    {
      preHandler: authenticate(userUseCases),
      schema: { params: IdParamsSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.getFaqHistory.execute(
        request.user!.id,
        request.params.id,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );
};

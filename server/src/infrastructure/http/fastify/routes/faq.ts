import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
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
  userRepository: UserRepository;
  faqUseCases: IFaqUseCases;
}

export const registerFaqRoutes: RegisterRouteFn<FaqRoutesDependencies> = (
  app,
  prefixUrl,
  { userRepository, faqUseCases },
) => {
  app.post(
    prefixUrl("/faq"),
    {
      preHandler: authenticate(userRepository),
      schema: { body: CreateFaqItemInputSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.createFaqItem.execute(
        request.userEntity!,
        request.body,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.status(201).send(result.data);
    },
  );

  app.patch(
    prefixUrl("/faq/:id"),
    {
      preHandler: authenticate(userRepository),
      schema: { params: IdParamsSchema, body: UpdateFaqItemInputSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.updateFaqItem.execute(request.userEntity!, {
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
      preHandler: authenticate(userRepository),
      schema: { params: IdParamsSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.deleteFaqItem.execute(
        request.userEntity!,
        request.params.id,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );

  app.post(
    prefixUrl("/faq/:id/restore"),
    {
      preHandler: authenticate(userRepository),
      schema: { params: IdParamsSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.restoreFaqItem.execute(
        request.userEntity!,
        request.params.id,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );

  app.get(
    prefixUrl("/faq"),
    {
      preHandler: optionalAuthenticate(userRepository),
      schema: { querystring: ActiveOnlyQuerySchema },
    },
    async (request, reply) => {
      const activeOnly = request.query.activeOnly === "true";
      const requester = request.userEntity ?? null;
      const result = !activeOnly
        ? await faqUseCases.listFaqItems.execute(requester, { activeOnly })
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
      preHandler: authenticate(userRepository),
      schema: { params: IdParamsSchema },
    },
    async (request, reply) => {
      const result = await faqUseCases.getFaqHistory.execute(
        request.userEntity!,
        request.params.id,
      );
      if (result.isError()) return sendFaqError(reply, result.error);
      return reply.send(result.data);
    },
  );
};

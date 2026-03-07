import type { FastifyReply, FastifySchema } from "fastify";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import type { RegisterRouteFn } from "../types";
import type { FaqError } from "@application/faq/errors";
import { authenticate } from "../middlewares/auth";

export interface FaqRoutesDependencies {
    userUseCases: IUserUseCases;
    faqUseCases: IFaqUseCases;
}

function mapFaqErrorToHttpCode(error: FaqError): number {
    switch (error) {
        case "faq_item_not_found":
        case "faq_text_not_found":
            return 404;
        case "faq_not_authorized":
            return 401;
        case "faq_invalid_transition":
            return 400;
        case "faq_save_failed":
            return 500;
        default:
            return 500;
    }
}

function sendFaqError(reply: FastifyReply, error: FaqError) {
    return reply.status(mapFaqErrorToHttpCode(error)).send({ error });
}

const createFaqItemSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["query", "answer"],
        properties: {
            query: { type: "string" },
            answer: { type: "string" },
        },
        additionalProperties: false,
    },
};

const updateFaqItemSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            query: { type: "string" },
            answer: { type: "string" },
        },
        additionalProperties: false,
    },
};

export const registerFaqRoutes: RegisterRouteFn<FaqRoutesDependencies> = (app, prefixUrl, { userUseCases, faqUseCases }) => {
    app.post(prefixUrl("/faq"), { preHandler: authenticate(userUseCases), schema: createFaqItemSchema }, async (request, reply) => {
        const body = request.body as { query: string; answer: string };
        const result = await faqUseCases.createFaqItem.execute(request.user!.id, body);
        if (result.isError()) return sendFaqError(reply, result.error);
        return reply.status(201).send(result.data);
    });

    app.patch<{ Params: { id: string } }>(
        prefixUrl("/faq/:id"),
        { preHandler: authenticate(userUseCases), schema: updateFaqItemSchema },
        async (request, reply) => {
            const body = request.body as { query?: string; answer?: string };
            const result = await faqUseCases.updateFaqItem.execute(request.user!.id, { id: request.params.id, ...body });
            if (result.isError()) return sendFaqError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.delete<{ Params: { id: string } }>(prefixUrl("/faq/:id"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await faqUseCases.deleteFaqItem.execute(request.user!.id, request.params.id);
        if (result.isError()) return sendFaqError(reply, result.error);
        return reply.send(result.data);
    });

    app.post<{ Params: { id: string } }>(prefixUrl("/faq/:id/restore"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await faqUseCases.restoreFaqItem.execute(request.user!.id, request.params.id);
        if (result.isError()) return sendFaqError(reply, result.error);
        return reply.send(result.data);
    });

    app.get<{ Querystring: { activeOnly?: string } }>(prefixUrl("/faq"), async (request, reply) => {
        const activeOnly = request.query.activeOnly === "true";
        const result = await faqUseCases.listFaqItems.execute({ activeOnly });
        if (result.isError()) return sendFaqError(reply, result.error);
        return reply.send(result.data);
    });

    app.get<{ Params: { id: string } }>(prefixUrl("/faq/:id"), async (request, reply) => {
        const result = await faqUseCases.getFaqItem.execute(request.params.id);
        if (result.isError()) return sendFaqError(reply, result.error);
        return reply.send(result.data);
    });

    app.get<{ Params: { id: string } }>(prefixUrl("/faq/:id/history"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const result = await faqUseCases.getFaqHistory.execute(request.user!.id, request.params.id);
        if (result.isError()) return sendFaqError(reply, result.error);
        return reply.send(result.data);
    });
};

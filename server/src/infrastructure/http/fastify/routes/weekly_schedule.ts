import type { FastifySchema } from "fastify";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IWeeklyScheduleUseCases } from "@application/weekly_schedule/IWeeklyScheduleUseCases";
import type { MediaError } from "@application/media/errors";
import type { WeeklyScheduleError } from "@application/weekly_schedule/errors";
import type { RegisterRouteFn } from "../types";
import { sendMediaError, sendWeeklyScheduleError } from "../errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";

export interface WeeklyScheduleRoutesDependencies {
    userUseCases: IUserUseCases;
    weeklyScheduleUseCases: IWeeklyScheduleUseCases;
}

function sendUploadWeeklyScheduleError(
    reply: Parameters<typeof sendMediaError>[0],
    error: MediaError | WeeklyScheduleError,
) {
    if (error.startsWith("media_")) {
        return sendMediaError(reply, error as MediaError);
    }
    return sendWeeklyScheduleError(reply, error as WeeklyScheduleError);
}

const weeklyScheduleTagSchema = {
    type: "object",
    properties: {
        label: { type: "string" },
        bgColor: { type: "string" },
        txColor: { type: "string" },
    },
    required: ["label", "bgColor", "txColor"],
} as const;

const createWeeklyScheduleSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["week", "year", "fileId"],
        properties: {
            week: { type: "number" },
            year: { type: "number" },
            fileId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            tags: { type: "array", items: weeklyScheduleTagSchema },
        },
        additionalProperties: false,
    },
};

const updateWeeklyScheduleSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            fileId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            tags: { type: "array", items: weeklyScheduleTagSchema },
        },
        additionalProperties: false,
    },
};

export const registerWeeklyScheduleRoutes: RegisterRouteFn<WeeklyScheduleRoutesDependencies> = (
    app,
    prefixUrl,
    { userUseCases, weeklyScheduleUseCases },
) => {
    type CreateBody = {
        week: number;
        year: number;
        fileId: string;
        title?: string;
        description?: string;
        tags?: { label: string; bgColor: string; txColor: string }[];
    };
    type UpdateBody = {
        fileId?: string;
        title?: string;
        description?: string;
        tags?: { label: string; bgColor: string; txColor: string }[];
    };

    app.post(
        prefixUrl("/weekly-schedule"),
        { preHandler: authenticate(userUseCases), schema: createWeeklyScheduleSchema },
        async (request, reply) => {
            const body = request.body as CreateBody;
            const result = await weeklyScheduleUseCases.create.execute(request.user!.id, {
                week: body.week,
                year: body.year,
                fileId: body.fileId,
                title: body.title,
                description: body.description,
                tags: body.tags,
            });
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.status(201).send(result.data);
        },
    );

    app.patch<{ Params: { id: string }; Body: UpdateBody }>(
        prefixUrl("/weekly-schedule/:id"),
        { preHandler: authenticate(userUseCases), schema: updateWeeklyScheduleSchema },
        async (request, reply) => {
            const body = request.body ?? {};
            const result = await weeklyScheduleUseCases.update.execute(request.user!.id, {
                id: request.params.id,
                fileId: body.fileId,
                title: body.title,
                description: body.description,
                tags: body.tags,
            });
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.delete<{ Params: { id: string } }>(
        prefixUrl("/weekly-schedule/:id"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.delete.execute(request.user!.id, request.params.id);
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post<{ Params: { id: string } }>(
        prefixUrl("/weekly-schedule/:id/restore"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.restore.execute(request.user!.id, request.params.id);
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get(prefixUrl("/weekly-schedule/current"), async (_request, reply) => {
        const result = await weeklyScheduleUseCases.getCurrentWeek.execute(null);
        if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
        return reply.send(result.data);
    });

    app.get<{ Params: { week: string; year: string } }>(
        prefixUrl("/weekly-schedule/:week/:year"),
        async (request, reply) => {
            const week = parseInt(request.params.week, 10);
            const year = parseInt(request.params.year, 10);
            if (Number.isNaN(week) || Number.isNaN(year)) {
                return reply.status(400).send({ error: "weekly_schedule_invalid_week" });
            }
            const result = await weeklyScheduleUseCases.getByWeekAndYear.execute(null, week, year);
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get<{ Querystring: { year?: string; includeDeleted?: string } }>(
        prefixUrl("/weekly-schedule"),
        { preHandler: optionalAuthenticate(userUseCases) },
        async (request, reply) => {
            const year = request.query.year !== undefined ? parseInt(request.query.year, 10) : undefined;
            if (request.query.year !== undefined && Number.isNaN(year!)) {
                return reply.status(400).send({ error: "weekly_schedule_invalid_week" });
            }
            const includeDeleted = request.query.includeDeleted === "true";
            const requesterId = request.user?.id ?? null;
            const result = await weeklyScheduleUseCases.list.execute(
                requesterId,
                year !== undefined ? { year: year!, includeDeleted } : { includeDeleted },
            );
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get<{ Params: { id: string } }>(prefixUrl("/weekly-schedule/:id"), async (request, reply) => {
        const result = await weeklyScheduleUseCases.getById.execute(null, request.params.id);
        if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
        return reply.send(result.data);
    });

    app.get<{ Params: { id: string } }>(
        prefixUrl("/weekly-schedule/:id/history"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.getHistory.execute(request.user!.id, request.params.id);
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post(prefixUrl("/weekly-schedule/upload"), { preHandler: authenticate(userUseCases) }, async (request, reply) => {
        const file = await request.file();
        if (!file) {
            return sendMediaError(reply, "media_invalid_input");
        }

        const fields = file.fields as Record<string, any>;
        const weekRaw = fields["week"]?.value as string | undefined ?? fields["week"] as string | undefined;
        const yearRaw = fields["year"]?.value as string | undefined ?? fields["year"] as string | undefined;

        if (!weekRaw || !yearRaw) {
            return sendMediaError(reply, "media_invalid_input");
        }

        const week = parseInt(weekRaw, 10);
        const year = parseInt(yearRaw, 10);
        if (Number.isNaN(week) || Number.isNaN(year)) {
            return reply.status(400).send({ error: "weekly_schedule_invalid_week" });
        }

        const buffer = await file.toBuffer();
        const result = await weeklyScheduleUseCases.uploadAndCreate.execute(request.user!.id, {
            week,
            year,
            file: {
                name: file.filename,
                contentType: file.mimetype,
                size: buffer.length,
                body: buffer,
            },
        });
        if (result.isError()) return sendUploadWeeklyScheduleError(reply, result.error);
        return reply.status(201).send(result.data);
    });

    app.post<{ Params: { id: string } }>(
        prefixUrl("/weekly-schedule/:id/upload"),
        { preHandler: authenticate(userUseCases) },
        async (request, reply) => {
            const file = await request.file();
            if (!file) {
                return sendMediaError(reply, "media_invalid_input");
            }

            const buffer = await file.toBuffer();
            const result = await weeklyScheduleUseCases.uploadAndUpdate.execute(request.user!.id, {
                id: request.params.id,
                file: {
                    name: file.filename,
                    contentType: file.mimetype,
                    size: buffer.length,
                    body: buffer,
                },
            });
            if (result.isError()) return sendUploadWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );
};

import type { FastifyReply, FastifySchema } from "fastify";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IWeeklyScheduleUseCases } from "@application/weekly_schedule/IWeeklyScheduleUseCases";
import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import type { RegisterRouteFn } from "../types";
import type { WeeklyScheduleError } from "@application/weekly_schedule/errors";
import type { MediaError } from "@application/media/errors";
import { authenticate } from "../middlewares/auth";

export interface WeeklyScheduleRoutesDependencies {
    userUseCases: IUserUseCases;
    weeklyScheduleUseCases: IWeeklyScheduleUseCases;
    mediaUseCases: IMediaUseCases;
}

function mapWeeklyScheduleErrorToHttpCode(error: WeeklyScheduleError): number {
    switch (error) {
        case "weekly_schedule_not_found":
            return 404;
        case "weekly_schedule_not_authorized":
            return 401;
        case "weekly_schedule_invalid_week":
        case "weekly_schedule_duplicate_week_year":
        case "weekly_schedule_file_not_found":
        case "weekly_schedule_cannot_modify_past":
            return 400;
        case "weekly_schedule_save_failed":
            return 500;
        default:
            return 500;
    }
}

function sendWeeklyScheduleError(reply: FastifyReply, error: WeeklyScheduleError) {
    return reply.status(mapWeeklyScheduleErrorToHttpCode(error)).send({ error });
}

function mapMediaErrorToHttpCode(error: MediaError): number {
    switch (error) {
        case "media_invalid_input":
            return 400;
        case "media_upload_failed":
        case "media_delete_failed":
            return 500;
        default:
            return 500;
    }
}

function sendMediaError(reply: FastifyReply, error: MediaError) {
    return reply.status(mapMediaErrorToHttpCode(error)).send({ error });
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
    { userUseCases, weeklyScheduleUseCases, mediaUseCases },
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

    app.get(prefixUrl("/weekly-schedule/current"), async (request, reply) => {
        const result = await weeklyScheduleUseCases.getCurrentWeek.execute();
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
            const result = await weeklyScheduleUseCases.getByWeekAndYear.execute(week, year);
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get<{ Querystring: { year?: string; includeDeleted?: string } }>(prefixUrl("/weekly-schedule"), async (request, reply) => {
        const year = request.query.year !== undefined ? parseInt(request.query.year, 10) : undefined;
        if (request.query.year !== undefined && Number.isNaN(year!)) {
            return reply.status(400).send({ error: "weekly_schedule_invalid_week" });
        }
        const includeDeleted = request.query.includeDeleted === "true";
        const result = await weeklyScheduleUseCases.list.execute(
            year !== undefined ? { year: year!, includeDeleted } : { includeDeleted },
        );
        if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
        return reply.send(result.data);
    });

    app.get<{ Params: { id: string } }>(prefixUrl("/weekly-schedule/:id"), async (request, reply) => {
        const result = await weeklyScheduleUseCases.getById.execute(request.params.id);
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
        const uploadResult = await mediaUseCases.uploadFile.execute({
            name: file.filename,
            contentType: file.mimetype,
            size: buffer.length,
            body: buffer,
            isPrivate: false, 
        });

        if (uploadResult.isError()) {
            return sendMediaError(reply, uploadResult.error);
        }

        const fileId = uploadResult.data.id;

        const scheduleResult = await weeklyScheduleUseCases.create.execute(request.user!.id, {
            week,
            year,
            fileId,
        });

        if (scheduleResult.isError()) {
            // rollback best-effort: si falla, dejamos archivo huérfano
            try {
                await mediaUseCases.deleteFile.execute(fileId);
            } catch {
                // ignore rollback errors
            }
            return sendWeeklyScheduleError(reply, scheduleResult.error);
        }

        return reply.status(201).send(scheduleResult.data);
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
            const uploadResult = await mediaUseCases.uploadFile.execute({
                name: file.filename,
                contentType: file.mimetype,
                size: buffer.length,
                body: buffer,
                isPrivate: false,
            });

            if (uploadResult.isError()) {
                return sendMediaError(reply, uploadResult.error);
            }

            const fileId = uploadResult.data.id;

            const updateResult = await weeklyScheduleUseCases.update.execute(request.user!.id, {
                id: request.params.id,
                fileId,
            });

            if (updateResult.isError()) {
                // rollback best-effort: si falla, dejamos archivo huérfano
                try {
                    await mediaUseCases.deleteFile.execute(fileId);
                } catch {
                    // ignore rollback errors
                }
                return sendWeeklyScheduleError(reply, updateResult.error);
            }

            return reply.send(updateResult.data);
        },
    );
};

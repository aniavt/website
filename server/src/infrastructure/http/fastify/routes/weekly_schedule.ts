import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IWeeklyScheduleUseCases } from "@application/weekly_schedule/IWeeklyScheduleUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { MediaError } from "@application/media/errors";
import type { WeeklyScheduleError } from "@application/weekly_schedule/errors";
import {
    CreateWeeklyScheduleInputSchema,
    UpdateWeeklyScheduleInputSchema,
    UploadWeeklyScheduleFieldsSchema,
} from "@ania/api-contract/weekly-schedule";
import type { RegisterRouteFn } from "../types";
import { sendMediaError, sendWeeklyScheduleError } from "../errors";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import { parseMultipartFile } from "../multipart";
import { IdParamsSchema, WeekYearParamsSchema, WeeklyListQuerySchema } from "../route-schemas";

export interface WeeklyScheduleRoutesDependencies {
    userUseCases: IUserUseCases;
    userRepository: UserRepository;
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

export const registerWeeklyScheduleRoutes: RegisterRouteFn<WeeklyScheduleRoutesDependencies> = (
    app,
    prefixUrl,
    { userRepository, weeklyScheduleUseCases },
) => {
    app.post(
        prefixUrl("/weekly-schedule"),
        {
            preHandler: authenticate(userRepository),
            schema: { body: CreateWeeklyScheduleInputSchema },
        },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.create.execute(
                request.userEntity!,
                request.body,
            );
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.status(201).send(result.data);
        },
    );

    app.patch(
        prefixUrl("/weekly-schedule/:id"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: IdParamsSchema, body: UpdateWeeklyScheduleInputSchema },
        },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.update.execute(request.userEntity!, {
                id: request.params.id,
                ...request.body,
            });
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.delete(
        prefixUrl("/weekly-schedule/:id"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: IdParamsSchema },
        },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.delete.execute(
                request.userEntity!,
                request.params.id,
            );
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post(
        prefixUrl("/weekly-schedule/:id/restore"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: IdParamsSchema },
        },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.restore.execute(
                request.userEntity!,
                request.params.id,
            );
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get(prefixUrl("/weekly-schedule/current"), async (_request, reply) => {
        const result = await weeklyScheduleUseCases.getCurrentWeek.execute(null);
        if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
        return reply.send(result.data);
    });

    app.get(
        prefixUrl("/weekly-schedule/:week/:year"),
        { schema: { params: WeekYearParamsSchema } },
        async (request, reply) => {
            const week = parseInt(request.params.week, 10);
            const year = parseInt(request.params.year, 10);
            if (Number.isNaN(week) || Number.isNaN(year)) {
                return sendWeeklyScheduleError(reply, "weekly_schedule_invalid_week");
            }
            const result = await weeklyScheduleUseCases.getByWeekAndYear.execute(null, week, year);
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get(
        prefixUrl("/weekly-schedule"),
        {
            preHandler: optionalAuthenticate(userRepository),
            schema: { querystring: WeeklyListQuerySchema },
        },
        async (request, reply) => {
            const year =
                request.query.year !== undefined ? parseInt(request.query.year, 10) : undefined;
            if (request.query.year !== undefined && Number.isNaN(year!)) {
                return sendWeeklyScheduleError(reply, "weekly_schedule_invalid_week");
            }
            const includeDeleted = request.query.includeDeleted === "true";
            const requester = request.userEntity ?? null;
            const result = await weeklyScheduleUseCases.list.execute(
                requester,
                year !== undefined ? { year: year!, includeDeleted } : { includeDeleted },
            );
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get(
        prefixUrl("/weekly-schedule/:id"),
        { schema: { params: IdParamsSchema } },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.getById.execute(null, request.params.id);
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.get(
        prefixUrl("/weekly-schedule/:id/history"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: IdParamsSchema },
        },
        async (request, reply) => {
            const result = await weeklyScheduleUseCases.getHistory.execute(
                request.userEntity!,
                request.params.id,
            );
            if (result.isError()) return sendWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );

    app.post(
        prefixUrl("/weekly-schedule/upload"),
        { preHandler: authenticate(userRepository) },
        async (request, reply) => {
            const parsed = await parseMultipartFile(request, {
                fieldsSchema: UploadWeeklyScheduleFieldsSchema,
            });
            if (!parsed.ok) {
                if (parsed.error === "weekly_schedule_invalid_week") {
                    return sendWeeklyScheduleError(reply, "weekly_schedule_invalid_week");
                }
                return sendMediaError(reply, parsed.error);
            }

            const result = await weeklyScheduleUseCases.uploadAndCreate.execute(request.userEntity!, {
                week: parsed.fields.week,
                year: parsed.fields.year,
                file: parsed.file,
            });
            if (result.isError()) return sendUploadWeeklyScheduleError(reply, result.error);
            return reply.status(201).send(result.data);
        },
    );

    app.post(
        prefixUrl("/weekly-schedule/:id/upload"),
        {
            preHandler: authenticate(userRepository),
            schema: { params: IdParamsSchema },
        },
        async (request, reply) => {
            const parsed = await parseMultipartFile(request);
            if (!parsed.ok) {
                return sendMediaError(reply, "media_invalid_input");
            }

            const result = await weeklyScheduleUseCases.uploadAndUpdate.execute(request.userEntity!, {
                id: request.params.id,
                file: parsed.file,
            });
            if (result.isError()) return sendUploadWeeklyScheduleError(reply, result.error);
            return reply.send(result.data);
        },
    );
};

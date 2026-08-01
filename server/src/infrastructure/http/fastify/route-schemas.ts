import { z } from "zod";

export const IdParamsSchema = z.object({ id: z.string().min(1) });

export const UserIdParamsSchema = z.object({ userId: z.string().min(1) });

export const AnimeIdParamsSchema = z.object({ animeId: z.string().min(1) });

export const WeekYearParamsSchema = z.object({
    week: z.string().min(1),
    year: z.string().min(1),
});

export const ActiveOnlyQuerySchema = z.object({
    activeOnly: z.string().optional(),
});

export const LogoutQuerySchema = z.object({
    all: z.string().optional(),
});

export const WeeklyListQuerySchema = z.object({
    year: z.string().optional(),
    includeDeleted: z.string().optional(),
});

export const PermissionCheckQuerySchema = z.object({
    namespace: z.string().min(1),
    permission: z.string().min(1),
});

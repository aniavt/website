import type { FastifyReply } from "fastify";
import type { AnimeError } from "@application/anime/errors";
import type { ChapterError } from "@application/chapter/errors";
import type { FaqError } from "@application/faq/errors";
import type { MediaError } from "@application/media/errors";
import type { NavItemsError } from "@application/navItems/errors";
import type { WeeklyScheduleError } from "@application/weekly_schedule/errors";
import type { PermissionError, UserError } from "@application/users/errors";

export function mapErrorToHttpCode<E extends string>(
    error: E,
    statusByError: Partial<Record<E, number>>,
    fallback = 500,
): number {
    return statusByError[error] ?? fallback;
}

export function sendDomainError<E extends string>(
    reply: FastifyReply,
    error: E,
    statusByError: Partial<Record<E, number>>,
    fallback = 500,
) {
    return reply
        .status(mapErrorToHttpCode(error, statusByError, fallback))
        .send({ error });
}

const MEDIA_ERROR_STATUS: Partial<Record<MediaError, number>> = {
    media_not_found: 404,
    media_invalid_input: 400,
    media_upload_failed: 500,
    media_delete_failed: 500,
};

export function sendMediaError(reply: FastifyReply, error: MediaError) {
    return sendDomainError(reply, error, MEDIA_ERROR_STATUS);
}

const ANIME_ERROR_STATUS: Partial<Record<AnimeError, number>> = {
    anime_not_found: 404,
    anime_not_authorized: 403,
    anime_invalid_transition: 400,
    anime_save_failed: 500,
};

export function sendAnimeError(reply: FastifyReply, error: AnimeError) {
    return sendDomainError(reply, error, ANIME_ERROR_STATUS);
}

const FAQ_ERROR_STATUS: Partial<Record<FaqError, number>> = {
    faq_item_not_found: 404,
    faq_text_not_found: 404,
    faq_not_authorized: 403,
    faq_invalid_transition: 400,
    faq_save_failed: 500,
};

export function sendFaqError(reply: FastifyReply, error: FaqError) {
    return sendDomainError(reply, error, FAQ_ERROR_STATUS);
}

const CHAPTER_ERROR_STATUS: Partial<Record<ChapterError, number>> = {
    chapter_not_found: 404,
    anime_not_found: 404,
    chapter_not_authorized: 403,
    chapter_save_failed: 500,
    chapter_delete_failed: 500,
};

export function sendChapterError(reply: FastifyReply, error: ChapterError) {
    return sendDomainError(reply, error, CHAPTER_ERROR_STATUS);
}

const NAV_ITEMS_ERROR_STATUS: Partial<Record<NavItemsError, number>> = {
    navItems_not_found: 404,
    navItems_not_authorized: 403,
    navItems_invalid_transition: 400,
    navItems_save_failed: 500,
};

export function sendNavItemsError(reply: FastifyReply, error: NavItemsError) {
    return sendDomainError(reply, error, NAV_ITEMS_ERROR_STATUS);
}

const WEEKLY_SCHEDULE_ERROR_STATUS: Partial<Record<WeeklyScheduleError, number>> = {
    weekly_schedule_not_found: 404,
    weekly_schedule_not_authorized: 403,
    weekly_schedule_invalid_week: 400,
    weekly_schedule_duplicate_week_year: 400,
    weekly_schedule_file_not_found: 400,
    weekly_schedule_cannot_modify_past: 400,
    weekly_schedule_save_failed: 500,
};

export function sendWeeklyScheduleError(reply: FastifyReply, error: WeeklyScheduleError) {
    return sendDomainError(reply, error, WEEKLY_SCHEDULE_ERROR_STATUS);
}

type UserOrPermissionError = UserError | PermissionError;

const USER_ERROR_STATUS: Partial<Record<UserOrPermissionError, number>> = {
    user_not_found: 404,
    user_not_authorized: 403,
    password_verify_failed: 401,
    permission_not_authorized: 403,
    username_already_exists: 400,
    username_too_long: 400,
    password_too_short: 400,
    password_too_long: 400,
    password_weak_upper_case_letter: 400,
    password_weak_lower_case_letter: 400,
    password_weak_number: 400,
    password_weak_symbol: 400,
    username_too_short: 400,
    user_cannot_deactivate_root: 400,
    user_cannot_revoke_self_meta_manage_permissions: 400,
    permission_invalid_action: 400,
    permission_invalid_namespace: 400,
    permission_invalid_slug: 400,
    user_repo_error: 500,
    user_save_failed: 500,
};

export function sendUserError(reply: FastifyReply, error: UserOrPermissionError) {
    return sendDomainError(reply, error, USER_ERROR_STATUS);
}

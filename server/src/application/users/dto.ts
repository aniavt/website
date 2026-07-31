import type { UserEntity } from "@domain/entities/User";
import type { UserDto } from "@ania/api-contract/user";

export type { UserDto, LoginRequest, CreateUserInput } from "@ania/api-contract/user";

export function toUserDto(user: UserEntity): UserDto {
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        isActive: user.isActive,
        sessionVersion: user.sessionVersion,
        permissions: {
            meta: user.permissions.meta.getSlugs("meta"),
            user: user.permissions.user.getSlugs("user"),
            faq: user.permissions.faq.getSlugs("faq"),
            weekly_schedule: user.permissions.weekly_schedule.getSlugs("weekly_schedule"),
            anime: user.permissions.anime.getSlugs("anime"),
            nav_items: user.permissions.nav_items.getSlugs("nav_items"),
        },
    };
}

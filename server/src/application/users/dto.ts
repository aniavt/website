import type { UserEntity } from "@domain/entities/User";

export interface UserDto {
    readonly id: string;
    readonly username: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly isActive: boolean;
    readonly sessionVersion: number;
    readonly permissions: {
        readonly meta: string[];
        readonly user: string[];
        readonly faq: string[];
    };
}

export function toUserDto(user: UserEntity): UserDto {
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        sessionVersion: user.sessionVersion,
        permissions: {
            meta: user.permissions.meta.getSlugs("meta"),
            user: user.permissions.user.getSlugs("user"),
            faq: user.permissions.faq.getSlugs("faq"),
        },
    };
}
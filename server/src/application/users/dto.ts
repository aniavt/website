import type { UserEntity } from "@domain/entities/User";

export interface UserDto {
    readonly id: string;
    readonly username: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly isActive: boolean;
    readonly isAdmin: boolean;
    readonly isRoot: boolean;
    readonly sessionVersion: number;
}

export function toUserDto(user: UserEntity): UserDto {
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        isRoot: user.isRoot,
        sessionVersion: user.sessionVersion,
    };
}
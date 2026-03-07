import { DomainEvent } from "@domain/entities/Event";
import type { UserEntity } from "@domain/entities/User";

export type UserEventId = 
    | "user.created"
    | "user.update_password"
    | "user.activated"
    | "user.deactivated"
    | "user.session_version_incremented"
    | "user.grant_admin_privileges"
    | "user.revoke_admin_privileges"
    | "user.grant_root_privileges"
    | "user.revoke_root_privileges";


export class UserCreatedEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity) {
        super("user.created");
    }
}

export class UserUpdatedPasswordEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity, public readonly oldPasswordHash: string) {
        super("user.update_password");
    }
}

export class UserActivatedEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity) {
        super("user.activated");
    }
}

export class UserDeactivatedEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity) {
        super("user.deactivated");
    }
}

export class UserSessionVersionIncrementedEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity, public readonly oldVersion: number) {
        super("user.session_version_incremented");
    }
}

export class UserGrantAdminPrivilegesEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity) {
        super("user.grant_admin_privileges");
    }
}

export class UserRevokeAdminPrivilegesEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity) {
        super("user.revoke_admin_privileges");
    }
}

export class UserGrantRootPrivilegesEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity) {
        super("user.grant_root_privileges");
    }
}

export class UserRevokeRootPrivilegesEvent extends DomainEvent<UserEventId> {
    constructor(public readonly user: UserEntity) {
        super("user.revoke_root_privileges");
    }
}
import type { UserEventId } from "@domain/events/UserEvents";

import { AggregateRoot } from "@domain/shared/AggregateRoot";
import {
    UserCreatedEvent,
    UserUpdatedPasswordEvent,
    UserActivatedEvent,
    UserDeactivatedEvent,
    UserSessionVersionIncrementedEvent,
    UserGrantAdminPrivilegesEvent,
    UserRevokeAdminPrivilegesEvent,
    UserGrantRootPrivilegesEvent,
    UserRevokeRootPrivilegesEvent,
} from "@domain/events/UserEvents";


export interface UserProps {
    readonly id: string;
    username: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    sessionVersion: number;
    isActive: boolean;
    isRoot: boolean;
    isAdmin: boolean; 
}

export class UserEntity extends AggregateRoot<UserEventId> {
    readonly id: string;
    username: string;
    passwordHash: string;
    sessionVersion: number;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    isAdmin: boolean;
    isRoot: boolean;

    constructor(props: UserProps) {
        super();
        this.id = props.id;
        this.username = props.username;
        this.passwordHash = props.passwordHash;
        this.sessionVersion = props.sessionVersion;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.isActive = props.isActive;
        this.isAdmin = props.isAdmin;
        this.isRoot = props.isRoot;
    }


    static create(id: string, username: string, passwordHash: string) {
        const now = new Date();
        const user = new UserEntity({
            id,
            username,
            passwordHash,
            sessionVersion: 0,
            createdAt: now,
            updatedAt: now,
            isActive: true,
            isRoot: false,
            isAdmin: false,
        });
        user.addEvent(new UserCreatedEvent(user));
        return user;
    }

    static fromPersistence(props: UserProps) {
        return new UserEntity(props);
    }

    updatePassword(passwordHash: string) {
        const oldPasswordHash = this.passwordHash;
        this.passwordHash = passwordHash;
        this.sessionVersion++;
        this.updatedAt = new Date();
        this.addEvent(new UserUpdatedPasswordEvent(this, oldPasswordHash));
        return this;
    }

    activate() {
        if (this.isActive) return this;
        this.isActive = true;
        this.updatedAt = new Date();
        this.addEvent(new UserActivatedEvent(this));
        return this;
    }

    deactivate() {
        if (!this.isActive) return this;
        this.isActive = false;
        this.updatedAt = new Date();
        this.addEvent(new UserDeactivatedEvent(this));
        return this;
    }

    incrementSessionVersion() {
        const oldVersion = this.sessionVersion;
        this.sessionVersion++;
        this.updatedAt = new Date();
        this.addEvent(new UserSessionVersionIncrementedEvent(this, oldVersion));
        return this;
    }

    grantAdmin() {
        if (this.isAdmin) return this;
        this.isAdmin = true;
        this.updatedAt = new Date();
        this.addEvent(new UserGrantAdminPrivilegesEvent(this));
        return this;
    }

    revokeAdmin() {
        if (!this.isAdmin) return this;
        this.isAdmin = false;
        this.updatedAt = new Date();
        this.addEvent(new UserRevokeAdminPrivilegesEvent(this));
        return this;
    }

    grantRoot() {
        if (this.isRoot) return this;
        this.isRoot = true;
        this.updatedAt = new Date();
        this.addEvent(new UserGrantRootPrivilegesEvent(this));
        return this;
    }

    revokeRoot() {
        if (!this.isRoot) return this;
        this.isRoot = false;
        this.updatedAt = new Date();
        this.addEvent(new UserRevokeRootPrivilegesEvent(this));
        return this;
    }
}

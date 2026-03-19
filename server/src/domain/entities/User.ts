import {
    Permission,
    type PermissionNamespace,
    ManagePermission,
    UserPermission,
    FAQPermission,
    WeeklySchedulePermission,
    VaultPermission,
} from "@domain/value-object/Permissions";


export type UserPermissionPersistence = Record<PermissionNamespace, number>;
export type UserPersistenceProps = Omit<UserProps, "permissions"> & { permissions: UserPermissionPersistence };
export interface UserProps {
    readonly id: string;
    username: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    sessionVersion: number;
    isActive: boolean;
    permissions: Record<PermissionNamespace, Permission>;
}

type PermissionType = 
    | { type: "meta", permission: ManagePermission }
    | { type: "user", permission: UserPermission }
    | { type: "faq", permission: FAQPermission }
    | { type: "weekly_schedule", permission: WeeklySchedulePermission }
    | { type: "vault", permission: VaultPermission }

export class UserEntity {
    readonly id: string;
    username: string;
    passwordHash: string;
    sessionVersion: number;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    permissions: Record<PermissionNamespace, Permission>;

    constructor(props: UserProps) {
        this.id = props.id;
        this.username = props.username;
        this.passwordHash = props.passwordHash;
        this.sessionVersion = props.sessionVersion;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.isActive = props.isActive;
        this.permissions = props.permissions;
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
            permissions: {
                meta: ManagePermission.fromValue(Permission.NONE.valueOf()),
                user: UserPermission.fromValue(Permission.NONE.valueOf()),
                faq: FAQPermission.fromValue(Permission.NONE.valueOf()),
                weekly_schedule: WeeklySchedulePermission.fromValue(Permission.NONE.valueOf()),
                vault: VaultPermission.fromValue(Permission.NONE.valueOf()),
            }
        });

        return user;
    }

    static fromPersistence(props: UserPersistenceProps) {
        return new UserEntity({
            id: props.id,
            username: props.username,
            passwordHash: props.passwordHash,
            sessionVersion: props.sessionVersion,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            isActive: props.isActive,
            permissions: {
                meta: ManagePermission.fromValue(props.permissions.meta),
                user: UserPermission.fromValue(props.permissions.user),
                faq: FAQPermission.fromValue(props.permissions.faq),
                weekly_schedule: WeeklySchedulePermission.fromValue(props.permissions.weekly_schedule ?? Permission.NONE.valueOf()),
                vault: VaultPermission.fromValue(props.permissions.vault ?? Permission.NONE.valueOf()),
            }
        });
    }

    updatePassword(passwordHash: string) {
        this.passwordHash = passwordHash;
        this.sessionVersion++;
        this.updatedAt = new Date();
        return this;
    }

    activate() {
        if (this.isActive) return this;
        this.isActive = true;
        this.updatedAt = new Date();
        return this;
    }

    deactivate() {
        if (!this.isActive) return this;
        this.isActive = false;
        this.updatedAt = new Date();
        return this;
    }

    incrementSessionVersion() {
        this.sessionVersion++;
        this.updatedAt = new Date();
        return this;
    }

    hasPermission({ type, permission }: PermissionType): boolean {
        if (!this.isActive) return false;
        if (this.permissions[type].has(permission)) return true;
        if (this.permissions.meta.has(ManagePermission.META_MANAGE_PERMISSIONS)) return true;
        switch (type) {
            case "user": return this.permissions.meta.has(ManagePermission.MANAGE_USER);
            case "faq": return this.permissions.meta.has(ManagePermission.MANAGE_FAQ);
            case "weekly_schedule": return this.permissions.meta.has(ManagePermission.MANAGE_WEEKLY_SCHEDULE);
            case "vault": return this.permissions.meta.has(ManagePermission.MANAGE_VAULT);
        }
        return false;
    }

    grantPermission({ type, permission }: PermissionType): this {
        this.permissions[type] = this.permissions[type].add(permission);
        this.updatedAt = new Date();
        return this;
    }

    revokePermission({ type, permission }: PermissionType): this {
        this.permissions[type] = this.permissions[type].remove(permission);
        this.updatedAt = new Date();
        return this;
    }
}

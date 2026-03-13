const mask = (bit: number) => 1 << bit;
export const namespaces = ["meta", "user", "faq", "weekly_schedule"] as const;

export type PermissionNamespace = typeof namespaces[number];

export function isPermissionNamespace(namespace: any): namespace is PermissionNamespace {
    return namespaces.includes(namespace);
}

export interface RequiredAssignmentPermission {
    assign: Permission;
    revoke: Permission;
}

export class Permission {
    constructor(protected readonly mask: number = 0) {}
    protected _isAssignmentPermission: boolean = false;
    protected _requiredAssignmentPermission: RequiredAssignmentPermission | null = null;
    
    // map of bit positions to slugs
    protected static readonly slugMap: string[] = [""]; // bit 0, none
    public static readonly NONE = new Permission(mask(0));

    has(permission: Permission): boolean {
        return (this.mask & permission.mask) === permission.mask;
    }

    add(...permissions: Permission[]): Permission {
        const Ctor = this.constructor as typeof Permission;
        let newMask = this.mask;
        for (const p of permissions) {
            newMask |= p.mask;
        }
        return new Ctor(newMask);
    }
    
    remove(...permissions: Permission[]): Permission {
        const Ctor = this.constructor as typeof Permission;
        let newMask = this.mask;
        for (const p of permissions) {
            newMask &= ~p.mask;
        }
        return new Ctor(newMask);
    }

    valueOf(): number {
        return this.mask;
    }

    getSlugs(namespace: PermissionNamespace): string[] {
        const slugs: string[] = [];
        let m = this.mask;
        let bit = 0;
        while (m > 0) {
            const slug = (this.constructor as typeof Permission).slugMap[bit];
            if ((m & 1) === 1 && slug) {
                slugs.push(`${namespace}.${slug}`);
            }
            m >>= 1;
            bit++;
        }
        return slugs;
    }

    protected setAssignmentPermission(): this {
        if (this._requiredAssignmentPermission) throw new Error("Permission cannot be both an assignment permission and a required assignment permission");
        this._isAssignmentPermission = true;
        return this;
    }

    protected setRequiredAssignmentPermission(assign: Permission, revoke: Permission): this {

        if (this._isAssignmentPermission) throw new Error("Permission cannot be both an assignment permission and a required assignment permission");
        this._requiredAssignmentPermission = { assign, revoke };
        return this;
    }

    static fromValue(value: number): Permission {
        return new this(value);
    }

    static fromSlug(slug: string): Permission | null {
        if (!slug) return null;
        const bit = this.slugMap.indexOf(slug);
        if (bit <= 0) return null;
        return new this(mask(bit));
    }

    getRequiredAssignmentPermission(): RequiredAssignmentPermission | null {
        return this._requiredAssignmentPermission;
    }

    isAssignmentPermission(): boolean {
        return this._isAssignmentPermission;
    }

    isPrimitivePermission(): boolean {
        return (this.mask & (this.mask -1)) === 0;
    }
}

export class ManagePermission extends Permission {
    // grant and revoke manage permissions
    static readonly META_MANAGE_PERMISSIONS = new this(mask(1)).setAssignmentPermission();
    static readonly MANAGE_USER = new this(mask(2)).setAssignmentPermission();
    static readonly MANAGE_FAQ  = new this(mask(3)).setAssignmentPermission();
    static readonly MANAGE_WEEKLY_SCHEDULE = new this(mask(4)).setAssignmentPermission();

    protected static override readonly slugMap: string[] = [
        "", // bit 0, none
        "meta_manage_permissions",
        "manage_user",
        "manage_faq",
        "manage_weekly_schedule",
    ];
}

export class UserPermission extends Permission {
    static readonly ASSIGN_READ_USER = new this(mask(1)).setAssignmentPermission();
    static readonly REVOKE_READ_USER = new this(mask(2)).setAssignmentPermission();
    static readonly READ_USER        = new this(mask(3)).setRequiredAssignmentPermission(this.ASSIGN_READ_USER, this.REVOKE_READ_USER);
    static readonly ASSIGN_ACTIVATE_USER = new this(mask(4)).setAssignmentPermission();
    static readonly REVOKE_ACTIVATE_USER = new this(mask(5)).setAssignmentPermission();
    static readonly ACTIVATE_USER        = new this(mask(6)).setRequiredAssignmentPermission(this.ASSIGN_ACTIVATE_USER, this.REVOKE_ACTIVATE_USER);
    static readonly ASSIGN_DEACTIVATE_USER = new this(mask(7)).setAssignmentPermission();
    static readonly REVOKE_DEACTIVATE_USER = new this(mask(8)).setAssignmentPermission();
    static readonly DEACTIVATE_USER        = new this(mask(9)).setRequiredAssignmentPermission(this.ASSIGN_DEACTIVATE_USER, this.REVOKE_DEACTIVATE_USER);

    static readonly MANAGE_USER = new this().add(
        this.READ_USER,
        this.ACTIVATE_USER,
        this.DEACTIVATE_USER,
    );

    protected static override readonly slugMap: string[] = [
        "", // bit 0, none
        "assign_read_user",
        "revoke_read_user",
        "read_user",
        "assign_activate_user",
        "revoke_activate_user",
        "activate_user",
        "assign_deactivate_user",
        "revoke_deactivate_user",
        "deactivate_user",
    ];
}

export class FAQPermission extends Permission {
    static readonly ASSIGN_READ_FAQ = new this(mask(1)).setAssignmentPermission();
    static readonly REVOKE_READ_FAQ = new this(mask(2)).setAssignmentPermission();
    static readonly READ_FAQ        = new this(mask(3)).setRequiredAssignmentPermission(this.ASSIGN_READ_FAQ, this.REVOKE_READ_FAQ);
    static readonly ASSIGN_CREATE_FAQ = new this(mask(4)).setAssignmentPermission();
    static readonly REVOKE_CREATE_FAQ = new this(mask(5)).setAssignmentPermission();
    static readonly CREATE_FAQ        = new this(mask(6)).setRequiredAssignmentPermission(this.ASSIGN_CREATE_FAQ, this.REVOKE_CREATE_FAQ);
    static readonly ASSIGN_DELETE_FAQ = new this(mask(7)).setAssignmentPermission();
    static readonly REVOKE_DELETE_FAQ = new this(mask(8)).setAssignmentPermission();
    static readonly DELETE_FAQ        = new this(mask(9)).setRequiredAssignmentPermission(this.ASSIGN_DELETE_FAQ, this.REVOKE_DELETE_FAQ);
    static readonly ASSIGN_RESTORE_FAQ = new this(mask(10)).setAssignmentPermission();
    static readonly REVOKE_RESTORE_FAQ = new this(mask(11)).setAssignmentPermission();
    static readonly RESTORE_FAQ        = new this(mask(12)).setRequiredAssignmentPermission(this.ASSIGN_RESTORE_FAQ, this.REVOKE_RESTORE_FAQ);
    static readonly ASSIGN_UPDATE_FAQ = new this(mask(13)).setAssignmentPermission();
    static readonly REVOKE_UPDATE_FAQ = new this(mask(14)).setAssignmentPermission();
    static readonly UPDATE_FAQ        = new this(mask(15)).setRequiredAssignmentPermission(this.ASSIGN_UPDATE_FAQ, this.REVOKE_UPDATE_FAQ);

    static readonly MANAGE_FAQ = new this().add(
        this.READ_FAQ,
        this.CREATE_FAQ,
        this.DELETE_FAQ,
        this.RESTORE_FAQ,
        this.UPDATE_FAQ,
    );

    protected static override readonly slugMap: string[] = [
        "", // bit 0, none
        "assign_read_faq",
        "revoke_read_faq",
        "read_faq",
        "assign_create_faq",
        "revoke_create_faq",
        "create_faq",
        "assign_delete_faq",
        "revoke_delete_faq",
        "delete_faq",
        "assign_restore_faq",
        "revoke_restore_faq",
        "restore_faq",
        "assign_update_faq",
        "revoke_update_faq",
        "update_faq",
    ];
}

export class WeeklySchedulePermission extends Permission {
    static readonly ASSIGN_CREATE_WEEKLY_SCHEDULE = new this(mask(1)).setAssignmentPermission();
    static readonly REVOKE_CREATE_WEEKLY_SCHEDULE = new this(mask(2)).setAssignmentPermission();
    static readonly CREATE_WEEKLY_SCHEDULE = new this(mask(3)).setRequiredAssignmentPermission(this.ASSIGN_CREATE_WEEKLY_SCHEDULE, this.REVOKE_CREATE_WEEKLY_SCHEDULE);
    static readonly ASSIGN_DELETE_WEEKLY_SCHEDULE = new this(mask(4)).setAssignmentPermission();
    static readonly REVOKE_DELETE_WEEKLY_SCHEDULE = new this(mask(5)).setAssignmentPermission();
    static readonly DELETE_WEEKLY_SCHEDULE = new this(mask(6)).setRequiredAssignmentPermission(this.ASSIGN_DELETE_WEEKLY_SCHEDULE, this.REVOKE_DELETE_WEEKLY_SCHEDULE);
    static readonly ASSIGN_UPDATE_WEEKLY_SCHEDULE = new this(mask(7)).setAssignmentPermission();
    static readonly REVOKE_UPDATE_WEEKLY_SCHEDULE = new this(mask(8)).setAssignmentPermission();
    static readonly UPDATE_WEEKLY_SCHEDULE = new this(mask(9)).setRequiredAssignmentPermission(this.ASSIGN_UPDATE_WEEKLY_SCHEDULE, this.REVOKE_UPDATE_WEEKLY_SCHEDULE);
    static readonly ASSIGN_READ_WEEKLY_SCHEDULE_HISTORY = new this(mask(10)).setAssignmentPermission();
    static readonly REVOKE_READ_WEEKLY_SCHEDULE_HISTORY = new this(mask(11)).setAssignmentPermission();
    static readonly READ_WEEKLY_SCHEDULE_HISTORY = new this(mask(12)).setRequiredAssignmentPermission(this.ASSIGN_READ_WEEKLY_SCHEDULE_HISTORY, this.REVOKE_READ_WEEKLY_SCHEDULE_HISTORY);


    static readonly MANAGE_WEEKLY_SCHEDULE = new this().add(
        this.CREATE_WEEKLY_SCHEDULE,
        this.DELETE_WEEKLY_SCHEDULE,
        this.UPDATE_WEEKLY_SCHEDULE,
        this.READ_WEEKLY_SCHEDULE_HISTORY,
    );

    protected static override readonly slugMap: string[] = [
        "", // bit 0, none
        "assign_create_weekly_schedule",
        "revoke_create_weekly_schedule",
        "create_weekly_schedule",
        "assign_delete_weekly_schedule",
        "revoke_delete_weekly_schedule",
        "delete_weekly_schedule",
        "assign_update_weekly_schedule",
        "revoke_update_weekly_schedule",
        "update_weekly_schedule",
        "assign_read_weekly_schedule_history",
        "revoke_read_weekly_schedule_history",
        "read_weekly_schedule_history",
    ];
}

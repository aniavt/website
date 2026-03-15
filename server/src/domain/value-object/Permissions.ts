import { BiMap } from "@lib/bi-map";


const mask = (bit: number) => 1 << bit;
export const namespaces = ["meta", "user", "faq", "weekly_schedule"] as const;

export type PermissionNamespace = typeof namespaces[number];

export function isPermissionNamespace(namespace: any): namespace is PermissionNamespace {
    return namespaces.includes(namespace);
}

export class Permission {
    constructor(protected readonly mask: number = 0) {}
    
    public static readonly NONE = new Permission(mask(0));
    // map of bit positions to slugs
    protected static readonly slugMap: BiMap<number, string> = new BiMap([
        [0, ""],
    ]);

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
            const slug = (this.constructor as typeof Permission).slugMap.get(bit);
            if ((m & 1) === 1 && slug) {
                slugs.push(`${namespace}.${slug}`);
            }
            m >>= 1;
            bit++;
        }
        return slugs;
    }

    static fromValue(value: number): Permission {
        return new this(value);
    }

    static fromSlug(slug: string): Permission | null {
        if (!slug) return null;
        const bit = this.slugMap.getKey(slug);
        if (!bit || bit <= 0) return null;
        return new this(mask(bit));
    }

    isPrimitivePermission(): boolean {
        return (this.mask & (this.mask -1)) === 0;
    }

    protected static extendSlugMap(entries: [number, string][]) {
        return new BiMap([...this.slugMap.entries(), ...entries]);
    }

    protected static getLastBitSlugMap(): number {
        return Math.max(...Array.from(this.slugMap.entries()).map(([key]) => key));
    }
}

export class ManagePermission extends Permission {
    static readonly META_MANAGE_PERMISSIONS = new this(mask(1));
    static readonly MANAGE_USER = new this(mask(2));
    static readonly MANAGE_FAQ  = new this(mask(3));
    static readonly MANAGE_WEEKLY_SCHEDULE = new this(mask(4));

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, "meta_manage_permissions"],
        [this.getLastBitSlugMap() + 2, "manage_user"],
        [this.getLastBitSlugMap() + 3, "manage_faq"],
        [this.getLastBitSlugMap() + 4, "manage_weekly_schedule"],
    ]);
}

export class UserPermission extends Permission {
    static readonly READ_USER = new this(mask(1));
    static readonly ACTIVATE_USER = new this(mask(2));
    static readonly DEACTIVATE_USER = new this(mask(3));

    static readonly MANAGE_USER = new this().add(
        this.READ_USER,
        this.ACTIVATE_USER,
        this.DEACTIVATE_USER,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, "read_user"],
        [this.getLastBitSlugMap() + 2, "activate_user"],
        [this.getLastBitSlugMap() + 3, "deactivate_user"],
    ]);
}

export class FAQPermission extends Permission {
    static readonly READ_FAQ = new this(mask(1));
    static readonly CREATE_FAQ = new this(mask(2));
    static readonly DELETE_FAQ = new this(mask(3));
    static readonly UPDATE_FAQ = new this(mask(4));
    static readonly RESTORE_FAQ = new this(mask(5));

    static readonly MANAGE_FAQ = new this().add(
        this.READ_FAQ,
        this.CREATE_FAQ,
        this.DELETE_FAQ,
        this.RESTORE_FAQ,
        this.UPDATE_FAQ,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, "read_faq"],
        [this.getLastBitSlugMap() + 2, "create_faq"],
        [this.getLastBitSlugMap() + 3, "delete_faq"],
        [this.getLastBitSlugMap() + 4, "update_faq"],
        [this.getLastBitSlugMap() + 5, "restore_faq"],
    ]);
}

export class WeeklySchedulePermission extends Permission {
    static readonly CREATE_WEEKLY_SCHEDULE = new this(mask(1));
    static readonly DELETE_WEEKLY_SCHEDULE = new this(mask(2));
    static readonly UPDATE_WEEKLY_SCHEDULE = new this(mask(3));
    static readonly READ_WEEKLY_SCHEDULE_HISTORY = new this(mask(4));

    static readonly MANAGE_WEEKLY_SCHEDULE = new this().add(
        this.CREATE_WEEKLY_SCHEDULE,
        this.DELETE_WEEKLY_SCHEDULE,
        this.UPDATE_WEEKLY_SCHEDULE,
        this.READ_WEEKLY_SCHEDULE_HISTORY,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, "create_weekly_schedule"],
        [this.getLastBitSlugMap() + 2, "delete_weekly_schedule"],
        [this.getLastBitSlugMap() + 3, "update_weekly_schedule"],
        [this.getLastBitSlugMap() + 4, "read_weekly_schedule_history"],
    ]);
}

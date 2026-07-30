import { BiMap } from "@lib/bi-map";
import {
    PERMISSION_NAMESPACES,
    PERMISSION_SLUGS,
    type NamespacedPermissionSlug,
    type PermissionNamespace,
} from "@ania/domain-shared/permissions";

export { PERMISSION_NAMESPACES as namespaces, type PermissionNamespace };

export function isPermissionNamespace(namespace: any): namespace is PermissionNamespace {
    return (PERMISSION_NAMESPACES as readonly string[]).includes(namespace);
}

const mask = (bit: number) => 1 << bit;

export class Permission {
    constructor(protected readonly mask: number = 0) { }

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

    getSlugs<N extends PermissionNamespace>(namespace: N): NamespacedPermissionSlug<N>[] {
        const slugs: NamespacedPermissionSlug<N>[] = [];
        let m = this.mask;
        let bit = 0;
        while (m > 0) {
            const slug = (this.constructor as typeof Permission).slugMap.get(bit);
            if ((m & 1) === 1 && slug) {
                slugs.push(`${namespace}.${slug}` as NamespacedPermissionSlug<N>);
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
        return (this.mask & (this.mask - 1)) === 0;
    }

    protected static extendSlugMap(entries: [number, string][]) {
        return new BiMap([...this.slugMap.entries(), ...entries]);
    }

    protected static getLastBitSlugMap(): number {
        return Math.max(...Array.from(this.slugMap.entries()).map(([key]) => key));
    }
}

export class ManagePermission extends Permission {
    static readonly META_MANAGE_PERMISSIONS = new this(mask(this.getLastBitSlugMap() + 1));
    static readonly MANAGE_USER = new this(mask(this.getLastBitSlugMap() + 2));
    static readonly MANAGE_FAQ = new this(mask(this.getLastBitSlugMap() + 3));
    static readonly MANAGE_WEEKLY_SCHEDULE = new this(mask(this.getLastBitSlugMap() + 4));
    static readonly MANAGE_VAULT = new this(mask(this.getLastBitSlugMap() + 5));
    static readonly MANAGE_ANIME = new this(mask(this.getLastBitSlugMap() + 6));
    static readonly MANAGE_NAVITEMS = new this(mask(this.getLastBitSlugMap() + 7));

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, PERMISSION_SLUGS.meta[0]],
        [this.getLastBitSlugMap() + 2, PERMISSION_SLUGS.meta[1]],
        [this.getLastBitSlugMap() + 3, PERMISSION_SLUGS.meta[2]],
        [this.getLastBitSlugMap() + 4, PERMISSION_SLUGS.meta[3]],
        [this.getLastBitSlugMap() + 5, PERMISSION_SLUGS.meta[4]],
        [this.getLastBitSlugMap() + 6, PERMISSION_SLUGS.meta[5]],
        [this.getLastBitSlugMap() + 7, PERMISSION_SLUGS.meta[6]],
    ]);
}

export class UserPermission extends Permission {
    static readonly READ_USER = new this(mask(this.getLastBitSlugMap() + 1));
    static readonly ACTIVATE_USER = new this(mask(this.getLastBitSlugMap() + 2));
    static readonly DEACTIVATE_USER = new this(mask(this.getLastBitSlugMap() + 3));

    static readonly MANAGE_USER = new this().add(
        this.READ_USER,
        this.ACTIVATE_USER,
        this.DEACTIVATE_USER,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, PERMISSION_SLUGS.user[0]],
        [this.getLastBitSlugMap() + 2, PERMISSION_SLUGS.user[1]],
        [this.getLastBitSlugMap() + 3, PERMISSION_SLUGS.user[2]],
    ]);
}

export class FAQPermission extends Permission {
    static readonly READ_FAQ = new this(mask(this.getLastBitSlugMap() + 1));
    static readonly CREATE_FAQ = new this(mask(this.getLastBitSlugMap() + 2));
    static readonly DELETE_FAQ = new this(mask(this.getLastBitSlugMap() + 3));
    static readonly UPDATE_FAQ = new this(mask(this.getLastBitSlugMap() + 4));
    static readonly RESTORE_FAQ = new this(mask(this.getLastBitSlugMap() + 5));

    static readonly MANAGE_FAQ = new this().add(
        this.READ_FAQ,
        this.CREATE_FAQ,
        this.DELETE_FAQ,
        this.RESTORE_FAQ,
        this.UPDATE_FAQ,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, PERMISSION_SLUGS.faq[0]],
        [this.getLastBitSlugMap() + 2, PERMISSION_SLUGS.faq[1]],
        [this.getLastBitSlugMap() + 3, PERMISSION_SLUGS.faq[2]],
        [this.getLastBitSlugMap() + 4, PERMISSION_SLUGS.faq[3]],
        [this.getLastBitSlugMap() + 5, PERMISSION_SLUGS.faq[4]],
    ]);
}

export class WeeklySchedulePermission extends Permission {
    static readonly CREATE_WEEKLY_SCHEDULE = new this(mask(this.getLastBitSlugMap() + 1));
    static readonly DELETE_WEEKLY_SCHEDULE = new this(mask(this.getLastBitSlugMap() + 2));
    static readonly UPDATE_WEEKLY_SCHEDULE = new this(mask(this.getLastBitSlugMap() + 3));
    static readonly READ_WEEKLY_SCHEDULE_HISTORY = new this(mask(this.getLastBitSlugMap() + 4));

    static readonly MANAGE_WEEKLY_SCHEDULE = new this().add(
        this.CREATE_WEEKLY_SCHEDULE,
        this.DELETE_WEEKLY_SCHEDULE,
        this.UPDATE_WEEKLY_SCHEDULE,
        this.READ_WEEKLY_SCHEDULE_HISTORY,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, PERMISSION_SLUGS.weekly_schedule[0]],
        [this.getLastBitSlugMap() + 2, PERMISSION_SLUGS.weekly_schedule[1]],
        [this.getLastBitSlugMap() + 3, PERMISSION_SLUGS.weekly_schedule[2]],
        [this.getLastBitSlugMap() + 4, PERMISSION_SLUGS.weekly_schedule[3]],
    ]);
}

export class VaultPermission extends Permission {
    static readonly CREATE_NODE = new this(mask(this.getLastBitSlugMap() + 1));
    static readonly UPDATE_NODE = new this(mask(this.getLastBitSlugMap() + 2));
    static readonly DELETE_NODE = new this(mask(this.getLastBitSlugMap() + 3));

    static readonly MANAGE_VAULT = new this().add(
        this.CREATE_NODE,
        this.UPDATE_NODE,
        this.DELETE_NODE,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, PERMISSION_SLUGS.vault[0]],
        [this.getLastBitSlugMap() + 2, PERMISSION_SLUGS.vault[1]],
        [this.getLastBitSlugMap() + 3, PERMISSION_SLUGS.vault[2]],
    ]);
}

export class AnimePermission extends Permission {
    static readonly READ_ANIME = new this(mask(this.getLastBitSlugMap() + 1));
    static readonly CREATE_ANIME = new this(mask(this.getLastBitSlugMap() + 2));
    static readonly DELETE_ANIME = new this(mask(this.getLastBitSlugMap() + 3));
    static readonly UPDATE_ANIME = new this(mask(this.getLastBitSlugMap() + 4));
    static readonly RESTORE_ANIME = new this(mask(this.getLastBitSlugMap() + 5));

    static readonly MANAGE_ANIME = new this().add(
        this.READ_ANIME,
        this.CREATE_ANIME,
        this.DELETE_ANIME,
        this.UPDATE_ANIME,
        this.RESTORE_ANIME,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, PERMISSION_SLUGS.anime[0]],
        [this.getLastBitSlugMap() + 2, PERMISSION_SLUGS.anime[1]],
        [this.getLastBitSlugMap() + 3, PERMISSION_SLUGS.anime[2]],
        [this.getLastBitSlugMap() + 4, PERMISSION_SLUGS.anime[3]],
        [this.getLastBitSlugMap() + 5, PERMISSION_SLUGS.anime[4]],
    ]);
}

export class NavItemsPermission extends Permission {
    static readonly READ_NAVITEMS = new this(mask(this.getLastBitSlugMap() + 1));
    static readonly CREATE_NAVITEMS = new this(mask(this.getLastBitSlugMap() + 2));
    static readonly DELETE_NAVITEMS = new this(mask(this.getLastBitSlugMap() + 3));
    static readonly UPDATE_NAVITEMS = new this(mask(this.getLastBitSlugMap() + 4));
    static readonly RESTORE_NAVITEMS = new this(mask(this.getLastBitSlugMap() + 5));

    static readonly MANAGE_NAVITEMS = new this().add(
        this.READ_NAVITEMS,
        this.CREATE_NAVITEMS,
        this.DELETE_NAVITEMS,
        this.UPDATE_NAVITEMS,
        this.RESTORE_NAVITEMS,
    );

    protected static override readonly slugMap: BiMap<number, string> = this.extendSlugMap([
        [this.getLastBitSlugMap() + 1, PERMISSION_SLUGS.navItems[0]],
        [this.getLastBitSlugMap() + 2, PERMISSION_SLUGS.navItems[1]],
        [this.getLastBitSlugMap() + 3, PERMISSION_SLUGS.navItems[2]],
        [this.getLastBitSlugMap() + 4, PERMISSION_SLUGS.navItems[3]],
        [this.getLastBitSlugMap() + 5, PERMISSION_SLUGS.navItems[4]],
    ]);
}

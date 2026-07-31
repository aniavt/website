import type { UserRepository } from "@domain/repositories/UserRepository";
import {
    AnimePermission,
    FAQPermission,
    isPermissionNamespace,
    ManagePermission,
    type PermissionNamespace,
    UserPermission,
    WeeklySchedulePermission,
    type Permission,
    NavItemsPermission,
} from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { UserEntity } from "@domain/entities/User";
import type { UserError, PermissionError } from "../errors";
import { assertPermission } from "@application/shared/auth";


export interface ManagePermissionInput {
    userId: string;
    requesterId: string;
    permission: string; // slug
    namespace: PermissionNamespace;
    action: "grant" | "revoke";
}

function metaPermissionForNamespace(namespace: PermissionNamespace) {
    switch (namespace) {
        case "meta": return ManagePermission.META_MANAGE_PERMISSIONS;
        case "user": return ManagePermission.MANAGE_USER;
        case "faq": return ManagePermission.MANAGE_FAQ;
        case "weekly_schedule": return ManagePermission.MANAGE_WEEKLY_SCHEDULE;
        case "anime": return ManagePermission.MANAGE_ANIME;
        case "navItems": return ManagePermission.MANAGE_NAVITEMS;
    }
}

export class ManagePermissionUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: ManagePermissionInput): Promise<Result<void, UserError | PermissionError>> {
        const { userId, requesterId, permission, namespace, action } = input;
        
        if (!isPermissionNamespace(namespace)) return err("permission_invalid_namespace");
        if (action !== "grant" && action !== "revoke") return err("permission_invalid_action");
        
        const saveUser: ((user: UserEntity) => Promise<Result<void, UserError>>) = async (user) => {
            try {
                await this.userRepository.save(user);
                return ok(void 0);
            } catch (error) {
                console.error("user_save_failed", error);
                return err("user_save_failed");
            }
        }


        const targetClass: typeof Permission | PermissionError = (() => {
            switch (namespace) {
                case "meta": return ManagePermission;
                case "user": return UserPermission;
                case "faq":  return FAQPermission;
                case "weekly_schedule": return WeeklySchedulePermission;
                case "navItems": return NavItemsPermission;
                case "anime": return AnimePermission;
            }
            return "permission_invalid_namespace";
        })();

        if (typeof targetClass === "string") return err(targetClass);

        const target = targetClass.fromSlug(permission);
        if (!target) return err("permission_invalid_slug");

        const auth = await assertPermission(
            this.userRepository,
            requesterId,
            { type: "meta", permission: metaPermissionForNamespace(namespace) },
            "permission_not_authorized",
        );
        if (auth.isError()) return auth;
        const requester = auth.data;

        const user = await this.userRepository.findById(userId);
        if (!user) return err("user_not_found");

        if (action === "revoke" && requester.id === user.id && namespace === "meta" && target.valueOf() === ManagePermission.META_MANAGE_PERMISSIONS.valueOf()) {
            return err("user_cannot_revoke_self_meta_manage_permissions");
        }

        if (action === "grant") {
            user.grantPermission({ type: namespace, permission: target });
        } else {
            user.revokePermission({ type: namespace, permission: target });
        }
        return await saveUser(user);
    }
}

import type { UserRepository } from "@domain/repositories/UserRepository";
import { FAQPermission, isPermissionNamespace, ManagePermission, type PermissionNamespace, UserPermission, type Permission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { UserEntity } from "@domain/entities/User";
import type { UserError, PermissionError } from "../errors";


export interface ManagePermissionInput {
    userId: string;
    requesterId: string;
    permission: string; // slug
    namespace: PermissionNamespace;
    action: "grant" | "revoke";
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
            } catch {
                return err("user_save_failed");
            }
        }


        const targetClass: typeof Permission | PermissionError = (() => {
            switch (namespace) {
                case "meta": return ManagePermission;
                case "user": return UserPermission;
                case "faq":  return FAQPermission;
            }
            return "permission_invalid_namespace";
        })();

        if (typeof targetClass === "string") return err(targetClass);

        const target = targetClass.fromSlug(permission);
        if (!target) return err("permission_invalid_slug");

        const [user, requester] = await Promise.all([
            this.userRepository.findById(userId),
            this.userRepository.findById(requesterId),
        ]);

        if (!user || !requester) return err("user_not_found");

        if (target.isAssignmentPermission()) {
            switch (namespace) {
                case "meta": if (!requester.hasPermission({ type: "meta", permission: ManagePermission.META_MANAGE_PERMISSIONS })) return err("permission_not_authorized"); break;
                case "user": if (!requester.hasPermission({ type: "meta", permission: ManagePermission.MANAGE_USER })) return err("permission_not_authorized"); break;
                case "faq": if (!requester.hasPermission({ type: "meta", permission: ManagePermission.MANAGE_FAQ })) return err("permission_not_authorized"); break;
            }
            if (action === "grant") {
                user.grantPermission({ type: namespace, permission: target });
            } else {
                if (requester.id === user.id && namespace === "meta" && target.valueOf() === ManagePermission.META_MANAGE_PERMISSIONS.valueOf()) {
                    return err("user_cannot_revoke_self_meta_manage_permissions");
                }
                user.revokePermission({ type: namespace, permission: target });
            }
            return await saveUser(user);
        }

        const { assign, revoke } = target.getRequiredAssignmentPermission() || {};

        if (action === "grant" && assign && !requester.hasPermission({ type: namespace, permission: assign })) return err("permission_not_authorized");
        if (action === "revoke" && revoke && !requester.hasPermission({ type: namespace, permission: revoke })) return err("permission_not_authorized");
        
        if (action === "grant") {
            user.grantPermission({ type: namespace, permission: target });
        } else {
            user.revokePermission({ type: namespace, permission: target });
        }
        return await saveUser(user);
    }
}

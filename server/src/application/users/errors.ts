export type UserError = 
    | "user_not_found"
    | "user_not_authorized"
    | "user_cannot_deactivate_root"
    | "user_cannot_revoke_self_meta_manage_permissions"
    | "username_already_exists"
    | "username_too_short"
    | "username_too_long"
    | "password_too_short"
    | "password_too_long"
    | "password_weak_upper_case_letter"
    | "password_weak_lower_case_letter"
    | "password_weak_number"
    | "password_weak_symbol"
    | "password_verify_failed"
    | "user_save_failed"
    | "user_repo_error";


export type PermissionError = 
    | "permission_invalid_action"
    | "permission_invalid_namespace"
    | "permission_invalid_slug"
    | "permission_not_authorized";

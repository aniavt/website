import { err, ok, type Result, type Err } from "@lib/result";
import type { UserError } from "@application/users/errors";


export function validateUsername(username: string): Result<void, UserError> {
    if (username.length < 3) {
        return err("username_too_short");
    }
    if (username.length > 20) {
        return err("username_too_long");
    }
    return ok(void 0);
}

export function validatePassword(password: string): Result<void, UserError> {
    if (password.length < 8) {
        return err("password_too_short");
    }
    if (password.length > 100) {
        return err("password_too_long");
    }
    if (!password.match(/[A-Z]/)) {
        return err("password_week_upper_case_letter");
    }
    if (!password.match(/[a-z]/)) {
        return err("password_week_lower_case_letter");
    }
    if (!password.match(/[0-9]/)) {
        return err("password_week_number");
    }
    if (!password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)) {
        return err("password_week_symbol");
    }
    return ok(void 0);
}

export interface UseCase<T, R> {
    execute(input: T): Promise<Result<R, UserError>>;
}

export const handleError = <T, R>(useCase: UseCase<T, R>) => {
    return new Proxy<UseCase<T, R>>(useCase, {
        apply: async (target, thisArg, argumentsList) => {
            try {
                return await target.execute(argumentsList[0]);
            } catch (error) {
                return err("user_repo_error");
            }
        }
    })
}

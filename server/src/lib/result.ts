export type Result<T, E> = Ok<T> | Err<E>;

class BaseResult<T, E> {
    readonly success: boolean;
    readonly data: T | null;
    readonly error: E | null;

    constructor(success: boolean, data: T | null, error: E | null) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    isSuccess(): this is Ok<T> {
        return this.success;
    }

    isError(): this is Err<E> {
        return !this.success;
    }
}

export class Ok<T> extends BaseResult<T, null> {
    declare readonly data: T;
    declare readonly error: null;
    constructor(data: T) {
        super(true, data, null);
    }
}

export class Err<E> extends BaseResult<null, E> {
    declare readonly data: null;
    declare readonly error: E;
    constructor(error: E) {
        super(false, null, error);
    }
}

export function ok<T>(data: T): Ok<T> {
    return new Ok(data);
}

export function err<E>(error: E): Err<E> {
    return new Err(error);
}

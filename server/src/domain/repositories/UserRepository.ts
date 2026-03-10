import type { UserEntity } from "@domain/entities/User";


export interface PaginationOptions {
    readonly limit?: number;
    readonly offset?: number;
    readonly sort?: "asc" | "desc";
    readonly sortBy?: "id" | "username" | "createdAt" | "updatedAt";
    readonly filter?: {
        readonly isActive?: boolean;
        readonly createdAt?: Date;
        readonly updatedAt?: Date;
    };
}

export interface UserRepository {
    save(user: UserEntity): Promise<void>;
    findById(id: string): Promise<UserEntity | null>;
    findByUsername(username: string): Promise<UserEntity | null>;
    delete(id: string): Promise<void>;
    
    findAll(options?: PaginationOptions): Promise<UserEntity[]>;
}

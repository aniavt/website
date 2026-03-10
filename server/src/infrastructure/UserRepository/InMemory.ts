import type { PaginationOptions, UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";


export class InMemoryUserRepository implements UserRepository {
    private users: UserEntity[] = [];

    async save(user: UserEntity): Promise<void> {
        const existingUser = this.users.find((u) => u.id === user.id);
        if (existingUser) {
            this.users = this.users.map((u) => u.id === user.id ? user : u);
        } else {
            this.users.push(user);
        }
    }

    async findById(id: string): Promise<UserEntity | null> {
        return this.users.find((u) => u.id === id) ?? null;
    }

    async findByUsername(username: string): Promise<UserEntity | null> {
        return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null;
    }

    async delete(id: string): Promise<void> {
        this.users = this.users.filter((u) => u.id !== id);
    }

    async findAll(options?: PaginationOptions): Promise<UserEntity[]> {
        const {
            limit,
            offset,
            sort,
            sortBy,
            filter,
        } = options ?? {};

        const {
            isActive,
            createdAt,
            updatedAt,
        } = filter ?? {};

        const filteredUsers = this.users.filter((u) => {
            if (isActive !== undefined && u.isActive !== isActive) return false;
            if (createdAt !== undefined && u.createdAt < createdAt) return false;
            if (updatedAt !== undefined && u.updatedAt < updatedAt) return false;
            return true;
        });

        const sortedUsers = filteredUsers.sort((a, b) => {
            const sortByValue = sortBy ?? "createdAt";
            const sortFn = (a: UserEntity, b: UserEntity) => {
                if (sortByValue === "id") {
                    return a.id.localeCompare(b.id);
                } else if (sortByValue === "username") {
                    return a.username.localeCompare(b.username);
                } else if (sortByValue === "createdAt") {
                    return a.createdAt.getTime() - b.createdAt.getTime();
                } else if (sortByValue === "updatedAt") {
                    return a.updatedAt.getTime() - b.updatedAt.getTime();
                }
                return 0;
            };
            if (sort === "asc") {
                return sortFn(a, b);
            } else {
                return sortFn(b, a);
            }
        });

        if (limit && offset) {
            return sortedUsers.slice(offset, offset + limit);
        }

        return sortedUsers;
    }
}

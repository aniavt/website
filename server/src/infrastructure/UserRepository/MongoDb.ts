import { UserEntity } from "@domain/entities/User";
import type { PaginationOptions, UserRepository } from "@domain/repositories/UserRepository";
// Import mongoose
import mongoose from "mongoose";

// Define the user schema
const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    sessionVersion: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    isActive: { type: Boolean, required: true, default: true },
    isAdmin: { type: Boolean, required: true, default: false },
    isRoot: { type: Boolean, required: true, default: false },
});

interface UserDocument {
    id: string;
    username: string;
    passwordHash: string;
    sessionVersion: number;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    isAdmin: boolean;
    isRoot: boolean;
}

type UserFilterQuery = Partial<Pick<UserDocument, "isActive" | "isAdmin" | "isRoot">> & {
    createdAt?: { $gte: Date };
    updatedAt?: { $gte: Date };
};

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ isActive: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ isRoot: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ updatedAt: 1 });
userSchema.index({ isActive: 1, isAdmin: 1, isRoot: 1, createdAt: 1, updatedAt: 1 }, { partialFilterExpression: { isActive: true } });

function userToDocument(user: UserEntity): UserDocument {
    return {
        id: user.id,
        username: user.username,
        passwordHash: user.passwordHash,
        sessionVersion: user.sessionVersion,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        isRoot: user.isRoot,
    };
}


export class MongoDbUserRepository implements UserRepository {
    private readonly userModel: mongoose.Model<UserDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        // this.userModel = this.mongoClient.db().collection<UserDocument>("users");
        this.userModel = this.mongoClient.model<UserDocument>("User", userSchema);
    }

    async save(user: UserEntity): Promise<void> {
        // Ver si existe, si existe, actualizarlo, si no existe, crearlo
        const existingUser = await this.userModel.findOne({ id: user.id });
        if (existingUser) {
            await this.userModel.updateOne({ id: user.id }, { $set: userToDocument(user) });
        } else {
            await this.userModel.create(userToDocument(user));
        }
    }

    async findById(id: string): Promise<UserEntity | null> {
        const user = await this.userModel.findOne({ id });
        return user ? UserEntity.fromPersistence(user) : null;
    }

    async findByUsername(username: string): Promise<UserEntity | null> {
        const user = await this.userModel.findOne({ username });
        return user ? UserEntity.fromPersistence(user) : null;
    }
    async delete(id: string): Promise<void> {
        await this.userModel.deleteOne({ id });
    }

    async findAll(options?: PaginationOptions): Promise<UserEntity[]> {
        const {
            limit,
            offset,
            sort,
            sortBy,
            filter,
        } = options ?? {};

        const query: UserFilterQuery = {};
        if (filter?.isActive) {
            query.isActive = filter.isActive;
        }
        if (filter?.isAdmin) {
            query.isAdmin = filter.isAdmin;
        }
        if (filter?.isRoot) {
            query.isRoot = filter.isRoot;
        }
        if (filter?.createdAt) {
            query.createdAt = { $gte: filter.createdAt };
        }
        if (filter?.updatedAt) {
            query.updatedAt = { $gte: filter.updatedAt };
        }
        const queryBuilder = this.userModel.find(query);
        if (limit && offset) {
            queryBuilder.skip(offset).limit(limit);
        }
        if (sort && sortBy) {
            queryBuilder.sort({ [sortBy]: sort === "asc" ? 1 : -1 });
        }

        const users = await queryBuilder.exec();
        return users.map(user => UserEntity.fromPersistence(user));
    }

    async findActiveUsers(options?: PaginationOptions): Promise<UserEntity[]> {
        return this.findAll({ ...options, filter: { ...options?.filter, isActive: true } });
    }

    async findAdminUsers(options?: PaginationOptions): Promise<UserEntity[]> {
        return this.findAll({ ...options, filter: { ...options?.filter, isAdmin: true } });
    }

    async findRootUsers(options?: PaginationOptions): Promise<UserEntity[]> {
        return this.findAll({ ...options, filter: { ...options?.filter, isRoot: true } });
    }
}

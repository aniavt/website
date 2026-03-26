import { UserEntity } from "@domain/entities/User";
import type { PaginationOptions, UserRepository } from "@domain/repositories/UserRepository";
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
    permissions: {
        meta: { type: [Number], required: true },
        user: { type: [Number], required: true },
        faq: { type: [Number], required: true },
        weekly_schedule: { type: Number, required: true, default: 0 },
        vault: { type: Number, required: true, default: 0 },
        anime: { type: Number, required: true, default: 0 },
    },
});

interface UserDocument {
    id: string;
    username: string;
    passwordHash: string;
    sessionVersion: number;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    permissions: {
        meta: number;
        user: number;
        faq: number;
        weekly_schedule: number;
        vault: number;
        anime: number;
    }
}

type UserFilterQuery = Partial<Pick<UserDocument, "isActive">> & {
    createdAt?: { $gte: Date };
    updatedAt?: { $gte: Date };
};

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ updatedAt: 1 });
userSchema.index({ isActive: 1, createdAt: 1, updatedAt: 1 }, { partialFilterExpression: { isActive: true } });

function userToDocument(user: UserEntity): UserDocument {
    return {
        id: user.id,
        username: user.username,
        passwordHash: user.passwordHash,
        sessionVersion: user.sessionVersion,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive,
        permissions: {
            meta: user.permissions.meta.valueOf(),
            user: user.permissions.user.valueOf(),
            faq: user.permissions.faq.valueOf(),
            weekly_schedule: user.permissions.weekly_schedule.valueOf(),
            vault: user.permissions.vault.valueOf(),
            anime: user.permissions.anime.valueOf(),
        },
    };
}


export class MongoDbUserRepository implements UserRepository {
    private readonly userModel: mongoose.Model<UserDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.userModel = this.mongoClient.model<UserDocument>("User", userSchema);
    }

    async save(user: UserEntity): Promise<void> {
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
}

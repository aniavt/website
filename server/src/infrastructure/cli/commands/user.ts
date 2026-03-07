import type { UserDto } from "@application/users/dto";
import type { CliFeature } from "../types";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { PaginationOptions } from "@domain/repositories/UserRepository";


function printUser(data: UserDto) {
  console.log(`User: ${data.username} (${data.id})`);
  console.log(`  Created: ${data.createdAt.toISOString()}`);
  console.log(`  Updated: ${data.updatedAt.toISOString()}`);
  console.log(`  Is Active: ${data.isActive}`);
  console.log(`  Is Admin: ${data.isAdmin}`);
  console.log(`  Is Root: ${data.isRoot}`);
  console.log(`  Session Version: ${data.sessionVersion}`);
}

export function buildUserCommands(userUseCases: IUserUseCases): CliFeature {
  return {
    name: "user",
    description: "User management commands",
    commands: [
      {
        name: "create",
        description: "user create <username> <password>",
        async run([username, password]) {
          if (!username || !password) {
            console.error("Usage: user create <username> <password>");
            return;
          }

          const result = await userUseCases.create.execute({ username, password });
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          printUser(result.data);
        },
      },
      {
        name: "activate",
        description: "user activate <user-id>",
        async run([userId, requesterId]) {
          if (!userId || !requesterId) {
            console.error("Usage: user activate <user-id> <requester-id>");
            return;
          }

          const result = await userUseCases.activate.execute(userId, requesterId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("User activated successfully");
        },
      },
      {
        name: "deactivate",
        description: "user deactivate <user-id> <requester-id>",
        async run([userId, requesterId]) {
          if (!userId || !requesterId) {
            console.error("Usage: user deactivate <user-id> <requester-id>");
            return;
          }
          
          const result = await userUseCases.deactivate.execute(userId, requesterId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("User deactivated successfully");
        },
      },
      {
        name: "increment-version",
        description: "user increment-version <user-id>",
        async run([userId]) {
          if (!userId) {
            console.error("Usage: user increment-version <user-id>");
            return;
          }
          
          const result = await userUseCases.incrementSessionVersion.execute(userId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("Session version incremented successfully");
        },
      },
      {
        name: "verify-password",
        description: "user verify-password <user-id> <password>",
        async run([userId, password]) {
          if (!userId || !password) {
            console.error("Usage: user verify-password <user-id> <password>");
            return;
          }
          
          const result = await userUseCases.verifyPassword.execute(userId, password);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("Password verified successfully");
        },
      },
      {
        name: "get-by-id",
        description: "user get-by-id <user-id>",
        async run([userId]) {
          if (!userId) {
            console.error("Usage: user get-by-id <user-id>");
            return;
          }
          
          const result = await userUseCases.getById.execute(userId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          printUser(result.data);
        },
      },
      {
        name: "get-by-username",
        description: "user get-by-username <username>",
        async run([username]) {
          if (!username) {
            console.error("Usage: user get-by-username <username>");
            return;
          }

          const result = await userUseCases.getByUsername.execute(username);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          printUser(result.data);
        },
      },
      {
        name: "get-all",
        description: "user get-all <requester-id>",
        async run([requesterId, page, limit]) {
          if (!requesterId) {
            console.error("Usage: user get-all <requester-id> [page] [limit]");
            return;
          }

          const options: PaginationOptions = {
            limit: limit ? parseInt(limit) : undefined,
            offset: page ? parseInt(page) : undefined,
          }
          
          const result = await userUseCases.getAll.execute(requesterId, options);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          for (const user of result.data) {
            printUser(user);
          }
        },
      },
      {
        name: "get-active-users",
        description: "user get-active-users <requester-id> [page] [limit]",
        async run([requesterId, page, limit]) {
          if (!requesterId) {
            console.error("Usage: user get-active-users <requester-id> [page] [limit]");
            return;
          }

          const options: PaginationOptions = {
            limit: limit ? parseInt(limit) : undefined,
            offset: page ? parseInt(page) : undefined,
            filter: {
              isActive: true,
            }
          }
          
          const result = await userUseCases.getAll.execute(requesterId, options);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          for (const user of result.data) {
            printUser(user);
          }
        },
      },
      {
        name: "get-admin-users",
        description: "user get-admin-users <requester-id> [page] [limit]",
        async run([requesterId, page, limit]) {
          if (!requesterId) {
            console.error("Usage: user get-admin-users <requester-id> [page] [limit]");
            return;
          }

          const options: PaginationOptions = {
            limit: limit ? parseInt(limit) : undefined,
            offset: page ? parseInt(page) : undefined,
            filter: {
              isAdmin: true,
            }
          }

          const result = await userUseCases.getAll.execute(requesterId, options);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          for (const user of result.data) {
            printUser(user);
          }
        }
      },
      {
        name: "get-root-users",
        description: "user get-root-users <requester-id> [page] [limit]",
        async run([requesterId, page, limit]) {
          if (!requesterId) {
            console.error("Usage: user get-root-users <requester-id> [page] [limit]");
            return;
          }

          const options: PaginationOptions = {
            limit: limit ? parseInt(limit) : undefined,
            offset: page ? parseInt(page) : undefined,
            filter: {
              isRoot: true,
            }
          }

          const result = await userUseCases.getAll.execute(requesterId, options);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          for (const user of result.data) {
            printUser(user);
          }
        },
      },
      {
        name: "get-inactive-users",
        description: "user get-inactive-users <requester-id> [page] [limit]",
        async run([requesterId, page, limit]) {
          if (!requesterId) {
            console.error("Usage: user get-inactive-users <requester-id> [page] [limit]");
            return;
          }
          const options: PaginationOptions = {
            limit: limit ? parseInt(limit) : undefined,
            offset: page ? parseInt(page) : undefined,
            filter: {
              isActive: false,
            }
          }
  
          const result = await userUseCases.getAll.execute(requesterId, options);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          for (const user of result.data) {
            printUser(user);
          }
        },
      },
      {
        name: "grant-admin",
        description: "user grant-admin <user-id> <requester-id>",
        async run([userId, requesterId]) {
          if (!userId || !requesterId) {
            console.error("Usage: user grant-admin <user-id> <requester-id>");
            return;
          }

        const result = await userUseCases.grantAdmin.execute(userId, requesterId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("Admin granted successfully");
        },
      },
      {
        name: "grant-root",
        description: "user grant-root <user-id> <requester-id>",
        async run([userId, requesterId]) {
          if (!userId || !requesterId) {
            console.error("Usage: user grant-root <user-id> <requester-id>");
            return;
          }

          const result = await userUseCases.grantRoot.execute(userId, requesterId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("Root granted successfully");
        },
      },
      {
        name: "revoke-admin",
        description: "user revoke-admin <user-id> <requester-id>",
        async run([userId, requesterId]) {
          if (!userId || !requesterId) {
            console.error("Usage: user revoke-admin <user-id> <requester-id>");
            return;
          }

          const result = await userUseCases.revokeAdmin.execute(userId, requesterId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("Admin revoked successfully");
        },
      },
      {
        name: "revoke-root",
        description: "user revoke-root <user-id> <requester-id>",
        async run([userId, requesterId]) {
          if (!userId || !requesterId) {
            console.error("Usage: user revoke-root <user-id> <requester-id>");
            return;
          }

          const result = await userUseCases.revokeRoot.execute(userId, requesterId);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("Root revoked successfully");
        },
      },
      {
        name: "update-password",
        description: "user update-password <user-id> <new-password>",
        async run([userId, newPassword]) {
          if (!userId || !newPassword) {
            console.error("Usage: user update-password <user-id> <new-password>");
            return;
          }

          const result = await userUseCases.updatePassword.execute(userId, newPassword);
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          console.log("Password updated successfully");
        },
      },
      {
        name: "bootstrap-root",
        description: "user bootstrap-root <username> <password>",
        async run([username, password]) {
          if (!username || !password) {
            console.error("Usage: user bootstrap-root <username> <password>");
            return;
          }

          const result = await userUseCases.bootstrapRoot.execute({ username, password });
          if (result.isError()) {
            console.error(`Error:`, result.error);
            return;
          }
          printUser(result.data);
        },
      },
      {
        name: "help",
        description: "user help",
        async run() {
          console.log("Usage: user <command> [args...]");
          console.log("       user help - show this help");
          console.log("       user create <username> <password> - create a new user");
          console.log("       user activate <user-id> <requester-id> - activate a user");
          console.log("       user deactivate <user-id> <requester-id> - deactivate a user");
          console.log("       user increment-version <user-id> - increment the session version of a user");
          console.log("       user verify-password <user-id> <password> - verify a user's password");
          console.log("       user get-by-id <user-id> - get a user by id");
          console.log("       user get-by-username <username> - get a user by username");
          console.log("       user get-all <requester-id> [page] [limit] - get all users");
          console.log("       user get-active-users <requester-id> [page] [limit] - get all active users");
          console.log("       user get-admin-users <requester-id> [page] [limit] - get all admin users");
          console.log("       user get-root-users <requester-id> [page] [limit] - get all root users");
          console.log("       user get-inactive-users <requester-id> [page] [limit] - get all inactive users");
          console.log("       user grant-admin <user-id> <requester-id> - grant admin to a user");
          console.log("       user grant-root <user-id> <requester-id> - grant root to a user");
          console.log("       user revoke-admin <user-id> <requester-id> - revoke admin from a user");
          console.log("       user revoke-root <user-id> <requester-id> - revoke root from a user");
          console.log("       user update-password <user-id> <new-password> - update a user's password");
          console.log("       user bootstrap-root <username> <password> - create the first root user (if none exists)");
          console.log("       user help - show this help");
        },
      }
    ],
  }
}


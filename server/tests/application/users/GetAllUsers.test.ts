import { describe, expect, test } from "bun:test";
import { GetAllUsersUseCase } from "@application/users/use-cases/GetAllUsers";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { createUser, UserPermission } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetAllUsersUseCase", () => {
  test("happy path returns all users", async () => {
    const users = new InMemoryUserRepository();
    const reader = createUser({
      id: "reader",
      grants: [{ type: "user", permission: UserPermission.READ_USER }],
    });
    await users.save(reader);
    await users.save(createUser({ id: "u1", username: "alice" }));
    await users.save(createUser({ id: "u2", username: "bob" }));

    const uc = new GetAllUsersUseCase(users);
    const dtos = expectOk(await uc.execute("reader"));
    expect(dtos.length).toBeGreaterThanOrEqual(3);
    expect(dtos.map((u) => u.username)).toContain("alice");
    expect(dtos.map((u) => u.username)).toContain("bob");
  });

  test("user_not_authorized without READ_USER", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "noperm" }));
    const uc = new GetAllUsersUseCase(users);
    expectErr(await uc.execute("noperm"), "user_not_authorized");
  });

  test("user_not_authorized when requester missing", async () => {
    const uc = new GetAllUsersUseCase(new InMemoryUserRepository());
    expectErr(await uc.execute("missing"), "user_not_authorized");
  });
});

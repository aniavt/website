import { describe, expect, test } from "bun:test";
import { GetUserByIdUseCase } from "@application/users/use-cases/GetUserById";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetUserByIdUseCase", () => {
  test("happy path", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "u1", username: "alice" }));

    const uc = new GetUserByIdUseCase(users);
    const dto = expectOk(await uc.execute("u1"));
    expect(dto.id).toBe("u1");
    expect(dto.username).toBe("alice");
  });

  test("user_not_found", async () => {
    const uc = new GetUserByIdUseCase(new InMemoryUserRepository());
    expectErr(await uc.execute("missing"), "user_not_found");
  });
});

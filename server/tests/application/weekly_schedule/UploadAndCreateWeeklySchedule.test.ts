import { describe, expect, test } from "bun:test";
import { getISOWeekAndYear } from "@ania/date";
import { StoredMediaService } from "@infrastructure/StoredMediaService";
import { CreateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/CreateWeeklySchedule";
import { UploadAndCreateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UploadAndCreateWeeklySchedule";
import { InMemoryWeeklyScheduleRepository } from "../../doubles/InMemoryWeeklyScheduleRepository";
import { InMemoryWeeklyScheduleHistoryRepository } from "../../doubles/InMemoryWeeklyScheduleHistoryRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeTransactionManager } from "../../doubles/FakeTransactionManager";
import { FakeObjectStorage } from "../../doubles/FakeObjectStorage";
import { WeeklySchedulePermission, createUser, createWeeklySchedule } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

function futureWeekYear(): { week: number; year: number } {
  const { week, year } = getISOWeekAndYear(new Date());
  if (week >= 53) return { week: 1, year: year + 1 };
  return { week: week + 2, year };
}

function buildUploadAndCreate() {
  const schedules = new InMemoryWeeklyScheduleRepository();
  const history = new InMemoryWeeklyScheduleHistoryRepository();
  const files = new InMemoryFileRepository();
  const users = new InMemoryUserRepository();
  const storage = new FakeObjectStorage();
  const mediaService = new StoredMediaService(storage, files);
  const idGen = new FakeIdGenerator("ws");
  const tx = new FakeTransactionManager();
  const createWeeklySchedule = new CreateWeeklyScheduleUseCase(
    schedules,
    history,
    files,
    users,
    idGen,
    tx,
  );
  const uc = new UploadAndCreateWeeklyScheduleUseCase(mediaService, createWeeklySchedule);
  return { schedules, files, users, storage, uc };
}

const validFile = {
  name: "schedule.png",
  contentType: "image/png",
  size: 100,
  body: new Uint8Array([1, 2, 3]),
};

describe("UploadAndCreateWeeklyScheduleUseCase", () => {
  test("uploads file and creates schedule", async () => {
    const { schedules, files, users, uc } = buildUploadAndCreate();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.CREATE_WEEKLY_SCHEDULE }],
      }),
    );
    const { week, year } = futureWeekYear();
    const dto = expectOk(await uc.execute("admin", { week, year, file: validFile }));
    expect(dto.week).toBe(week);
    expect(dto.year).toBe(year);
    expect(await files.findById(dto.fileId)).not.toBeNull();
    expect(await schedules.findByWeekAndYear(week, year)).not.toBeNull();
  });

  test("compensates uploaded file on duplicate week/year", async () => {
    const { schedules, files, users, storage, uc } = buildUploadAndCreate();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.CREATE_WEEKLY_SCHEDULE }],
      }),
    );
    const { week, year } = futureWeekYear();
    await schedules.save(createWeeklySchedule({ id: "existing", week, year }));
    expectErr(await uc.execute("admin", { week, year, file: validFile }), "weekly_schedule_duplicate_week_year");
    const remaining = await files.findById("file-1");
    expect(remaining).toBeNull();
    expect(storage.deletedIds.length).toBeGreaterThan(0);
  });

  test("rejects invalid upload input", async () => {
    const { users, uc } = buildUploadAndCreate();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.CREATE_WEEKLY_SCHEDULE }],
      }),
    );
    const { week, year } = futureWeekYear();
    expectErr(
      await uc.execute("admin", { week, year, file: { ...validFile, size: 0 } }),
      "media_invalid_input",
    );
  });
});

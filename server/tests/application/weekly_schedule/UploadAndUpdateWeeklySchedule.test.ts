import { describe, expect, test } from "bun:test";
import { getISOWeekAndYear } from "@ania/date";
import { UploadFileUseCase } from "@application/media/use-cases/UploadFile";
import { DeleteFileUseCase } from "@application/media/use-cases/DeleteFile";
import { UpdateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UpdateWeeklySchedule";
import { UploadAndUpdateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UploadAndUpdateWeeklySchedule";
import { InMemoryWeeklyScheduleRepository } from "../../doubles/InMemoryWeeklyScheduleRepository";
import { InMemoryWeeklyScheduleHistoryRepository } from "../../doubles/InMemoryWeeklyScheduleHistoryRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeTransactionManager } from "../../doubles/FakeTransactionManager";
import { FakeMediaService } from "../../doubles/FakeMediaService";
import {
  WeeklySchedulePermission,
  createFile,
  createUser,
  createWeeklySchedule,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

function futureWeekYear(): { week: number; year: number } {
  const { week, year } = getISOWeekAndYear(new Date());
  if (week >= 53) return { week: 1, year: year + 1 };
  return { week: week + 1, year };
}

function buildUploadAndUpdate(weekYear?: { week: number; year: number }) {
  const schedules = new InMemoryWeeklyScheduleRepository();
  const history = new InMemoryWeeklyScheduleHistoryRepository();
  const files = new InMemoryFileRepository();
  const users = new InMemoryUserRepository();
  const media = new FakeMediaService();
  const idGen = new FakeIdGenerator("ws");
  const tx = new FakeTransactionManager();
  const wy = weekYear ?? futureWeekYear();
  const uploadFile = new UploadFileUseCase(media, files);
  const deleteFile = new DeleteFileUseCase(media, files);
  const updateWeeklySchedule = new UpdateWeeklyScheduleUseCase(
    schedules,
    history,
    files,
    users,
    idGen,
    tx,
  );
  const uc = new UploadAndUpdateWeeklyScheduleUseCase(
    uploadFile,
    deleteFile,
    updateWeeklySchedule,
    schedules,
  );
  return { schedules, files, users, media, uc, wy };
}

const validFile = {
  name: "schedule.png",
  contentType: "image/png",
  size: 100,
  body: new Uint8Array([1, 2, 3]),
};

describe("UploadAndUpdateWeeklyScheduleUseCase", () => {
  test("uploads new file and updates schedule, deletes old file", async () => {
    const { schedules, files, users, media, uc, wy } = buildUploadAndUpdate();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.UPDATE_WEEKLY_SCHEDULE }],
      }),
    );
    await files.save(createFile({ id: "old-file", isPrivate: false }));
    await schedules.save(
      createWeeklySchedule({ id: "ws-1", week: wy.week, year: wy.year, fileId: "old-file" }),
    );

    const dto = expectOk(await uc.execute("admin", { id: "ws-1", file: validFile }));
    expect(dto.fileId).not.toBe("old-file");
    expect(await files.findById("old-file")).toBeNull();
    expect(media.deletedIds).toContain("old-file");
    expect(await files.findById(dto.fileId)).not.toBeNull();
  });

  test("compensates new upload when update fails (past schedule)", async () => {
    const repo = new InMemoryWeeklyScheduleRepository();
    const fileRepo = new InMemoryFileRepository();
    const userRepo = new InMemoryUserRepository();
    const fakeMedia = new FakeMediaService();
    await userRepo.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.UPDATE_WEEKLY_SCHEDULE }],
      }),
    );
    await fileRepo.save(createFile({ id: "old-file", isPrivate: false }));
    await repo.save(createWeeklySchedule({ id: "ws-past", week: 1, year: 2020, fileId: "old-file" }));
    const uploadFile = new UploadFileUseCase(fakeMedia, fileRepo);
    const deleteFile = new DeleteFileUseCase(fakeMedia, fileRepo);
    const updateUc = new UpdateWeeklyScheduleUseCase(
      repo,
      new InMemoryWeeklyScheduleHistoryRepository(),
      fileRepo,
      userRepo,
      new FakeIdGenerator("ws"),
      new FakeTransactionManager(),
    );
    const pastUc = new UploadAndUpdateWeeklyScheduleUseCase(uploadFile, deleteFile, updateUc, repo);

    expectErr(await pastUc.execute("admin", { id: "ws-past", file: validFile }), "weekly_schedule_cannot_modify_past");
    expect(fakeMedia.deletedIds.length).toBeGreaterThan(0);
    expect(await fileRepo.findById("file-1")).toBeNull();
  });

  test("rejects invalid upload input", async () => {
    const { schedules, files, users, uc, wy } = buildUploadAndUpdate();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.UPDATE_WEEKLY_SCHEDULE }],
      }),
    );
    await files.save(createFile({ id: "old-file", isPrivate: false }));
    await schedules.save(
      createWeeklySchedule({ id: "ws-1", week: wy.week, year: wy.year, fileId: "old-file" }),
    );
    expectErr(
      await uc.execute("admin", { id: "ws-1", file: { ...validFile, name: "" } }),
      "media_invalid_input",
    );
  });
});

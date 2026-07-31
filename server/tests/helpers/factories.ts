import { Anime } from "@domain/entities/Anime";
import { Chapter } from "@domain/entities/Chapter";
import { FaqItem } from "@domain/entities/FaqItem";
import { FaqText } from "@domain/entities/FaqText";
import { FileEntity } from "@domain/entities/File";
import { NavItems } from "@domain/entities/NavItems";
import { UserEntity } from "@domain/entities/User";
import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import type { SoftDeleteLastAction } from "@domain/shared/canTransitionLastAction";
import {
  AnimePermission,
  FAQPermission,
  ManagePermission,
  NavItemsPermission,
  Permission,
  UserPermission,
  WeeklySchedulePermission,
  type PermissionNamespace,
} from "@domain/value-object/Permissions";

type Grant =
  | { type: "meta"; permission: ManagePermission }
  | { type: "user"; permission: UserPermission }
  | { type: "faq"; permission: FAQPermission }
  | { type: "weekly_schedule"; permission: WeeklySchedulePermission }
  | { type: "anime"; permission: AnimePermission }
  | { type: "nav_items"; permission: NavItemsPermission };

export function createUser(opts?: {
  id?: string;
  username?: string;
  passwordHash?: string;
  isActive?: boolean;
  sessionVersion?: number;
  grants?: Grant[];
}): UserEntity {
  const user = UserEntity.create(
    opts?.id ?? "user-1",
    opts?.username ?? "alice",
    opts?.passwordHash ?? "hash:password",
  );
  if (opts?.isActive === false) user.deactivate();
  if (opts?.sessionVersion !== undefined) {
    user.sessionVersion = opts.sessionVersion;
  }
  for (const grant of opts?.grants ?? []) {
    user.grantPermission(grant);
  }
  return user;
}

export function createAdminUser(id = "admin-1"): UserEntity {
  return createUser({
    id,
    username: "admin",
    grants: [
      { type: "meta", permission: ManagePermission.META_MANAGE_PERMISSIONS },
    ],
  });
}

export function emptyPermissions(): Record<PermissionNamespace, number> {
  return {
    meta: Permission.NONE.valueOf(),
    user: Permission.NONE.valueOf(),
    faq: Permission.NONE.valueOf(),
    weekly_schedule: Permission.NONE.valueOf(),
    anime: Permission.NONE.valueOf(),
    nav_items: Permission.NONE.valueOf(),
  };
}

export function createAnime(opts?: {
  id?: string;
  title?: string;
  active?: boolean;
  lastAction?: SoftDeleteLastAction;
  status?: "watching" | "completed" | "upcoming";
}): Anime {
  const now = new Date();
  return new Anime({
    id: opts?.id ?? "anime-1",
    title: opts?.title ?? "Title",
    genre: "action",
    status: opts?.status ?? "watching",
    active: opts?.active ?? true,
    lastAction: opts?.lastAction ?? "created",
    createdAt: now,
    updatedAt: now,
  });
}

export function createNavItem(opts?: {
  id?: string;
  title?: string;
  path?: string;
  position?: number;
  active?: boolean;
  lastAction?: SoftDeleteLastAction;
}): NavItems {
  const now = new Date();
  return new NavItems({
    id: opts?.id ?? "nav-1",
    title: opts?.title ?? "Home",
    path: opts?.path ?? "/",
    position: opts?.position ?? 0,
    active: opts?.active ?? true,
    lastAction: opts?.lastAction ?? "created",
    createdAt: now,
    updatedAt: now,
  });
}

export function createFaqItem(opts?: {
  id?: string;
  queryId?: string;
  answerId?: string;
  isActive?: boolean;
  lastAction?: SoftDeleteLastAction;
}): FaqItem {
  return new FaqItem({
    id: opts?.id ?? "faq-1",
    queryId: opts?.queryId ?? "q-1",
    answerId: opts?.answerId ?? "a-1",
    isActive: opts?.isActive ?? true,
    lastAction: opts?.lastAction ?? "created",
  });
}

export function createFaqText(id: string, value: string): FaqText {
  return new FaqText({ id, value });
}

export function createWeeklySchedule(opts?: {
  id?: string;
  week?: number;
  year?: number;
  fileId?: string;
  isDeleted?: boolean;
  title?: string;
}): WeeklySchedule {
  return new WeeklySchedule({
    id: opts?.id ?? "ws-1",
    week: opts?.week ?? 30,
    year: opts?.year ?? 2026,
    fileId: opts?.fileId ?? "file-1",
    isDeleted: opts?.isDeleted ?? false,
    title: opts?.title ?? "Week schedule",
    description: "",
    tags: [],
  });
}

export function createChapter(opts?: {
  id?: string;
  animeId?: string;
  number?: number;
}): Chapter {
  const now = new Date();
  return new Chapter({
    id: opts?.id ?? "ch-1",
    animeId: opts?.animeId ?? "anime-1",
    number: opts?.number ?? 1,
    createdAt: now,
    updatedAt: now,
  });
}

export function createFile(opts?: {
  id?: string;
  isPrivate?: boolean;
}): FileEntity {
  return new FileEntity({
    id: opts?.id ?? "file-1",
    name: "img.png",
    contentType: "image/png",
    size: 100,
    url: `https://fake.local/${opts?.id ?? "file-1"}`,
    isPrivate: opts?.isPrivate ?? false,
  });
}

export {
  AnimePermission,
  FAQPermission,
  ManagePermission,
  NavItemsPermission,
  UserPermission,
  WeeklySchedulePermission,
};

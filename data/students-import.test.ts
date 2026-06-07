import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  hashPassword: vi.fn(),
  txStudentProfileFindMany: vi.fn(),
  txUserCreate: vi.fn(),
  txStudentProfileCreate: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock("@/data/db", () => ({
  prisma: {
    $transaction: mocks.$transaction,
  },
}));

vi.mock("@/data/permissions", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/lib/auth/passwords", () => ({
  defaultStudentInitialPassword: "Password123!",
  hashPassword: mocks.hashPassword,
}));

import {
  formatExistingStudentIdsError,
  importStudents,
} from "./students";

const teacher = {
  id: "teacher_1",
  role: UserRole.TEACHER,
} as never;

const rows = [
  {
    studentId: "10001",
    fullName: "นักเรียน หนึ่ง",
    gradeLevel: "ม.1",
    classroom: "ม.1/1",
  },
  {
    studentId: "10002",
    fullName: "นักเรียน สอง",
    gradeLevel: "ม.1",
    classroom: "ม.1/1",
  },
  {
    studentId: "10003",
    fullName: "นักเรียน สาม",
    gradeLevel: "ม.1",
    classroom: "ม.1/1",
  },
];

describe("importStudents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockReturnValue(teacher);
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.txStudentProfileFindMany.mockResolvedValue([]);
    mocks.txUserCreate.mockImplementation(async ({ data }) => ({
      id: `user_${data.loginName}`,
      ...data,
    }));
    mocks.txStudentProfileCreate.mockResolvedValue({});
    mocks.$transaction.mockImplementation(async (callback) =>
      callback({
        studentProfile: {
          findMany: mocks.txStudentProfileFindMany,
          create: mocks.txStudentProfileCreate,
        },
        user: {
          create: mocks.txUserCreate,
        },
      }),
    );
  });

  it("hashes the shared initial password once", async () => {
    await importStudents(teacher, rows);

    expect(mocks.hashPassword).toHaveBeenCalledTimes(1);
    expect(mocks.hashPassword).toHaveBeenCalledWith("Password123!");
  });

  it("creates each user and student profile in one transaction", async () => {
    await importStudents(teacher, rows);

    expect(mocks.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.txUserCreate).toHaveBeenCalledTimes(3);
    expect(mocks.txStudentProfileCreate).toHaveBeenCalledTimes(3);
    expect(mocks.txUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        loginName: "10001",
        passwordHash: "hashed-password",
        mustChangePassword: true,
      }),
    });
  });

  it("rejects existing student ids before creating records", async () => {
    mocks.txStudentProfileFindMany.mockResolvedValue([{ studentId: "10002" }]);

    await expect(importStudents(teacher, rows)).rejects.toThrow(
      formatExistingStudentIdsError(["10002"]),
    );

    expect(mocks.txUserCreate).not.toHaveBeenCalled();
    expect(mocks.txStudentProfileCreate).not.toHaveBeenCalled();
  });
});

describe("formatExistingStudentIdsError", () => {
  it("summarizes many duplicate student ids", () => {
    expect(
      formatExistingStudentIdsError([
        "10001",
        "10002",
        "10003",
        "10004",
        "10005",
        "10006",
      ]),
    ).toBe(
      "พบเลขประจำตัวนักเรียนที่มีอยู่แล้ว 6 รายการ: 10001, 10002, 10003, 10004, 10005 และอีก 1 รายการ",
    );
  });
});

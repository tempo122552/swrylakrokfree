import "server-only";
import { UserRole } from "@prisma/client";
import { prisma } from "@/data/db";
import {
  requireRole,
  requireSystemTeacher,
  type CurrentUser,
} from "@/data/permissions";

export type AcademicTermInput = {
  name: string;
  startsAt: string;
  endsAt: string;
};

export type ParsedAcademicTermInput = {
  name: string;
  startsAt: Date;
  endsAt: Date;
};

const BANGKOK_OFFSET_HOURS = 7;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParts(name: string, value: string) {
  if (!DATE_INPUT_PATTERN.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`${name} is invalid`);
  }

  return { year, month, day };
}

export function bangkokDateInputToUtcStart(value: string) {
  const { year, month, day } = parseDateParts("date", value);
  return new Date(Date.UTC(year, month - 1, day, -BANGKOK_OFFSET_HOURS));
}

function nextBangkokDay(value: string) {
  const { year, month, day } = parseDateParts("date", value);
  return new Date(Date.UTC(year, month - 1, day + 1, -BANGKOK_OFFSET_HOURS));
}

export function parseAcademicTermInput(
  input: AcademicTermInput,
): ParsedAcademicTermInput {
  const name = input.name.trim();

  if (!name) {
    throw new Error("กรอกชื่อภาคเรียน");
  }

  const startsAt = bangkokDateInputToUtcStart(input.startsAt);
  const endsAt = nextBangkokDay(input.endsAt);

  if (endsAt <= startsAt) {
    throw new Error("วันสิ้นสุดภาคเรียนต้องอยู่หลังวันเริ่มต้น");
  }

  return { name, startsAt, endsAt };
}

export async function listAcademicTerms(currentUser: CurrentUser | null) {
  requireRole(currentUser, [UserRole.TEACHER]);

  return prisma.academicTerm.findMany({
    orderBy: [{ startsAt: "desc" }, { name: "asc" }],
  });
}

export async function createAcademicTerm(
  currentUser: CurrentUser | null,
  input: AcademicTermInput,
) {
  requireSystemTeacher(currentUser);
  const parsed = parseAcademicTermInput(input);

  return prisma.academicTerm.create({
    data: parsed,
  });
}

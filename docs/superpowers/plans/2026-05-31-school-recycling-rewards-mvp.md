# School Recycling Rewards MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved MVP for a school recycling rewards website with role-based login, student import, staff exchange recording, point/remainder calculations, teacher reports, and teacher dashboard charts.

**Architecture:** Use the existing Next.js 16 App Router app as a full-stack application. Server Components read safe DTOs from a server-only Data Access Layer, Server Actions perform mutations with role checks, Prisma stores data in SQLite for local development, and focused Client Components handle interactive forms and charts.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma + SQLite, bcryptjs, jose, zod, xlsx, recharts, lucide-react, Vitest.

---

## Scope Check

The approved spec covers several connected subsystems: authentication, persistence, student import, exchange recording, point adjustments, and teacher reporting. This plan implements them as one MVP because each subsystem depends on the shared account model and exchange data model. Execute tasks in order; each task leaves the app in a buildable or testable state.

Current environment observations:

- `node -v` returned Access denied in the shell.
- `npm -v` was not found in the shell.
- `git` was not found in the shell.

Resolve Node, npm, and git availability before executing code tasks. The project already has `node_modules`, so this is likely a PATH or permission issue rather than a missing project scaffold.

## File Structure

Create or modify these files:

- `package.json`: scripts, Prisma seed command, runtime and test dependencies.
- `.env`: local database and session secret values, not committed.
- `prisma/schema.prisma`: database schema for users, students, waste types, exchanges, remainders, and adjustments.
- `prisma/seed.mjs`: seed system teacher, staff user, sample students, and initial waste types.
- `vitest.config.ts`: Vitest configuration.
- `tests/setup.ts`: Testing Library setup.
- `data/db.ts`: Prisma client singleton.
- `data/rewards.ts`: pure point and remainder calculation.
- `data/rewards.test.ts`: calculation tests.
- `data/import-students.ts`: CSV/Excel parsing and validation.
- `data/import-students.test.ts`: import parser tests.
- `data/permissions.ts`: role and system-teacher authorization helpers.
- `data/users.ts`: user lookup, login verification, and adult account management.
- `data/students.ts`: student DTOs, import persistence, student dashboard data.
- `data/exchanges.ts`: exchange creation and exchange history.
- `data/adjustments.ts`: point and remainder adjustments.
- `data/reports.ts`: teacher dashboard and chart DTOs.
- `lib/auth/passwords.ts`: password hashing and generated password helpers.
- `lib/auth/session.ts`: signed cookie session helpers.
- `lib/auth/current-user.ts`: cached current-user lookup for server code.
- `app/layout.tsx`: Thai metadata and app shell base.
- `app/globals.css`: design system tokens and global polish.
- `app/page.tsx`: redirecting entry page.
- `app/login/page.tsx`: shared login screen.
- `app/login/actions.ts`: login action.
- `app/logout/actions.ts`: logout action.
- `components/shell/app-shell.tsx`: authenticated shell layout.
- `components/ui/*`: buttons, fields, cards, tables, badges, empty states.
- `components/charts/teacher-charts.tsx`: teacher bar and pie charts.
- `app/student/page.tsx`: student dashboard.
- `app/student/history/page.tsx`: student history.
- `app/staff/page.tsx`: staff exchange workspace.
- `app/staff/actions.ts`: staff exchange and adjustment actions.
- `app/staff/adjustments/page.tsx`: adjustment form.
- `app/teacher/page.tsx`: teacher report dashboard.
- `app/teacher/students/page.tsx`: student import and management.
- `app/teacher/actions.ts`: teacher import, waste type, and account actions.
- `app/teacher/rankings/page.tsx`: classroom rankings.
- `app/teacher/waste-types/page.tsx`: waste rule management.
- `app/teacher/accounts/page.tsx`: system teacher account management.

## Task 1: Runtime, Dependencies, And Scripts

**Files:**
- Modify: `package.json`
- Create: `.env`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Verify local runtime commands**

Run:

```powershell
node -v
npm -v
```

Expected: both commands print versions. The current shell showed `node.exe` Access denied and `npm` not found; fix PATH or permissions before continuing.

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install @prisma/client bcryptjs jose zod xlsx recharts lucide-react
npm install -D prisma vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

Expected: `package.json` and `package-lock.json` update successfully.

- [ ] **Step 3: Add scripts and Prisma seed command**

Modify `package.json` so the relevant sections include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "verify": "npm run lint && npm run test && npm run build"
  },
  "prisma": {
    "seed": "node prisma/seed.mjs"
  }
}
```

- [ ] **Step 4: Create local environment file**

Create `.env`:

```dotenv
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace-this-local-dev-secret-with-at-least-32-characters"
```

Expected: `.env` is ignored by the existing `.gitignore`.

- [ ] **Step 5: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": new URL("./", import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 6: Create test setup**

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 7: Run install verification**

Run:

```powershell
npm run test
```

Expected: Vitest exits successfully with no tests found or an empty test-suite success message, depending on Vitest version.

- [ ] **Step 8: Commit setup**

Run when git is available:

```powershell
git add package.json package-lock.json .env vitest.config.ts tests/setup.ts
git commit -m "chore: add mvp runtime dependencies"
```

Expected: commit succeeds. If `.env` is ignored, commit the other files and keep `.env` local.

## Task 2: Database Schema And Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.mjs`
- Create: `data/db.ts`

- [ ] **Step 1: Create Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  STAFF
  TEACHER
}

model User {
  id                      String            @id @default(cuid())
  role                    UserRole
  loginName               String            @unique
  displayName             String
  passwordHash            String
  mustChangePassword      Boolean           @default(false)
  isSystemTeacher         Boolean           @default(false)
  isActive                Boolean           @default(true)
  studentProfile          StudentProfile?
  staffExchanges          Exchange[]        @relation("StaffExchanges")
  pointAdjustmentsCreated PointAdjustment[] @relation("PointAdjustmentsCreated")
  createdAt               DateTime          @default(now())
  updatedAt               DateTime          @updatedAt

  @@index([role, isActive])
}

model StudentProfile {
  id                   String                @id @default(cuid())
  userId               String                @unique
  user                 User                  @relation(fields: [userId], references: [id])
  studentId            String                @unique
  fullName             String
  gradeLevel           String
  classroom            String
  exchanges            Exchange[]
  remainders           StudentRemainder[]
  pointAdjustments     PointAdjustment[]
  remainderAdjustments RemainderAdjustment[]
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  @@index([classroom])
  @@index([gradeLevel, classroom])
}

model WasteType {
  id                   String                @id @default(cuid())
  name                 String                @unique
  itemsPerPoint        Int
  isActive             Boolean               @default(true)
  exchangeItems        ExchangeItem[]
  remainders           StudentRemainder[]
  remainderAdjustments RemainderAdjustment[]
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
}

model Exchange {
  id                String            @id @default(cuid())
  studentProfileId  String
  studentProfile    StudentProfile    @relation(fields: [studentProfileId], references: [id])
  staffUserId       String
  staffUser         User              @relation("StaffExchanges", fields: [staffUserId], references: [id])
  totalPointsEarned Int
  items             ExchangeItem[]
  pointAdjustments  PointAdjustment[]
  createdAt         DateTime          @default(now())

  @@index([studentProfileId, createdAt])
  @@index([staffUserId, createdAt])
}

model ExchangeItem {
  id                String    @id @default(cuid())
  exchangeId        String
  exchange          Exchange  @relation(fields: [exchangeId], references: [id])
  wasteTypeId       String
  wasteType         WasteType @relation(fields: [wasteTypeId], references: [id])
  itemCount         Int
  previousRemainder Int
  pointsEarned      Int
  newRemainder      Int
}

model StudentRemainder {
  id               String         @id @default(cuid())
  studentProfileId String
  studentProfile   StudentProfile @relation(fields: [studentProfileId], references: [id])
  wasteTypeId      String
  wasteType        WasteType      @relation(fields: [wasteTypeId], references: [id])
  itemCount        Int
  updatedAt        DateTime       @updatedAt

  @@unique([studentProfileId, wasteTypeId])
}

model PointAdjustment {
  id                   String                @id @default(cuid())
  studentProfileId     String
  studentProfile       StudentProfile        @relation(fields: [studentProfileId], references: [id])
  createdByUserId      String
  createdByUser        User                  @relation("PointAdjustmentsCreated", fields: [createdByUserId], references: [id])
  relatedExchangeId    String?
  relatedExchange      Exchange?             @relation(fields: [relatedExchangeId], references: [id])
  pointDelta           Int
  reason               String
  remainderAdjustments RemainderAdjustment[]
  createdAt            DateTime              @default(now())

  @@index([studentProfileId, createdAt])
}

model RemainderAdjustment {
  id                 String          @id @default(cuid())
  pointAdjustmentId  String
  pointAdjustment    PointAdjustment @relation(fields: [pointAdjustmentId], references: [id])
  studentProfileId   String
  studentProfile     StudentProfile  @relation(fields: [studentProfileId], references: [id])
  wasteTypeId        String
  wasteType          WasteType       @relation(fields: [wasteTypeId], references: [id])
  previousRemainder  Int
  newRemainder       Int
  reason             String
  createdAt          DateTime        @default(now())

  @@index([studentProfileId, wasteTypeId])
}
```

- [ ] **Step 2: Create Prisma client singleton**

Create `data/db.ts`:

```ts
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Create seed script**

Create `prisma/seed.mjs`:

```js
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const passwordHash = await bcrypt.hash("Password123!", 12);

await prisma.user.upsert({
  where: { loginName: "teacher.admin" },
  update: {
    displayName: "ครูผู้ดูแลระบบ",
    passwordHash,
    isSystemTeacher: true,
    isActive: true,
  },
  create: {
    role: UserRole.TEACHER,
    loginName: "teacher.admin",
    displayName: "ครูผู้ดูแลระบบ",
    passwordHash,
    isSystemTeacher: true,
  },
});

await prisma.user.upsert({
  where: { loginName: "staff.demo" },
  update: {
    displayName: "เจ้าหน้าที่ทดลอง",
    passwordHash,
    isActive: true,
  },
  create: {
    role: UserRole.STAFF,
    loginName: "staff.demo",
    displayName: "เจ้าหน้าที่ทดลอง",
    passwordHash,
  },
});

const wasteTypes = [
  { name: "ขวดพลาสติก", itemsPerPoint: 1 },
  { name: "ฝาขวด", itemsPerPoint: 1 },
  { name: "ฉลากพลาสติก", itemsPerPoint: 3 },
];

for (const wasteType of wasteTypes) {
  await prisma.wasteType.upsert({
    where: { name: wasteType.name },
    update: { itemsPerPoint: wasteType.itemsPerPoint, isActive: true },
    create: wasteType,
  });
}

const sampleStudents = [
  {
    studentId: "10001",
    fullName: "นักเรียน ตัวอย่างหนึ่ง",
    gradeLevel: "ม.1",
    classroom: "ม.1/1",
  },
  {
    studentId: "10002",
    fullName: "นักเรียน ตัวอย่างสอง",
    gradeLevel: "ม.1",
    classroom: "ม.1/1",
  },
  {
    studentId: "20001",
    fullName: "นักเรียน ตัวอย่างสาม",
    gradeLevel: "ม.2",
    classroom: "ม.2/1",
  },
];

for (const student of sampleStudents) {
  const user = await prisma.user.upsert({
    where: { loginName: student.studentId },
    update: {
      displayName: student.fullName,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
    },
    create: {
      role: UserRole.STUDENT,
      loginName: student.studentId,
      displayName: student.fullName,
      passwordHash,
      mustChangePassword: true,
    },
  });

  await prisma.studentProfile.upsert({
    where: { studentId: student.studentId },
    update: {
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      classroom: student.classroom,
    },
    create: {
      userId: user.id,
      studentId: student.studentId,
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      classroom: student.classroom,
    },
  });
}

await prisma.$disconnect();
```

- [ ] **Step 4: Run migration and seed**

Run:

```powershell
npm run db:migrate -- --name init
npm run db:seed
```

Expected: SQLite database is created at `prisma/dev.db`, Prisma Client is generated, and seed users exist.

- [ ] **Step 5: Commit database foundation**

Run when git is available:

```powershell
git add prisma/schema.prisma prisma/seed.mjs data/db.ts package.json package-lock.json
git commit -m "feat: add database schema and seed data"
```

Expected: commit succeeds.

## Task 3: Point Calculation Core

**Files:**
- Create: `data/rewards.ts`
- Create: `data/rewards.test.ts`

- [ ] **Step 1: Write failing calculation tests**

Create `data/rewards.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculatePointEffect } from "./rewards";

describe("calculatePointEffect", () => {
  it("awards one point per item when the rate is one", () => {
    expect(
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 5,
        itemsPerPoint: 1,
      }),
    ).toEqual({
      totalCountedItems: 5,
      pointsEarned: 5,
      newRemainder: 0,
    });
  });

  it("keeps a remainder when the item count does not complete a point", () => {
    expect(
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 2,
        itemsPerPoint: 3,
      }),
    ).toEqual({
      totalCountedItems: 2,
      pointsEarned: 0,
      newRemainder: 2,
    });
  });

  it("combines an existing remainder with new items", () => {
    expect(
      calculatePointEffect({
        previousRemainder: 2,
        itemCount: 4,
        itemsPerPoint: 3,
      }),
    ).toEqual({
      totalCountedItems: 6,
      pointsEarned: 2,
      newRemainder: 0,
    });
  });

  it("rejects invalid counts", () => {
    expect(() =>
      calculatePointEffect({
        previousRemainder: -1,
        itemCount: 1,
        itemsPerPoint: 3,
      }),
    ).toThrow("previousRemainder must be a non-negative integer");

    expect(() =>
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 0,
        itemsPerPoint: 3,
      }),
    ).toThrow("itemCount must be a positive integer");

    expect(() =>
      calculatePointEffect({
        previousRemainder: 0,
        itemCount: 1,
        itemsPerPoint: 0,
      }),
    ).toThrow("itemsPerPoint must be a positive integer");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm run test -- data/rewards.test.ts
```

Expected: FAIL because `data/rewards.ts` does not exist.

- [ ] **Step 3: Implement calculation**

Create `data/rewards.ts`:

```ts
export type PointCalculationInput = {
  previousRemainder: number;
  itemCount: number;
  itemsPerPoint: number;
};

export type PointCalculationResult = {
  totalCountedItems: number;
  pointsEarned: number;
  newRemainder: number;
};

function assertInteger(name: string, value: number, minimum: number) {
  if (!Number.isInteger(value) || value < minimum) {
    const qualifier = minimum === 0 ? "non-negative" : "positive";
    throw new Error(`${name} must be a ${qualifier} integer`);
  }
}

export function calculatePointEffect({
  previousRemainder,
  itemCount,
  itemsPerPoint,
}: PointCalculationInput): PointCalculationResult {
  assertInteger("previousRemainder", previousRemainder, 0);
  assertInteger("itemCount", itemCount, 1);
  assertInteger("itemsPerPoint", itemsPerPoint, 1);

  if (previousRemainder >= itemsPerPoint) {
    throw new Error("previousRemainder must be less than itemsPerPoint");
  }

  const totalCountedItems = previousRemainder + itemCount;

  return {
    totalCountedItems,
    pointsEarned: Math.floor(totalCountedItems / itemsPerPoint),
    newRemainder: totalCountedItems % itemsPerPoint,
  };
}
```

- [ ] **Step 4: Run calculation tests**

Run:

```powershell
npm run test -- data/rewards.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit calculation core**

Run when git is available:

```powershell
git add data/rewards.ts data/rewards.test.ts
git commit -m "feat: add recycling point calculation"
```

Expected: commit succeeds.

## Task 4: Passwords, Sessions, And Current User

**Files:**
- Create: `lib/auth/passwords.ts`
- Create: `lib/auth/passwords.test.ts`
- Create: `lib/auth/session.ts`
- Create: `lib/auth/current-user.ts`
- Create: `data/permissions.ts`

- [ ] **Step 1: Write password tests**

Create `lib/auth/passwords.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  generateInitialPassword,
  hashPassword,
  verifyPassword,
} from "./passwords";

describe("password helpers", () => {
  it("verifies a hashed password", async () => {
    const hash = await hashPassword("Password123!");
    await expect(verifyPassword("Password123!", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("generates readable initial passwords", () => {
    const password = generateInitialPassword();
    expect(password).toMatch(/^SW[0-9]{6}$/);
  });
});
```

- [ ] **Step 2: Run password tests to verify failure**

Run:

```powershell
npm run test -- lib/auth/passwords.test.ts
```

Expected: FAIL because `lib/auth/passwords.ts` does not exist.

- [ ] **Step 3: Implement password helpers**

Create `lib/auth/passwords.ts`:

```ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function generateInitialPassword() {
  const value = Math.floor(100000 + Math.random() * 900000);
  return `SW${value}`;
}
```

- [ ] **Step 4: Implement session helpers**

Create `lib/auth/session.ts`:

```ts
import "server-only";
import { UserRole } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const sessionCookieName = "school-recycling-session";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  isSystemTeacher: boolean;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSessionSecret());
    const payload = verified.payload as SessionPayload;
    return {
      userId: payload.userId,
      role: payload.role,
      isSystemTeacher: Boolean(payload.isSystemTeacher),
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
```

- [ ] **Step 5: Implement permissions**

Create `data/permissions.ts`:

```ts
import "server-only";
import { UserRole } from "@prisma/client";

export type CurrentUser = {
  id: string;
  role: UserRole;
  displayName: string;
  isSystemTeacher: boolean;
};

export function requireRole(user: CurrentUser | null, allowedRoles: UserRole[]) {
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

export function requireSystemTeacher(user: CurrentUser | null) {
  const teacher = requireRole(user, [UserRole.TEACHER]);

  if (!teacher.isSystemTeacher) {
    throw new Error("Forbidden");
  }

  return teacher;
}
```

- [ ] **Step 6: Implement current user lookup**

Create `lib/auth/current-user.ts`:

```ts
import "server-only";
import { cache } from "react";
import { prisma } from "@/data/db";
import { readSession } from "./session";

export const getCurrentUser = cache(async () => {
  const session = await readSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId, isActive: true },
    select: {
      id: true,
      role: true,
      displayName: true,
      isSystemTeacher: true,
    },
  });

  return user;
});
```

- [ ] **Step 7: Run auth tests**

Run:

```powershell
npm run test -- lib/auth/passwords.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit auth foundation**

Run when git is available:

```powershell
git add lib/auth data/permissions.ts
git commit -m "feat: add auth session foundation"
```

Expected: commit succeeds.

## Task 5: Login, Logout, And Role Redirects

**Files:**
- Create: `data/users.ts`
- Create: `app/login/actions.ts`
- Create: `app/login/page.tsx`
- Create: `app/logout/actions.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement user login lookup**

Create `data/users.ts`:

```ts
import "server-only";
import { UserRole } from "@prisma/client";
import { prisma } from "@/data/db";
import { verifyPassword } from "@/lib/auth/passwords";

export type LoginResult =
  | {
      ok: true;
      user: {
        id: string;
        role: UserRole;
        displayName: string;
        isSystemTeacher: boolean;
        mustChangePassword: boolean;
      };
    }
  | {
      ok: false;
      message: string;
    };

export async function verifyLogin(
  loginName: string,
  password: string,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { loginName },
    select: {
      id: true,
      role: true,
      displayName: true,
      passwordHash: true,
      mustChangePassword: true,
      isSystemTeacher: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return { ok: false, message: "ไม่พบบัญชีนี้หรือบัญชีถูกปิดใช้งาน" };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return { ok: false, message: "เลขประจำตัวหรือรหัสผ่านไม่ถูกต้อง" };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      role: user.role,
      displayName: user.displayName,
      isSystemTeacher: user.isSystemTeacher,
      mustChangePassword: user.mustChangePassword,
    },
  };
}
```

- [ ] **Step 2: Implement login action**

Create `app/login/actions.ts`:

```ts
"use server";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyLogin } from "@/data/users";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  loginName: z.string().min(1, "กรอกเลขประจำตัวหรือชื่อบัญชี"),
  password: z.string().min(1, "กรอกรหัสผ่าน"),
});

export type LoginFormState = {
  message: string;
};

function pathForRole(role: UserRole) {
  if (role === UserRole.STUDENT) return "/student";
  if (role === UserRole.STAFF) return "/staff";
  return "/teacher";
}

export async function loginAction(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    loginName: formData.get("loginName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const result = await verifyLogin(
    parsed.data.loginName.trim(),
    parsed.data.password,
  );

  if (!result.ok) {
    return { message: result.message };
  }

  await createSession({
    userId: result.user.id,
    role: result.user.role,
    isSystemTeacher: result.user.isSystemTeacher,
  });

  redirect(pathForRole(result.user.role));
}
```

- [ ] **Step 3: Implement logout action**

Create `app/logout/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { deleteSession } from "@/lib/auth/session";

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
```

- [ ] **Step 4: Create login page**

Create `app/login/page.tsx`:

```tsx
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-slate-50">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
        <p className="text-sm font-semibold text-emerald-700">
          ระบบสะสมแต้มขยะรีไซเคิล
        </p>
        <h1 className="mt-2 text-2xl font-bold">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-slate-600">
          นักเรียนใช้เลขประจำตัวนักเรียน ส่วนครูและเจ้าหน้าที่ใช้บัญชีที่ได้รับ
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Create login form client component**

Create `app/login/login-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { message: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">เลขประจำตัวหรือชื่อบัญชี</span>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          name="loginName"
          autoComplete="username"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">รหัสผ่าน</span>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      <button
        className="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Redirect root route by current user**

Modify `app/page.tsx`:

```tsx
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === UserRole.STUDENT) {
    redirect("/student");
  }

  if (user.role === UserRole.STAFF) {
    redirect("/staff");
  }

  redirect("/teacher");
}
```

- [ ] **Step 7: Run lint and build**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands pass.

- [ ] **Step 8: Commit login flow**

Run when git is available:

```powershell
git add data/users.ts app/login app/logout app/page.tsx
git commit -m "feat: add role-based login flow"
```

Expected: commit succeeds.

## Task 6: Shared UI Shell And Styling

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/shell/app-shell.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/stat-card.tsx`
- Create: `components/ui/data-table.tsx`

- [ ] **Step 1: Update Thai metadata**

Modify `app/layout.tsx` metadata:

```tsx
export const metadata: Metadata = {
  title: "ระบบสะสมแต้มขยะรีไซเคิล",
  description: "เว็บไซต์สะสมแต้มจากกิจกรรมรีไซเคิลของโรงเรียน",
};
```

Also set `<html lang="th">`.

- [ ] **Step 2: Replace default global theme**

Modify `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #f6f7f2;
  --foreground: #172019;
  --surface: #ffffff;
  --muted: #637064;
  --line: #dce3d8;
  --accent: #1f8a5b;
  --accent-strong: #16613f;
  --warning: #b7791f;
  --danger: #b42318;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

html {
  background: var(--background);
}

body {
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(31, 138, 91, 0.08), transparent 30%),
    var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), "Noto Sans Thai", sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

- [ ] **Step 3: Create shell component**

Create `components/shell/app-shell.tsx`:

```tsx
import Link from "next/link";
import { logoutAction } from "@/app/logout/actions";

type NavItem = {
  href: string;
  label: string;
};

export function AppShell({
  title,
  subtitle,
  navItems,
  children,
}: {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-black/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              ระบบสะสมแต้มขยะรีไซเคิล
            </p>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
          <form action={logoutAction}>
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              type="submit"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => (
            <Link
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create shared UI components**

Create `components/ui/stat-card.tsx`:

```tsx
export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-600">{detail}</p> : null}
    </section>
  );
}
```

Create `components/ui/badge.tsx`:

```tsx
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      {children}
    </span>
  );
}
```

Create `components/ui/data-table.tsx`:

```tsx
export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            {headers.map((header) => (
              <th className="px-4 py-3 font-semibold" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t border-slate-100" key={index}>
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-3" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit shared UI**

Run when git is available:

```powershell
git add app/layout.tsx app/globals.css components
git commit -m "feat: add shared app shell"
```

Expected: commit succeeds.

## Task 7: Student Dashboard And History

**Files:**
- Create: `data/students.ts`
- Create: `app/student/page.tsx`
- Create: `app/student/history/page.tsx`

- [ ] **Step 1: Implement student DTOs**

Create `data/students.ts` with these exported functions:

```ts
import "server-only";
import { UserRole } from "@prisma/client";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";

export async function getStudentDashboard(currentUser: CurrentUser | null) {
  const user = requireRole(currentUser, [UserRole.STUDENT]);

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      remainders: { include: { wasteType: true } },
      exchanges: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: { include: { wasteType: true } } },
      },
      pointAdjustments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!profile) {
    throw new Error("Student profile not found");
  }

  const exchangePoints = await prisma.exchange.aggregate({
    where: { studentProfileId: profile.id },
    _sum: { totalPointsEarned: true },
  });

  const adjustmentPoints = await prisma.pointAdjustment.aggregate({
    where: { studentProfileId: profile.id },
    _sum: { pointDelta: true },
  });

  const totalPoints =
    (exchangePoints._sum.totalPointsEarned ?? 0) +
    (adjustmentPoints._sum.pointDelta ?? 0);

  const classmates = await prisma.studentProfile.findMany({
    where: { classroom: profile.classroom },
    select: {
      id: true,
      fullName: true,
      exchanges: { select: { totalPointsEarned: true } },
      pointAdjustments: { select: { pointDelta: true } },
    },
  });

  const ranked = classmates
    .map((classmate) => ({
      id: classmate.id,
      total:
        classmate.exchanges.reduce((sum, item) => sum + item.totalPointsEarned, 0) +
        classmate.pointAdjustments.reduce((sum, item) => sum + item.pointDelta, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const classroomRank = ranked.findIndex((item) => item.id === profile.id) + 1;

  return {
    student: {
      studentId: profile.studentId,
      fullName: profile.fullName,
      gradeLevel: profile.gradeLevel,
      classroom: profile.classroom,
    },
    totalPoints,
    classroomRank,
    classroomSize: ranked.length,
    remainders: profile.remainders.map((remainder) => ({
      wasteTypeName: remainder.wasteType.name,
      itemCount: remainder.itemCount,
      itemsPerPoint: remainder.wasteType.itemsPerPoint,
    })),
    recentExchanges: profile.exchanges.map((exchange) => ({
      id: exchange.id,
      createdAt: exchange.createdAt.toISOString(),
      totalPointsEarned: exchange.totalPointsEarned,
      items: exchange.items.map((item) => ({
        wasteTypeName: item.wasteType.name,
        itemCount: item.itemCount,
        pointsEarned: item.pointsEarned,
        newRemainder: item.newRemainder,
      })),
    })),
    recentAdjustments: profile.pointAdjustments.map((adjustment) => ({
      id: adjustment.id,
      pointDelta: adjustment.pointDelta,
      reason: adjustment.reason,
      createdAt: adjustment.createdAt.toISOString(),
    })),
  };
}
```

- [ ] **Step 2: Create student dashboard page**

Create `app/student/page.tsx`:

```tsx
import { AppShell } from "@/components/shell/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { getStudentDashboard } from "@/data/students";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function StudentDashboardPage() {
  const dashboard = await getStudentDashboard(await getCurrentUser());

  return (
    <AppShell
      title="หน้าของนักเรียน"
      subtitle={`${dashboard.student.fullName} · ${dashboard.student.classroom}`}
      navItems={[
        { href: "/student", label: "แต้มของฉัน" },
        { href: "/student/history", label: "ประวัติ" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="แต้มสะสม" value={dashboard.totalPoints} detail="แต้มรวมทั้งหมด" />
        <StatCard
          label="อันดับในห้อง"
          value={`#${dashboard.classroomRank}`}
          detail={`จาก ${dashboard.classroomSize} คน`}
        />
        <StatCard
          label="เลขประจำตัว"
          value={dashboard.student.studentId}
          detail={dashboard.student.gradeLevel}
        />
      </div>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold">เศษคงค้าง</h2>
          <DataTable
            headers={["ชนิดขยะ", "เศษคงค้าง", "อัตราแต้ม"]}
            rows={dashboard.remainders.map((item) => [
              item.wasteTypeName,
              `${item.itemCount} ชิ้น`,
              `${item.itemsPerPoint} ชิ้น / 1 แต้ม`,
            ])}
          />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">ประวัติล่าสุด</h2>
          <DataTable
            headers={["วันที่", "แต้ม", "รายการ"]}
            rows={dashboard.recentExchanges.map((exchange) => [
              new Date(exchange.createdAt).toLocaleDateString("th-TH"),
              exchange.totalPointsEarned,
              exchange.items.map((item) => `${item.wasteTypeName} ${item.itemCount}`).join(", "),
            ])}
          />
        </div>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 3: Create student history page**

Create `app/student/history/page.tsx` that reuses `getStudentDashboard` and renders all recent exchanges plus adjustments with `DataTable`.

- [ ] **Step 4: Build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit student dashboard**

Run when git is available:

```powershell
git add data/students.ts app/student
git commit -m "feat: add student dashboard"
```

Expected: commit succeeds.

## Task 8: Staff Exchange Recording

**Files:**
- Create: `data/exchanges.ts`
- Create: `data/exchanges.test.ts`
- Create: `app/staff/actions.ts`
- Create: `app/staff/page.tsx`
- Create: `app/staff/exchange-form.tsx`

- [ ] **Step 1: Write exchange input validation tests**

Create `data/exchanges.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseExchangeDraft } from "./exchanges";

describe("parseExchangeDraft", () => {
  it("accepts multiple waste rows", () => {
    const parsed = parseExchangeDraft({
      studentProfileId: "student_1",
      items: [
        { wasteTypeId: "plastic_bottle", itemCount: 5 },
        { wasteTypeId: "plastic_label", itemCount: 3 },
      ],
    });

    expect(parsed.items).toHaveLength(2);
  });

  it("rejects empty item lists", () => {
    expect(() =>
      parseExchangeDraft({
        studentProfileId: "student_1",
        items: [],
      }),
    ).toThrow("เพิ่มชนิดขยะอย่างน้อย 1 รายการ");
  });
});
```

- [ ] **Step 2: Implement exchange DAL**

Create `data/exchanges.ts` with validation and transaction:

```ts
import "server-only";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";
import { calculatePointEffect } from "@/data/rewards";

const exchangeDraftSchema = z.object({
  studentProfileId: z.string().min(1),
  items: z
    .array(
      z.object({
        wasteTypeId: z.string().min(1),
        itemCount: z.number().int().positive(),
      }),
    )
    .min(1, "เพิ่มชนิดขยะอย่างน้อย 1 รายการ"),
});

export type ExchangeDraft = z.input<typeof exchangeDraftSchema>;

export function parseExchangeDraft(input: ExchangeDraft) {
  return exchangeDraftSchema.parse(input);
}

export async function createExchange(
  currentUser: CurrentUser | null,
  draft: ExchangeDraft,
) {
  const staff = requireRole(currentUser, [UserRole.STAFF]);
  const parsed = parseExchangeDraft(draft);

  return prisma.$transaction(async (tx) => {
    const wasteTypes = await tx.wasteType.findMany({
      where: {
        id: { in: parsed.items.map((item) => item.wasteTypeId) },
        isActive: true,
      },
    });

    const wasteById = new Map(wasteTypes.map((wasteType) => [wasteType.id, wasteType]));

    if (wasteById.size !== parsed.items.length) {
      throw new Error("พบชนิดขยะที่ไม่เปิดใช้งาน");
    }

    const calculatedItems = [];
    let totalPointsEarned = 0;

    for (const item of parsed.items) {
      const wasteType = wasteById.get(item.wasteTypeId);

      if (!wasteType) {
        throw new Error("ไม่พบชนิดขยะ");
      }

      const existingRemainder = await tx.studentRemainder.findUnique({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: item.wasteTypeId,
          },
        },
      });

      const previousRemainder = existingRemainder?.itemCount ?? 0;
      const effect = calculatePointEffect({
        previousRemainder,
        itemCount: item.itemCount,
        itemsPerPoint: wasteType.itemsPerPoint,
      });

      totalPointsEarned += effect.pointsEarned;
      calculatedItems.push({
        wasteTypeId: item.wasteTypeId,
        itemCount: item.itemCount,
        previousRemainder,
        pointsEarned: effect.pointsEarned,
        newRemainder: effect.newRemainder,
      });
    }

    const exchange = await tx.exchange.create({
      data: {
        studentProfileId: parsed.studentProfileId,
        staffUserId: staff.id,
        totalPointsEarned,
        items: { create: calculatedItems },
      },
    });

    for (const item of calculatedItems) {
      await tx.studentRemainder.upsert({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: item.wasteTypeId,
          },
        },
        update: { itemCount: item.newRemainder },
        create: {
          studentProfileId: parsed.studentProfileId,
          wasteTypeId: item.wasteTypeId,
          itemCount: item.newRemainder,
        },
      });
    }

    return { exchangeId: exchange.id, totalPointsEarned };
  });
}
```

- [ ] **Step 3: Run exchange tests**

Run:

```powershell
npm run test -- data/exchanges.test.ts
```

Expected: PASS.

- [ ] **Step 4: Implement staff action**

Create `app/staff/actions.ts` with a `createExchangeAction` that reads `studentProfileId`, `wasteTypeId[]`, and `itemCount[]` from `FormData`, converts counts with `Number`, calls `createExchange(await getCurrentUser(), draft)`, and redirects to `/staff?created=1`.

- [ ] **Step 5: Implement staff page and client form**

Create `app/staff/page.tsx` as a Server Component that loads active waste types and a searchable student list from `data/students.ts`. Create `app/staff/exchange-form.tsx` as a Client Component that supports multiple rows, shows a review panel before submit, and posts to `createExchangeAction`.

- [ ] **Step 6: Verify staff workflow**

Run:

```powershell
npm run lint
npm run test -- data/exchanges.test.ts data/rewards.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit staff exchange workflow**

Run when git is available:

```powershell
git add data/exchanges.ts data/exchanges.test.ts app/staff
git commit -m "feat: add staff exchange workflow"
```

Expected: commit succeeds.

## Task 9: Point And Remainder Adjustments

**Files:**
- Create: `data/adjustments.ts`
- Create: `data/adjustments.test.ts`
- Modify: `app/staff/actions.ts`
- Create: `app/staff/adjustments/page.tsx`

- [ ] **Step 1: Write adjustment validation tests**

Create `data/adjustments.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parsePointAdjustmentDraft } from "./adjustments";

describe("parsePointAdjustmentDraft", () => {
  it("rejects a blank reason", () => {
    expect(() =>
      parsePointAdjustmentDraft({
        studentProfileId: "student_1",
        pointDelta: 1,
        reason: " ",
        remainderAdjustments: [],
      }),
    ).toThrow("กรอกเหตุผลการปรับแก้");
  });

  it("rejects zero point delta without a remainder adjustment", () => {
    expect(() =>
      parsePointAdjustmentDraft({
        studentProfileId: "student_1",
        pointDelta: 0,
        reason: "แก้รายการ",
        remainderAdjustments: [],
      }),
    ).toThrow("ต้องมีการเปลี่ยนแต้มหรือเศษคงค้าง");
  });
});
```

- [ ] **Step 2: Implement adjustment DAL**

Create `data/adjustments.ts`:

```ts
import "server-only";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/data/db";
import { requireRole, type CurrentUser } from "@/data/permissions";

const remainderAdjustmentSchema = z.object({
  wasteTypeId: z.string().min(1),
  newRemainder: z.number().int().min(0),
});

const pointAdjustmentSchema = z.object({
  studentProfileId: z.string().min(1),
  relatedExchangeId: z.string().min(1).optional(),
  pointDelta: z.number().int(),
  reason: z.string().trim().min(1, "กรอกเหตุผลการปรับแก้"),
  remainderAdjustments: z.array(remainderAdjustmentSchema),
});

export type PointAdjustmentDraft = z.input<typeof pointAdjustmentSchema>;

export function parsePointAdjustmentDraft(input: PointAdjustmentDraft) {
  const parsed = pointAdjustmentSchema.parse(input);

  if (parsed.pointDelta === 0 && parsed.remainderAdjustments.length === 0) {
    throw new Error("ต้องมีการเปลี่ยนแต้มหรือเศษคงค้าง");
  }

  return parsed;
}

export async function createPointAdjustment(
  currentUser: CurrentUser | null,
  draft: PointAdjustmentDraft,
) {
  const staff = requireRole(currentUser, [UserRole.STAFF]);
  const parsed = parsePointAdjustmentDraft(draft);

  return prisma.$transaction(async (tx) => {
    const adjustment = await tx.pointAdjustment.create({
      data: {
        studentProfileId: parsed.studentProfileId,
        createdByUserId: staff.id,
        relatedExchangeId: parsed.relatedExchangeId,
        pointDelta: parsed.pointDelta,
        reason: parsed.reason,
      },
    });

    for (const remainder of parsed.remainderAdjustments) {
      const wasteType = await tx.wasteType.findUniqueOrThrow({
        where: { id: remainder.wasteTypeId },
      });

      if (remainder.newRemainder >= wasteType.itemsPerPoint) {
        throw new Error("เศษคงค้างใหม่ต้องน้อยกว่าอัตราแต้ม");
      }

      const existing = await tx.studentRemainder.findUnique({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: remainder.wasteTypeId,
          },
        },
      });

      await tx.remainderAdjustment.create({
        data: {
          pointAdjustmentId: adjustment.id,
          studentProfileId: parsed.studentProfileId,
          wasteTypeId: remainder.wasteTypeId,
          previousRemainder: existing?.itemCount ?? 0,
          newRemainder: remainder.newRemainder,
          reason: parsed.reason,
        },
      });

      await tx.studentRemainder.upsert({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: parsed.studentProfileId,
            wasteTypeId: remainder.wasteTypeId,
          },
        },
        update: { itemCount: remainder.newRemainder },
        create: {
          studentProfileId: parsed.studentProfileId,
          wasteTypeId: remainder.wasteTypeId,
          itemCount: remainder.newRemainder,
        },
      });
    }

    return { adjustmentId: adjustment.id };
  });
}
```

- [ ] **Step 3: Run adjustment tests**

Run:

```powershell
npm run test -- data/adjustments.test.ts
```

Expected: PASS.

- [ ] **Step 4: Add staff adjustment action and page**

Modify `app/staff/actions.ts` to export `createPointAdjustmentAction`. Create `app/staff/adjustments/page.tsx` with a staff-only form for student, point delta, reason, and optional remainder corrections.

- [ ] **Step 5: Verify adjustment workflow**

Run:

```powershell
npm run lint
npm run test -- data/adjustments.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit adjustments**

Run when git is available:

```powershell
git add data/adjustments.ts data/adjustments.test.ts app/staff
git commit -m "feat: add auditable point adjustments"
```

Expected: commit succeeds.

## Task 10: Student Import For Teachers

**Files:**
- Create: `data/import-students.ts`
- Create: `data/import-students.test.ts`
- Modify: `data/students.ts`
- Create: `app/teacher/actions.ts`
- Create: `app/teacher/students/page.tsx`

- [ ] **Step 1: Write import parser tests**

Create `data/import-students.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseStudentRows } from "./import-students";

describe("parseStudentRows", () => {
  it("parses required student columns", () => {
    const result = parseStudentRows([
      {
        "เลขประจำตัวนักเรียน": "10001",
        "ชื่อ-นามสกุล": "นักเรียน ทดสอบ",
        "ระดับชั้น": "ม.1",
        "ห้องเรียน": "ม.1/1",
      },
    ]);

    expect(result.validRows).toEqual([
      {
        studentId: "10001",
        fullName: "นักเรียน ทดสอบ",
        gradeLevel: "ม.1",
        classroom: "ม.1/1",
      },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("reports missing student IDs", () => {
    const result = parseStudentRows([
      {
        "เลขประจำตัวนักเรียน": "",
        "ชื่อ-นามสกุล": "นักเรียน ทดสอบ",
        "ระดับชั้น": "ม.1",
        "ห้องเรียน": "ม.1/1",
      },
    ]);

    expect(result.validRows).toEqual([]);
    expect(result.errors[0]?.message).toBe("แถว 1: กรอกเลขประจำตัวนักเรียน");
  });
});
```

- [ ] **Step 2: Implement import parser**

Create `data/import-students.ts`:

```ts
import { read, utils } from "xlsx";

export type ImportedStudentRow = {
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
};

export type ImportError = {
  rowNumber: number;
  message: string;
};

function value(row: Record<string, unknown>, key: string) {
  return String(row[key] ?? "").trim();
}

export function parseStudentRows(rows: Record<string, unknown>[]) {
  const validRows: ImportedStudentRow[] = [];
  const errors: ImportError[] = [];
  const seenStudentIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const studentId = value(row, "เลขประจำตัวนักเรียน");
    const fullName = value(row, "ชื่อ-นามสกุล");
    const gradeLevel = value(row, "ระดับชั้น");
    const classroom = value(row, "ห้องเรียน");

    if (!studentId) {
      errors.push({ rowNumber, message: `แถว ${rowNumber}: กรอกเลขประจำตัวนักเรียน` });
      return;
    }

    if (!fullName || !gradeLevel || !classroom) {
      errors.push({ rowNumber, message: `แถว ${rowNumber}: กรอกข้อมูลนักเรียนให้ครบ` });
      return;
    }

    if (seenStudentIds.has(studentId)) {
      errors.push({ rowNumber, message: `แถว ${rowNumber}: เลขประจำตัวนักเรียนซ้ำในไฟล์` });
      return;
    }

    seenStudentIds.add(studentId);
    validRows.push({ studentId, fullName, gradeLevel, classroom });
  });

  return { validRows, errors };
}

export async function parseStudentFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });

  return parseStudentRows(rows);
}
```

- [ ] **Step 3: Run import parser tests**

Run:

```powershell
npm run test -- data/import-students.test.ts
```

Expected: PASS.

- [ ] **Step 4: Add persistence function**

Modify `data/students.ts` to export `importStudents(currentUser, rows)`. It must require `UserRole.TEACHER`, reject existing `studentId` values, create a user per row with `mustChangePassword: true`, generate an initial password with `generateInitialPassword`, hash it, create `StudentProfile`, and return a list of `{ studentId, fullName, initialPassword }` for one-time teacher export.

- [ ] **Step 5: Add teacher import action and page**

Create `app/teacher/actions.ts` with `importStudentsAction`. Create `app/teacher/students/page.tsx` with a file upload form accepting `.csv,.xlsx,.xls`, validation result display, and generated initial password table.

- [ ] **Step 6: Verify import flow**

Run:

```powershell
npm run lint
npm run test -- data/import-students.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit student import**

Run when git is available:

```powershell
git add data/import-students.ts data/import-students.test.ts data/students.ts app/teacher
git commit -m "feat: add teacher student import"
```

Expected: commit succeeds.

## Task 11: Teacher Reports And Charts

**Files:**
- Create: `data/reports.ts`
- Create: `components/charts/teacher-charts.tsx`
- Create: `app/teacher/page.tsx`
- Create: `app/teacher/rankings/page.tsx`

- [ ] **Step 1: Implement report DTOs**

Create `data/reports.ts` with `getTeacherDashboard(currentUser)` that requires teacher role and returns:

```ts
export type TeacherDashboardDto = {
  totals: {
    students: number;
    exchanges: number;
    points: number;
    itemCount: number;
  };
  classroomBars: Array<{
    classroom: string;
    points: number;
    items: number;
  }>;
  wasteTypePie: Array<{
    wasteTypeName: string;
    itemCount: number;
  }>;
  recentExchanges: Array<{
    id: string;
    studentName: string;
    classroom: string;
    totalPointsEarned: number;
    createdAt: string;
  }>;
};
```

Use Prisma queries over `StudentProfile`, `Exchange`, `ExchangeItem`, and `WasteType`. Return plain serializable objects only.

- [ ] **Step 2: Create chart component**

Create `components/charts/teacher-charts.tsx`:

```tsx
"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#1f8a5b", "#2563eb", "#d97706", "#be123c", "#6d28d9", "#0f766e"];

export function TeacherCharts({
  classroomBars,
  wasteTypePie,
}: {
  classroomBars: Array<{ classroom: string; points: number; items: number }>;
  wasteTypePie: Array<{ wasteTypeName: string; itemCount: number }>;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">เปรียบเทียบตามห้องเรียน</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={classroomBars}>
              <XAxis dataKey="classroom" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#1f8a5b" name="แต้ม" />
              <Bar dataKey="items" fill="#2563eb" name="จำนวนชิ้น" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">สัดส่วนชนิดขยะ</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                data={wasteTypePie}
                dataKey="itemCount"
                nameKey="wasteTypeName"
                outerRadius={105}
                label
              >
                {wasteTypePie.map((entry, index) => (
                  <Cell fill={colors[index % colors.length]} key={entry.wasteTypeName} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create teacher dashboard page**

Create `app/teacher/page.tsx` that uses `AppShell`, `StatCard`, `TeacherCharts`, and `DataTable` to show totals, bar chart, pie chart, and recent exchanges.

- [ ] **Step 4: Create rankings page**

Create `app/teacher/rankings/page.tsx` with classroom filter links and a table of rank, student ID, name, classroom, and total points.

- [ ] **Step 5: Verify charts build**

Run:

```powershell
npm run lint
npm run build
```

Expected: PASS. Recharts should be isolated to the client component.

- [ ] **Step 6: Commit teacher reports**

Run when git is available:

```powershell
git add data/reports.ts components/charts app/teacher/page.tsx app/teacher/rankings
git commit -m "feat: add teacher reports and charts"
```

Expected: commit succeeds.

## Task 12: Waste Rules And Adult Account Management

**Files:**
- Modify: `data/users.ts`
- Create: `data/waste-types.ts`
- Modify: `app/teacher/actions.ts`
- Create: `app/teacher/waste-types/page.tsx`
- Create: `app/teacher/accounts/page.tsx`

- [ ] **Step 1: Implement waste type DAL**

Create `data/waste-types.ts` with functions:

```ts
import "server-only";
import { prisma } from "@/data/db";
import { requireSystemTeacher, type CurrentUser } from "@/data/permissions";

export async function listWasteTypes() {
  return prisma.wasteType.findMany({ orderBy: { name: "asc" } });
}

export async function createWasteType(
  currentUser: CurrentUser | null,
  input: { name: string; itemsPerPoint: number },
) {
  requireSystemTeacher(currentUser);

  if (!input.name.trim()) {
    throw new Error("กรอกชื่อชนิดขยะ");
  }

  if (!Number.isInteger(input.itemsPerPoint) || input.itemsPerPoint < 1) {
    throw new Error("อัตราแต้มต้องเป็นจำนวนเต็มบวก");
  }

  return prisma.wasteType.create({
    data: {
      name: input.name.trim(),
      itemsPerPoint: input.itemsPerPoint,
    },
  });
}

export async function setWasteTypeActive(
  currentUser: CurrentUser | null,
  wasteTypeId: string,
  isActive: boolean,
) {
  requireSystemTeacher(currentUser);
  return prisma.wasteType.update({
    where: { id: wasteTypeId },
    data: { isActive },
  });
}
```

- [ ] **Step 2: Add adult account functions**

Modify `data/users.ts` to add `createAdultAccount(currentUser, input)`. It must require system teacher, allow only `STAFF` or `TEACHER`, hash a generated initial password, and return the generated password once.

- [ ] **Step 3: Add teacher actions**

Modify `app/teacher/actions.ts` to export:

- `createWasteTypeAction`
- `deactivateWasteTypeAction`
- `createAdultAccountAction`

Each action must call `getCurrentUser()`, parse `FormData`, delegate to the DAL, and redirect back to the relevant teacher route.

- [ ] **Step 4: Create waste type management page**

Create `app/teacher/waste-types/page.tsx` with a system-teacher-only form for name and items per point plus a table of active and inactive waste types.

- [ ] **Step 5: Create account management page**

Create `app/teacher/accounts/page.tsx` with a system-teacher-only form for display name, login name, and role, plus a table of adult accounts.

- [ ] **Step 6: Verify management routes**

Run:

```powershell
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit management pages**

Run when git is available:

```powershell
git add data/users.ts data/waste-types.ts app/teacher
git commit -m "feat: add teacher administration pages"
```

Expected: commit succeeds.

## Task 13: Authorization Review And End-To-End Verification

**Files:**
- Modify as needed: files from previous tasks

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm run verify
```

Expected: lint, tests, and build all pass.

- [ ] **Step 2: Start the local dev server**

Run:

```powershell
npm run dev
```

Expected: Next.js serves the app on a local URL such as `http://localhost:3000`.

- [ ] **Step 3: Browser-check role flows**

Use the in-app browser to verify:

- Login as `teacher.admin` with `Password123!` reaches `/teacher`.
- Login as `staff.demo` with `Password123!` reaches `/staff`.
- Login as `10001` with `Password123!` reaches `/student`.
- Student cannot open `/teacher`.
- Staff cannot open `/teacher/waste-types`.
- Teacher dashboard shows stat cards, bar chart, pie chart, and recent exchange table.

- [ ] **Step 4: Browser-check responsive views**

Use desktop and mobile viewport checks for:

- `/student`
- `/staff`
- `/teacher`
- `/teacher/students`

Expected: text does not overlap, charts remain readable, tables scroll horizontally instead of breaking layout.

- [ ] **Step 5: Commit verification fixes**

Run when git is available:

```powershell
git add .
git commit -m "fix: polish mvp verification issues"
```

Expected: commit succeeds when verification changes were required.

## Final Acceptance Criteria

- `npm run verify` passes.
- Seed data creates one system teacher, one staff user, three sample students, and three initial waste types.
- Students can log in with student ID and view total points, classroom rank, remainders, and history.
- Staff can record one exchange with multiple waste types and the system updates points and remainders.
- Staff can create auditable point and remainder adjustments with a reason.
- Teachers can import students from CSV or Excel and see generated initial passwords once.
- Teachers can view reports with summary cards, classroom bar chart, waste-type pie chart, rankings, and recent exchanges.
- System teacher can manage waste rules and adult accounts.
- Unauthorized users are blocked by server-side checks, not only hidden UI.

# Cursor Task Context: Bulk Student Import For 1000+ Students

## Project Context

Project: `สว รย รักษ์โลกและสิ่งแวดล้อม`

Stack:
- Next.js 16 App Router
- Prisma 6
- Supabase Postgres on Render deployment
- Vitest
- Tailwind CSS

Important repo rule:
- Read relevant Next.js 16 docs in `node_modules/next/dist/docs/` before changing App Router, Server Actions, or forms.
- Do not assume older Next.js behavior.
- Keep changes scoped. Do not refactor unrelated student/account/reporting logic.

Recent known state:
- Version 1.2 was completed and pushed in commit `383866a`.
- Teacher dashboard now supports monthly and academic-term reporting.
- Waste rules now support `itemsPerPoint` and `pointsPerUnit`.
- `npm run verify` passed after that work.

## Problem

The current student import flow is not ideal for importing 1000+ students in one file.

Current behavior:
- Teacher uploads CSV/XLSX.
- System parses rows in `data/import-students.ts`.
- Teacher previews valid rows.
- On confirm, `data/students.ts#importStudents` loops through rows one by one.
- Each student creates:
  - one `User`
  - one `StudentProfile`
  - one password hash from `Password123!`

Risk with 1000 students:
- Long request time on Render.
- Possible request timeout.
- If timeout happens mid-loop, some students may already be created while others are not.
- Hashing the same default password 1000 times is unnecessary and slow.
- The UI does not show progress or partial-failure detail after confirm.

## Current Relevant Files

Read these before editing:
- `data/import-students.ts`
  - Parses CSV/XLSX rows.
  - Validates required columns and duplicate student IDs in the uploaded file.
- `data/students.ts`
  - Contains `findExistingStudentIds`.
  - Contains `importStudents`.
  - Current import logic loops per row.
- `app/teacher/actions.ts`
  - Contains `previewImportStudentsAction`.
  - Contains `confirmImportStudentsAction`.
- `app/teacher/students/page.tsx`
  - Student import UI entry point.
- `lib/auth/passwords.ts`
  - `defaultStudentInitialPassword`
  - `hashPassword`
- Tests likely to update:
  - `data/import-students.test.ts`
  - `data/student-profile.test.ts`
  - Add or update tests around `importStudents` if missing.

## Goal

Make student import safer and faster for 1000+ students while preserving the existing teacher workflow.

The first version of this task should keep the current UI shape:
1. Upload file.
2. Preview.
3. Confirm import.
4. Show created accounts and the shared initial password.

Do not introduce a queue/background worker unless explicitly approved later.

## Recommended Implementation

### 1. Hash the default student password once

Current slow pattern:
- `hashPassword(initialPassword)` inside the student loop.

Target:
- Compute `const passwordHash = await hashPassword(defaultStudentInitialPassword);`
- Reuse that hash for every imported student in the same import.

This is acceptable because the product decision is that all imported students share the same initial password: `Password123!`.

### 2. Use one Prisma transaction for the import

Wrap import in `prisma.$transaction(async (tx) => { ... })`.

Inside the transaction:
- Re-check existing student IDs from the submitted rows.
- If any already exist, throw before creating anything.
- Create users and student profiles in a controlled way.

Preferred safe approach:
- Keep per-row create inside the transaction at first.
- This keeps student profile linked to the newly created user ID.
- It prevents partial imports if any row fails.

Avoid premature `createMany` unless you also design a reliable way to map created users back to student IDs. Simplicity and correctness are more important than maximum speed for version 1.

### 3. Add a maximum import guidance or guard

Recommended:
- Allow up to `1500` rows in one import.
- If file exceeds that, return a clear validation error.

Reason:
- School has about 1200 students.
- 1500 gives enough headroom.
- It prevents accidental giant files.

Implement in parsing or action layer, not in UI only.

### 4. Improve result message

Keep `created` result structure compatible:

```ts
Array<{
  studentId: string;
  fullName: string;
  initialPassword: string;
}>
```

But ensure the message tells the teacher:
- imported count
- initial password is the same for all students

Do not expose password hashes.

## Acceptance Criteria

Functional:
- Importing 1000 valid students creates 1000 users and 1000 student profiles.
- All imported users use `loginName = studentId`.
- All imported users have `mustChangePassword = true`.
- All imported users use the same initial password value shown to the teacher: `Password123!`.
- Duplicate student IDs in the file still fail during preview.
- Student IDs already existing in the database still fail before import.
- If a duplicate is detected during confirm, no new students are partially created.

Performance:
- The default password is hashed only once per import.
- The import runs in one transaction to avoid partial writes.

Security:
- Never return or export password hashes.
- Do not log initial passwords or hashes to console.
- Keep authorization in Server Actions and data functions.

UX:
- Existing preview/confirm flow remains usable.
- Error messages stay clear for non-technical teachers.
- Mobile layout should not regress.

Verification:
- Run `npm run db:generate` if Prisma types are touched.
- Run targeted tests for import/student logic.
- Run `npm run verify`.

## Suggested Tests

Add tests around `importStudents` with mocked Prisma and password hash behavior.

Minimum tests:

1. `importStudents hashes the shared initial password once`
   - Arrange 3 valid rows.
   - Mock `hashPassword`.
   - Expect `hashPassword` called once with `Password123!`.

2. `importStudents creates each user and student profile in one transaction`
   - Arrange rows.
   - Mock transaction callback.
   - Expect user/profile creation uses transaction client.

3. `importStudents rejects existing student ids before creating records`
   - Arrange existing student ID.
   - Expect rejection.
   - Expect no user/profile create calls.

4. `parseStudentRows rejects files above the agreed import limit`
   - If the limit is implemented in parser.
   - Otherwise test the action/helper where the limit lives.

## Non-Goals

Do not do these in this task:
- Do not build background jobs.
- Do not add Redis or queues.
- Do not change login logic.
- Do not change student initial password value.
- Do not change academic year reset logic.
- Do not rewrite the whole student management page.
- Do not migrate to Supabase Auth.

## Notes For Cursor

Be careful with Thai text in older files. Some existing files may display mojibake in PowerShell, but the app has been compiling. Prefer targeted code changes around ASCII identifiers when possible.

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run verify
```

Before claiming completion, verify with:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run verify
```


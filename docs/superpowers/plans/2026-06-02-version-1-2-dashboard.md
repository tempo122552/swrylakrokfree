# Version 1.2 Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add flexible waste point rules, month/semester teacher dashboard summaries, and a polished mobile-friendly dashboard experience.

**Architecture:** Keep calculations in `data/rewards.ts`, reporting aggregation in `data/reports.ts`, and teacher-controlled term setup in a small `data/academic-terms.ts` module. Use Prisma migrations so Render can apply schema changes with `prisma migrate deploy`.

**Tech Stack:** Next.js App Router, React Server Components, Server Actions, Prisma, Supabase Postgres, Vitest, Tailwind CSS, Recharts.

---

### Task 1: Point Rule Tests

**Files:**
- Modify: `data/rewards.test.ts`
- Modify: `data/waste-types.test.ts`

- [ ] Add a failing test showing `itemCount: 1`, `itemsPerPoint: 1`, `pointsPerUnit: 300` earns 300 points.
- [ ] Add a failing validation test showing `pointsPerUnit` must be a positive integer.
- [ ] Add a failing reactivation test showing an inactive waste type updates both `itemsPerPoint` and `pointsPerUnit`.
- [ ] Run `npm test -- data/rewards.test.ts data/waste-types.test.ts` and confirm RED.

### Task 2: Schema And Calculation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*_add_points_per_unit_and_academic_terms/migration.sql`
- Modify: `data/rewards.ts`
- Modify: `data/waste-types.ts`
- Modify: `data/exchanges.ts`
- Modify: `prisma/seed.mjs`
- Modify: `prisma/bootstrap-production.mjs`

- [ ] Add `WasteType.pointsPerUnit Int @default(1)`.
- [ ] Add `AcademicTerm` with name, start/end dates, active status, and an index on the date range.
- [ ] Multiply complete units by `pointsPerUnit` in the point calculator.
- [ ] Pass `pointsPerUnit` through waste type creation, reactivation, exchange creation, seed, and bootstrap.
- [ ] Run targeted tests and confirm GREEN.

### Task 3: Dashboard Period Tests

**Files:**
- Modify: `data/reports.test.ts`
- Create: `data/academic-terms.test.ts`

- [ ] Add tests for month period parsing, including a previous month.
- [ ] Add tests for academic term date validation.
- [ ] Add a dashboard view test that shows period-filtered totals and a clear period label.
- [ ] Run `npm test -- data/reports.test.ts data/academic-terms.test.ts` and confirm RED before implementation.

### Task 4: Reporting And Terms

**Files:**
- Create: `data/academic-terms.ts`
- Modify: `data/reports.ts`
- Modify: `app/teacher/actions.ts`
- Create: `app/teacher/terms/page.tsx`
- Modify: `lib/navigation.ts`

- [ ] Implement academic term listing and creation for system teachers.
- [ ] Implement month and term period parsing for teacher reports.
- [ ] Filter exchange, exchange item, and adjustment totals by the selected period.
- [ ] Add a teacher nav entry for academic terms.
- [ ] Revalidate `/teacher` and `/teacher/terms` after term changes.

### Task 5: UI Polish

**Files:**
- Modify: `app/teacher/page.tsx`
- Modify: `components/charts/teacher-charts.tsx`
- Modify: `app/teacher/waste-types/page.tsx`
- Modify: `app/staff/exchange-form.tsx`

- [ ] Add period controls above teacher dashboard summary cards.
- [ ] Make stat cards describe the selected report period.
- [ ] Improve chart empty states and mobile sizing.
- [ ] Update waste type form and staff preview copy to show `itemsPerPoint` and `pointsPerUnit`.
- [ ] Keep controls at 44px minimum height and use existing radius, colors, and button vocabulary.

### Task 6: Verification And Shipping

**Files:**
- Verify whole project.

- [ ] Run `npm run db:generate`.
- [ ] Run targeted tests.
- [ ] Run `npm run verify`.
- [ ] Review `git diff`.
- [ ] Commit and push after verification passes.

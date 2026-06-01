# School Recycling Rewards Design

Date: 2026-05-31

## Summary

Build a Next.js full-stack MVP for a school recycling rewards website. Students bring recyclable waste to school, staff record the exchange, and the system converts item counts into reward points. Students can log in online to see their own accumulated points, classroom rank, item remainders, and recent exchange history.

The system has three primary account roles: student, staff, and teacher. A system teacher is a teacher with extra permissions, not a fourth role.

## Goals

- Let students log in with their student ID and password.
- Let teachers import student data for the whole school from CSV or Excel.
- Let staff record a single exchange containing multiple waste types.
- Calculate points from item counts according to waste rules set by the system teacher.
- Track remainders per student and waste type when an item count does not yet complete a point.
- Show students their total points, classroom rank, remainders, and recent exchange history.
- Give teachers reports, classroom rankings, and student management tools.
- Keep point and remainder changes auditable through adjustment records instead of silent deletion.

## Non-Goals For This MVP

- No reward redemption or prize inventory.
- No school-wide public leaderboard beyond teacher reports.
- No student email, phone number, birthday, or other sensitive profile data.
- No separate backend service at the start.
- No staff ability to create or change waste rules.

## Domain Language

Use the terms defined in `CONTEXT.md`. The most important terms for this design are:

- นักเรียน: the student account owner who earns and views points.
- เลขประจำตัวนักเรียน: the login identifier for students.
- เจ้าหน้าที่: the school user who records waste exchanges.
- ครู: the school user who manages students and views reports.
- ครูผู้ดูแลระบบ: a teacher with extra permissions to manage staff, teachers, and waste rules.
- การแลกขยะ: the event where a student submits recyclable waste and receives points.
- รายการแลกขยะ: one recorded exchange for one student, containing one or more waste types.
- ชนิดขยะ: a recyclable waste type accepted by the school.
- อัตราแต้ม: how many items of a waste type are needed for one point.
- เศษคงค้าง: submitted item counts that do not yet complete a point.
- อันดับห้องเรียน: rank within the same classroom by total accumulated points.

## Roles And Permissions

### Student

Students can:

- Log in with student ID and password.
- View their total points.
- View their classroom rank.
- View remainders by waste type.
- View recent exchange history and point adjustments that affect them.

Students cannot:

- Add points to themselves.
- See other students' private history.
- Manage waste rules, accounts, or student data.

### Staff

Staff can:

- Search for students by student ID, name, grade level, or classroom.
- Create an exchange for one student with multiple waste item rows.
- Preview calculated points and new remainders before confirming.
- Create point adjustment records with a required reason when mistakes happen.

Staff cannot:

- Import or bulk edit student accounts.
- Change waste rules.
- Create teacher or staff accounts.

### Teacher

Teachers can:

- Import student data from CSV or Excel.
- Add or edit individual student records.
- Delete mistakenly imported student records only when they have no exchange, remainder, or adjustment history.
- View reports and classroom rankings.
- View exchange and adjustment history for oversight.

Teachers cannot:

- Record waste exchanges in the MVP.
- Change waste rules unless they are system teachers.
- Create staff or teacher accounts unless they are system teachers.

### System Teacher

A system teacher can:

- Create and manage teacher and staff accounts.
- Assign the shared initial password `Password123!` to newly created adult accounts, with first-login password change required.
- Manage waste types and point rates.
- Deactivate waste types that should no longer be used.

The system teacher is still a teacher role with extra permissions.

## Main Workflows

### Student Import

1. Teacher uploads a CSV or Excel file.
2. System validates required columns: student ID, full name, grade level, classroom.
3. System rejects duplicate student IDs in the file or existing database unless the teacher chooses an explicit update flow.
4. System creates student accounts with the shared initial password `Password123!`.
5. Teacher views the shared initial password for distribution.
6. Students are prompted to change the initial password after first login.

### Waste Exchange

1. Staff searches for and selects one student.
2. Staff adds one or more waste rows, each with waste type and item count.
3. System calculates points using the student's existing remainder for each waste type.
4. System shows a review step with student identity, classroom, item counts, points earned, and new remainders.
5. Staff confirms the exchange.
6. System records the exchange, exchange items, point total effect, and updated remainders.

Example:

- Existing plastic-label remainder: 2 items.
- New plastic labels submitted: 4 items.
- Rate: 3 items per 1 point.
- Total counted items: 6.
- Points earned: 2.
- New remainder: 0.

### Point Adjustment

1. Staff selects an exchange or student record that needs correction.
2. Staff enters the point effect, any remainder effect by waste type, and required reason.
3. System records the adjustment with staff identity and timestamp.
4. Teacher reports show original exchanges, point adjustments, and remainder adjustments.

Adjustments are additive audit records. The system does not silently delete or overwrite historical point or remainder effects.

### Student Dashboard

After login, the student sees:

- Total accumulated points.
- Classroom rank.
- Remainders by waste type.
- Recent exchange history.
- Any point adjustments that affect their total.

### Teacher Reporting

Teacher reports include:

- Total points by classroom.
- Student rankings filtered by classroom.
- Recent exchanges.
- Adjustment history.
- Waste type contribution summaries.
- Bar charts for comparing classroom totals, such as total points or total submitted item counts by classroom.
- Pie charts for showing the share of exchanges by waste type, such as how much came from bottles, caps, and plastic labels.
- Time-based charts for exchange activity by day, week, or month when enough history exists.

## Technical Architecture

Use Next.js 16 App Router in one full-stack project. Keep route files in `app/` and shared application code in top-level folders such as `components/`, `data/`, and `lib/`.

Use Server Components by default for pages that read data. Use Client Components only where browser interaction is needed, such as:

- Dynamic multi-row waste exchange form.
- Review-before-confirm interaction.
- CSV or Excel import preview.
- Interactive teacher report charts.
- Form error display with pending state.

Use Server Actions for form mutations. Each Server Action must re-check authentication and authorization. Do not rely only on page-level guards.

Create a server-only Data Access Layer for reads, writes, DTO creation, and permission checks. Pages and components should receive safe DTOs instead of raw database records.

## Routes

Suggested route structure:

- `/login`: shared login page.
- `/student`: student dashboard.
- `/student/history`: full student exchange history.
- `/staff`: staff exchange workspace.
- `/staff/adjustments`: point adjustment workspace.
- `/teacher`: teacher overview report.
- `/teacher/students`: student import and student management.
- `/teacher/rankings`: classroom rankings.
- `/teacher/waste-types`: system teacher waste rule management.
- `/teacher/accounts`: system teacher staff and teacher account management.

Unauthorized users should be redirected to `/login` or shown a permission error depending on context.

## Data Model

### User

Represents an account that can log in.

Fields:

- `id`
- `role`: `student`, `staff`, or `teacher`
- `loginName`: student ID for students, staff or teacher username for adults
- `passwordHash`
- `mustChangePassword`
- `isSystemTeacher`
- `isActive`
- `createdAt`
- `updatedAt`

Constraints:

- `loginName` is unique.
- Only teacher users can have `isSystemTeacher = true`.

### StudentProfile

Represents school-specific student data.

Fields:

- `id`
- `userId`
- `studentId`
- `fullName`
- `gradeLevel`
- `classroom`
- `createdAt`
- `updatedAt`

Constraints:

- `studentId` is unique.
- `userId` is unique.

### WasteType

Represents one accepted waste type.

Fields:

- `id`
- `name`
- `itemsPerPoint`
- `isActive`
- `createdAt`
- `updatedAt`

Constraints:

- `itemsPerPoint` must be a positive integer.
- Staff can only record active waste types.

Initial examples:

- ขวดพลาสติก: 1 item per point.
- ฝาขวด: 1 item per point.
- ฉลากพลาสติก: 3 items per point.

### Exchange

Represents one confirmed exchange for one student.

Fields:

- `id`
- `studentProfileId`
- `staffUserId`
- `totalPointsEarned`
- `createdAt`

### ExchangeItem

Represents one waste type row inside an exchange.

Fields:

- `id`
- `exchangeId`
- `wasteTypeId`
- `itemCount`
- `previousRemainder`
- `pointsEarned`
- `newRemainder`

Constraints:

- `itemCount` must be a positive integer.

### StudentRemainder

Tracks remainders per student and waste type.

Fields:

- `id`
- `studentProfileId`
- `wasteTypeId`
- `itemCount`
- `updatedAt`

Constraints:

- Unique pair: `studentProfileId`, `wasteTypeId`.
- `itemCount` is always greater than or equal to zero and less than the current `itemsPerPoint` for that waste type after each exchange.

### PointAdjustment

Represents an auditable correction to points.

Fields:

- `id`
- `studentProfileId`
- `createdByUserId`
- `relatedExchangeId`
- `pointDelta`
- `reason`
- `createdAt`

Constraints:

- `reason` is required.
- `pointDelta` cannot be zero.

### RemainderAdjustment

Represents an auditable correction to a student's remainder for one waste type.

Fields:

- `id`
- `pointAdjustmentId`
- `studentProfileId`
- `wasteTypeId`
- `previousRemainder`
- `newRemainder`
- `reason`
- `createdAt`

Constraints:

- `reason` is required.
- `newRemainder` must be greater than or equal to zero and less than the current `itemsPerPoint` for that waste type.

## Point Calculation

For each exchange item:

1. Read the student's existing remainder for that waste type.
2. Add the new submitted item count.
3. Calculate `pointsEarned = floor(totalItems / itemsPerPoint)`.
4. Calculate `newRemainder = totalItems % itemsPerPoint`.
5. Store previous remainder, points earned, and new remainder on the exchange item.
6. Update the student's remainder row.

Student total points are calculated from confirmed exchanges plus point adjustments. Current remainders are read from `StudentRemainder`, which is updated by exchanges and any remainder adjustments. The implementation may cache totals later, but the source of truth remains exchange and adjustment records.

## Authentication And Security

- Use password hashing for all accounts.
- Store only password hashes, never plain-text passwords.
- Students log in with student ID and password.
- Adult users log in with their assigned account name and password.
- Imported students use the shared initial password `Password123!` and must change it on first login.
- Newly created staff and teacher accounts also use `Password123!` as the initial password and must change it on first login.
- Password hashes are stored instead of plain-text passwords.
- Server Actions must validate input and re-check role permissions.
- The Data Access Layer must return minimal DTOs for client rendering.
- Student pages must only return data for the current student.
- Teacher and staff pages must not expose password hashes or internal fields.
- Import files must be validated before records are created.

## Error Handling

- Import shows row-level validation errors for missing required fields and duplicate student IDs.
- Exchange form blocks inactive waste types and non-positive item counts.
- Review step recalculates on the server before confirmation so stale client values cannot grant wrong points.
- Adjustment form requires a non-empty reason.
- Corrections that change item-count outcomes must also update affected remainders through auditable remainder adjustments.
- Unauthorized actions return a permission error and make no changes.

## UI Direction

The interface should feel like a practical school operations tool, not a marketing landing page. It should be calm, clear, and fast for repeated use.

Student screens can be friendlier and more celebratory, with emphasis on total points and classroom rank. Staff screens should be dense and efficient, optimized for quickly searching students and entering item counts. Teacher screens should prioritize tables, filters, import validation, and classroom summaries.

Teacher reports should combine tables with charts. Use bar charts when comparing classrooms or periods, pie charts when showing the distribution of waste types, and compact summary cards for key totals. Charts should always have readable labels and table-backed data nearby so the report remains useful even when the chart is hard to read on small screens.

Use responsive layouts for mobile because students are likely to check points from phones.

## Test Plan

Unit-level tests:

- Point calculation with exact multiples.
- Point calculation with remainders.
- Multiple waste types in one exchange.
- Existing remainder plus new items.
- Adjustment totals.
- Remainder adjustment after correcting a mistaken exchange.
- Duplicate student ID validation.

Authorization tests:

- Student cannot access teacher or staff actions.
- Staff cannot change waste rules.
- Teacher cannot record exchanges in the MVP.
- Only system teacher can manage adult accounts and waste rules.

Workflow tests:

- Import valid student file.
- Reject import rows with missing required fields.
- Delete a mistakenly imported student with no history, and block deletion when exchange, remainder, or adjustment history exists.
- Create exchange with review step.
- Create adjustment with required reason.
- Render student dashboard with total points, rank, remainders, and history.
- Render teacher report charts from exchange data.

UI checks:

- Responsive student dashboard on mobile.
- Staff exchange form remains usable with several waste rows.
- Teacher tables do not overflow on common desktop and tablet widths.
- Teacher bar and pie charts remain readable on desktop, tablet, and mobile widths.

## Implementation Notes

- Read the relevant Next.js 16 docs before changing route, form, auth, or data-access code.
- Prefer Server Components and Server Actions where they fit.
- Keep authorization close to the Data Access Layer and inside mutations.
- Use active/inactive flags for accounts and waste types instead of deleting records that affect history. Hard-delete students only when the account has no exchange, remainder, or adjustment records.
- Keep the MVP focused on point accumulation and reporting. Reward redemption can be a later project.

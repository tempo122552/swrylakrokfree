# Version 1.2 Teacher Dashboard Design

## Goal

Version 1.2 makes the teacher dashboard useful for real reporting periods and supports high-value waste rules such as an old mobile phone worth 300 points.

## Approved Decisions

- Waste point rules have two numbers: `itemsPerPoint` and `pointsPerUnit`.
- Existing remainder behavior stays the same. Remainders still count items waiting to complete the next point unit.
- Monthly reporting uses a month picker so teachers can view the current month or any previous month.
- Semester reporting uses teacher-defined date ranges because semester length changes each school year.
- Teacher dashboard defaults to the current month to keep the first view practical and fast.

## Data Model

`WasteType` gains `pointsPerUnit`, defaulting to `1` so existing rules keep working.

`AcademicTerm` stores a report period:

- `name`
- `startsAt`
- `endsAt`
- `isActive`

Terms are used only by server-side Prisma queries. The project does not expose the new table through a Supabase client or public Data API.

## User Experience

The teacher dashboard gets a compact report-period control above the summary cards:

- Month mode with a native month input.
- Semester mode with a select list of active terms.
- Clear period label in the summary area.

Waste type management gets a second numeric input, "points per unit", so staff can configure examples like:

- Plastic bottle: 1 item per unit, 1 point per unit.
- Plastic label: 3 items per unit, 1 point per unit.
- Old mobile phone: 1 item per unit, 300 points per unit.

The dashboard remains a product UI: restrained color, dense information, mobile-first controls, and no decorative hero treatment.

## Testing

- Unit-test the point calculator with multi-point units.
- Unit-test waste type validation and reactivation updates.
- Unit-test report period parsing for current month, custom months, and academic terms.
- Run Prisma generate, lint, tests, and build before shipping.

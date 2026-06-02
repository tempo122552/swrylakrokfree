ALTER TABLE "WasteType" ADD COLUMN "pointsPerUnit" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "AcademicTerm" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcademicTerm_startsAt_endsAt_idx" ON "AcademicTerm"("startsAt", "endsAt");

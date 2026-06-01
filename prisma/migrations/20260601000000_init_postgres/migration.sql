-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'STAFF', 'TEACHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "loginName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isSystemTeacher" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "classroom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemsPerPoint" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "totalPointsEarned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeItem" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "previousRemainder" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "newRemainder" INTEGER NOT NULL,

    CONSTRAINT "ExchangeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRemainder" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRemainder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointAdjustment" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "relatedExchangeId" TEXT,
    "pointDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemainderAdjustment" (
    "id" TEXT NOT NULL,
    "pointAdjustmentId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "previousRemainder" INTEGER NOT NULL,
    "newRemainder" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemainderAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginName_key" ON "User"("loginName");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "StudentProfile"("studentId");

-- CreateIndex
CREATE INDEX "StudentProfile_classroom_idx" ON "StudentProfile"("classroom");

-- CreateIndex
CREATE INDEX "StudentProfile_gradeLevel_classroom_idx" ON "StudentProfile"("gradeLevel", "classroom");

-- CreateIndex
CREATE UNIQUE INDEX "WasteType_name_key" ON "WasteType"("name");

-- CreateIndex
CREATE INDEX "Exchange_studentProfileId_createdAt_idx" ON "Exchange"("studentProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "Exchange_staffUserId_createdAt_idx" ON "Exchange"("staffUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRemainder_studentProfileId_wasteTypeId_key" ON "StudentRemainder"("studentProfileId", "wasteTypeId");

-- CreateIndex
CREATE INDEX "PointAdjustment_studentProfileId_createdAt_idx" ON "PointAdjustment"("studentProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "RemainderAdjustment_studentProfileId_wasteTypeId_idx" ON "RemainderAdjustment"("studentProfileId", "wasteTypeId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeItem" ADD CONSTRAINT "ExchangeItem_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeItem" ADD CONSTRAINT "ExchangeItem_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRemainder" ADD CONSTRAINT "StudentRemainder_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRemainder" ADD CONSTRAINT "StudentRemainder_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointAdjustment" ADD CONSTRAINT "PointAdjustment_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointAdjustment" ADD CONSTRAINT "PointAdjustment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointAdjustment" ADD CONSTRAINT "PointAdjustment_relatedExchangeId_fkey" FOREIGN KEY ("relatedExchangeId") REFERENCES "Exchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemainderAdjustment" ADD CONSTRAINT "RemainderAdjustment_pointAdjustmentId_fkey" FOREIGN KEY ("pointAdjustmentId") REFERENCES "PointAdjustment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemainderAdjustment" ADD CONSTRAINT "RemainderAdjustment_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemainderAdjustment" ADD CONSTRAINT "RemainderAdjustment_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

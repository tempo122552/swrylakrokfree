import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const bootstrapPassword = process.env.BOOTSTRAP_PASSWORD || "Password123!";
const passwordHash = await bcrypt.hash(bootstrapPassword, 12);

async function ensureAccount({
  loginName,
  displayName,
  role,
  isSystemTeacher = false,
}) {
  const existing = await prisma.user.findUnique({ where: { loginName } });

  if (existing) {
    await prisma.user.update({
      where: { loginName },
      data: {
        displayName,
        isActive: true,
        ...(role === UserRole.TEACHER ? { isSystemTeacher } : {}),
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      role,
      loginName,
      displayName,
      passwordHash,
      isSystemTeacher,
    },
  });
}

await ensureAccount({
  role: UserRole.TEACHER,
  loginName: "teacher.admin",
  displayName: "ครูผู้ดูแลระบบ",
  isSystemTeacher: true,
});

await ensureAccount({
  role: UserRole.STAFF,
  loginName: "staff.demo",
  displayName: "เจ้าหน้าที่ทดลอง",
});

const wasteTypes = [
  { name: "ขวดพลาสติก", itemsPerPoint: 1, pointsPerUnit: 1 },
  { name: "ฝาขวด", itemsPerPoint: 1, pointsPerUnit: 1 },
  { name: "ฉลากพลาสติก", itemsPerPoint: 3, pointsPerUnit: 1 },
];

for (const wasteType of wasteTypes) {
  await prisma.wasteType.upsert({
    where: { name: wasteType.name },
    update: {
      itemsPerPoint: wasteType.itemsPerPoint,
      pointsPerUnit: wasteType.pointsPerUnit,
      isActive: true,
    },
    create: wasteType,
  });
}

await prisma.$disconnect();

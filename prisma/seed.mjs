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

const existingExchangeCount = await prisma.exchange.count();

if (existingExchangeCount === 0) {
  const staffUser = await prisma.user.findUnique({
    where: { loginName: "staff.demo" },
  });
  const studentsById = new Map(
    (
      await prisma.studentProfile.findMany({
        where: { studentId: { in: sampleStudents.map((student) => student.studentId) } },
      })
    ).map((student) => [student.studentId, student]),
  );
  const wasteTypesByName = new Map(
    (
      await prisma.wasteType.findMany({
        where: { name: { in: wasteTypes.map((wasteType) => wasteType.name) } },
      })
    ).map((wasteType) => [wasteType.name, wasteType]),
  );

  if (!staffUser) {
    throw new Error("Demo staff account was not created");
  }

  const demoExchanges = [
    {
      studentId: "10001",
      minutesAgo: 180,
      items: [
        { wasteTypeName: wasteTypes[0].name, itemCount: 8 },
        { wasteTypeName: wasteTypes[1].name, itemCount: 12 },
        { wasteTypeName: wasteTypes[2].name, itemCount: 7 },
      ],
    },
    {
      studentId: "10002",
      minutesAgo: 90,
      items: [
        { wasteTypeName: wasteTypes[0].name, itemCount: 5 },
        { wasteTypeName: wasteTypes[2].name, itemCount: 3 },
      ],
    },
    {
      studentId: "20001",
      minutesAgo: 30,
      items: [
        { wasteTypeName: wasteTypes[0].name, itemCount: 10 },
        { wasteTypeName: wasteTypes[1].name, itemCount: 4 },
        { wasteTypeName: wasteTypes[2].name, itemCount: 6 },
      ],
    },
  ];

  for (const demoExchange of demoExchanges) {
    const student = studentsById.get(demoExchange.studentId);

    if (!student) {
      throw new Error(`Missing demo student ${demoExchange.studentId}`);
    }

    const calculatedItems = [];
    let totalPointsEarned = 0;

    for (const item of demoExchange.items) {
      const wasteType = wasteTypesByName.get(item.wasteTypeName);

      if (!wasteType) {
        throw new Error(`Missing demo waste type ${item.wasteTypeName}`);
      }

      const existingRemainder = await prisma.studentRemainder.findUnique({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: student.id,
            wasteTypeId: wasteType.id,
          },
        },
      });
      const previousRemainder = existingRemainder?.itemCount ?? 0;
      const combinedItems = previousRemainder + item.itemCount;
      const pointsEarned =
        Math.floor(combinedItems / wasteType.itemsPerPoint) * wasteType.pointsPerUnit;
      const newRemainder = combinedItems % wasteType.itemsPerPoint;

      totalPointsEarned += pointsEarned;
      calculatedItems.push({
        wasteTypeId: wasteType.id,
        itemCount: item.itemCount,
        previousRemainder,
        pointsEarned,
        newRemainder,
      });
    }

    const exchange = await prisma.exchange.create({
      data: {
        studentProfileId: student.id,
        staffUserId: staffUser.id,
        totalPointsEarned,
        createdAt: new Date(Date.now() - demoExchange.minutesAgo * 60 * 1000),
        items: { create: calculatedItems },
      },
    });

    for (const item of calculatedItems) {
      await prisma.studentRemainder.upsert({
        where: {
          studentProfileId_wasteTypeId: {
            studentProfileId: student.id,
            wasteTypeId: item.wasteTypeId,
          },
        },
        update: { itemCount: item.newRemainder },
        create: {
          studentProfileId: student.id,
          wasteTypeId: item.wasteTypeId,
          itemCount: item.newRemainder,
        },
      });
    }

    console.log(
      `Seeded demo exchange ${exchange.id} for ${demoExchange.studentId} (${totalPointsEarned} points)`,
    );
  }
}

await prisma.$disconnect();

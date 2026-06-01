import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { getClassroomRankings } from "@/data/reports";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";

export default async function TeacherRankingsPage() {
  const currentUser = await requirePageRole([UserRole.TEACHER]);
  const rankings = await getClassroomRankings(currentUser);
  const rankByClassroom = new Map<string, number>();

  return (
    <AppShell
      title="อันดับห้องเรียน"
      subtitle="จัดอันดับนักเรียนในห้องเรียนเดียวกันตามแต้มสะสม"
      navItems={teacherNavItems}
    >
      <DataTable
        headers={["อันดับ", "เลขประจำตัว", "ชื่อ-นามสกุล", "ห้องเรียน", "แต้ม"]}
        rows={rankings.map((student) => {
          const nextRank = (rankByClassroom.get(student.classroom) ?? 0) + 1;
          rankByClassroom.set(student.classroom, nextRank);
          return [
            `#${nextRank}`,
            student.studentId,
            student.fullName,
            student.classroom,
            student.totalPoints,
          ];
        })}
      />
    </AppShell>
  );
}

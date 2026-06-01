import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { listAdultAccounts } from "@/data/users";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { teacherNavItems } from "@/lib/navigation";
import { AccountForm } from "./account-form";

export default async function TeacherAccountsPage() {
  const currentUser = await requirePageRole([UserRole.TEACHER], {
    systemTeacher: true,
  });
  const accounts = await listAdultAccounts(currentUser);

  return (
    <AppShell
      title="บัญชีเจ้าหน้าที่และครู"
      subtitle="เฉพาะครูผู้ดูแลระบบเท่านั้น"
      navItems={teacherNavItems}
    >
      <AccountForm />
      <section className="mt-6">
        <DataTable
          headers={["ชื่อบัญชี", "ชื่อที่แสดง", "บทบาท", "สิทธิ์", "สถานะ"]}
          rows={accounts.map((account) => [
            account.loginName,
            account.displayName,
            account.role === UserRole.TEACHER ? "ครู" : "เจ้าหน้าที่",
            account.isSystemTeacher ? "ครูผู้ดูแลระบบ" : "-",
            <Badge key={account.id} tone={account.isActive ? "emerald" : "slate"}>
              {account.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
            </Badge>,
          ])}
        />
      </section>
    </AppShell>
  );
}

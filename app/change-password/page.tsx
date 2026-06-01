import { UserRole } from "@prisma/client";
import { ProjectLogo } from "@/components/brand/project-logo";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const user = await requirePageRole(
    [UserRole.STUDENT, UserRole.STAFF, UserRole.TEACHER],
    { allowMustChangePassword: true },
  );

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-white/70 bg-white p-8 shadow-2xl">
        <ProjectLogo priority size="md" />
        <p className="mt-5 text-sm font-black text-emerald-700">
          สว รย รักษ์โลกและสิ่งแวดล้อม
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">
          เปลี่ยนรหัสผ่าน
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {user.mustChangePassword
            ? "บัญชีนี้ยังใช้รหัสผ่านเริ่มต้น กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งาน"
            : "ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ"}
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}

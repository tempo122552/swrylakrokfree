import { ProjectLogo } from "@/components/brand/project-logo";
import { projectName } from "@/lib/brand";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-white/70 bg-white shadow-2xl md:grid-cols-[1fr_0.9fr]">
        <div className="bg-emerald-900 p-8 text-white">
          <ProjectLogo priority size="lg" />
          <h1 className="mt-8 max-w-sm text-4xl font-black leading-tight tracking-normal">
            เปลี่ยนขยะรีไซเคิลให้เป็นแต้มของนักเรียน
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-emerald-50">
            นักเรียนดูแต้มสะสม เจ้าหน้าที่บันทึกการแลกขยะ และครูติดตามภาพรวมของห้องเรียนได้ในที่เดียว
          </p>
          <dl className="mt-10 grid gap-3 text-sm">
            <div className="rounded-lg bg-white/10 p-3">
              <dt className="font-black">นักเรียนทดลอง</dt>
              <dd>10001 / Password123!</dd>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <dt className="font-black">เจ้าหน้าที่ทดลอง</dt>
              <dd>staff.demo / Password123!</dd>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <dt className="font-black">ครูผู้ดูแลระบบ</dt>
              <dd>teacher.admin / Password123!</dd>
            </div>
          </dl>
        </div>
        <div className="p-8">
          <p className="text-sm font-black text-emerald-700">{projectName}</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            นักเรียนใช้เลขประจำตัวนักเรียน ส่วนครูและเจ้าหน้าที่ใช้บัญชีที่ได้รับ
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

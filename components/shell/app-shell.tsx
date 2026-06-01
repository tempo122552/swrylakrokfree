import { LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/logout/actions";
import { ProjectLogo } from "@/components/brand/project-logo";
import { projectName } from "@/lib/brand";

type NavItem = {
  href: string;
  label: string;
};

export function AppShell({
  title,
  subtitle,
  navItems,
  children,
}: {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
          <div className="flex items-center gap-3">
            <ProjectLogo />
            <div className="min-w-0">
              <p className="text-sm font-black text-emerald-700">
                {projectName}
              </p>
              <h1 className="truncate text-xl font-black tracking-normal text-slate-950 sm:text-2xl">
                {title}
              </h1>
              <p className="line-clamp-2 text-sm text-slate-600 sm:line-clamp-none">
                {subtitle}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-auto"
              type="submit"
            >
              <LogOut aria-hidden size={16} />
              ออกจากระบบ
            </button>
          </form>
        </div>
        <div className="relative border-t border-slate-200/70 sm:border-t-0">
          <nav
            aria-label="เมนูหลัก"
            className="mobile-menu-scroll mx-auto flex w-full max-w-7xl snap-x gap-2 overflow-x-auto overscroll-x-contain px-3 py-2 sm:px-4 sm:py-3"
          >
            {navItems.map((item) => (
              <Link
                className="min-h-10 shrink-0 snap-start whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/95 to-transparent sm:hidden"
          />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}

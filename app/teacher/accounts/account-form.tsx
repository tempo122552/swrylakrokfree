"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { createAdultAccountAction } from "../actions";

const initialState = { message: "", initialPassword: undefined as string | undefined };

export function AccountForm() {
  const [state, formAction, pending] = useActionState(
    createAdultAccountAction,
    initialState,
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black">สร้างบัญชีครู/เจ้าหน้าที่</h2>
      <form action={formAction} className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="rounded-md border border-slate-300 px-3 py-2" name="loginName" placeholder="ชื่อบัญชี" required />
        <input className="rounded-md border border-slate-300 px-3 py-2" name="displayName" placeholder="ชื่อที่แสดง" required />
        <select className="rounded-md border border-slate-300 px-3 py-2" name="role">
          <option value="STAFF">เจ้าหน้าที่</option>
          <option value="TEACHER">ครู</option>
        </select>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">
          <input name="isSystemTeacher" type="checkbox" />
          ครูผู้ดูแลระบบ
        </label>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-black text-white disabled:opacity-60 md:col-span-2"
          disabled={pending}
        >
          <UserPlus aria-hidden size={18} />
          สร้างบัญชี
        </button>
      </form>
      {state.message ? (
        <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
          {state.message}
          {state.initialPassword ? ` · รหัสผ่านเริ่มต้น: ${state.initialPassword}` : ""}
        </p>
      ) : null}
    </section>
  );
}

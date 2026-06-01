"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { message: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-bold">เลขประจำตัวหรือชื่อบัญชี</span>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          name="loginName"
          autoComplete="username"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold">รหัสผ่าน</span>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      ) : null}
      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        <LogIn aria-hidden size={18} />
        {pending ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}

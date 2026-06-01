"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "./actions";

const initialState: ChangePasswordState = { message: "" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-bold">รหัสผ่านเดิม</span>
        <input
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          name="currentPassword"
          required
          type="password"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold">รหัสผ่านใหม่</span>
        <input
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          minLength={8}
          name="newPassword"
          required
          type="password"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold">ยืนยันรหัสผ่านใหม่</span>
        <input
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          minLength={8}
          name="confirmPassword"
          required
          type="password"
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
        <KeyRound aria-hidden size={18} />
        {pending ? "กำลังบันทึก" : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}

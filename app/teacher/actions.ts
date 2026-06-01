"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseStudentFile, parseStudentRows } from "@/data/import-students";
import {
  findExistingStudentIds,
  importStudents,
  resetTeacherStudentPassword,
  updateTeacherStudentProfile,
} from "@/data/students";
import { createAdultAccount } from "@/data/users";
import { createWasteType, setWasteTypeActive } from "@/data/waste-types";
import { getCurrentUser } from "@/lib/auth/current-user";

type StudentPreviewRow = {
  studentId: string;
  fullName: string;
  gradeLevel: string;
  classroom: string;
};

export type ImportStudentsState = {
  message: string;
  errors: Array<{ rowNumber: number; message: string }>;
  previewRows: StudentPreviewRow[];
  created: Array<{ studentId: string; fullName: string; initialPassword: string }>;
};

export type UpdateStudentProfileState = {
  message: string;
};

export type ResetStudentPasswordState = {
  message: string;
  initialPassword?: string;
  studentId?: string;
};

export async function previewImportStudentsAction(
  _state: ImportStudentsState,
  formData: FormData,
): Promise<ImportStudentsState> {
  const file = formData.get("studentFile");

  if (!(file instanceof File) || file.size === 0) {
    return {
      message: "เลือกไฟล์ CSV หรือ Excel",
      errors: [],
      previewRows: [],
      created: [],
    };
  }

  const firstPass = await parseStudentFile(file);
  const existingStudentIds = await findExistingStudentIds(
    firstPass.validRows.map((row) => row.studentId),
  );
  const parsed =
    existingStudentIds.size > 0
      ? await parseStudentFile(file, { existingStudentIds })
      : firstPass;

  if (parsed.validRows.length === 0 && parsed.errors.length === 0) {
    return {
      message: "ไม่พบข้อมูลนักเรียนในไฟล์",
      errors: [],
      previewRows: [],
      created: [],
    };
  }

  if (parsed.errors.length > 0) {
    return {
      message: `ตรวจพบข้อผิดพลาด ${parsed.errors.length} รายการ`,
      errors: parsed.errors,
      previewRows: parsed.validRows,
      created: [],
    };
  }

  return {
    message: `ตรวจสอบแล้ว พร้อมนำเข้า ${parsed.validRows.length} คน`,
    errors: [],
    previewRows: parsed.validRows,
    created: [],
  };
}

export async function confirmImportStudentsAction(
  _state: ImportStudentsState,
  formData: FormData,
): Promise<ImportStudentsState> {
  const studentIds = formData.getAll("studentId").map(String);
  const fullNames = formData.getAll("fullName").map(String);
  const gradeLevels = formData.getAll("gradeLevel").map(String);
  const classrooms = formData.getAll("classroom").map(String);

  const rows = studentIds.map((studentId, index) => ({
    "เลขประจำตัวนักเรียน": studentId,
    "ชื่อ-นามสกุล": fullNames[index] ?? "",
    "ระดับชั้น": gradeLevels[index] ?? "",
    "ห้องเรียน": classrooms[index] ?? "",
  }));
  const existingStudentIds = await findExistingStudentIds(studentIds);
  const parsed = parseStudentRows(rows, { existingStudentIds });

  if (parsed.validRows.length === 0) {
    return {
      message: parsed.errors.length
        ? `ตรวจพบข้อผิดพลาด ${parsed.errors.length} รายการ`
        : "ไม่มีข้อมูลสำหรับนำเข้า",
      errors: parsed.errors,
      previewRows: [],
      created: [],
    };
  }

  if (parsed.errors.length > 0) {
    return {
      message: `ตรวจพบข้อผิดพลาด ${parsed.errors.length} รายการ`,
      errors: parsed.errors,
      previewRows: parsed.validRows,
      created: [],
    };
  }

  try {
    const created = await importStudents(await getCurrentUser(), parsed.validRows);
    revalidatePath("/teacher/students");
    return {
      message: `นำเข้า ${created.length} คนสำเร็จ`,
      errors: [],
      previewRows: [],
      created,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "นำเข้าไม่สำเร็จ",
      errors: [],
      previewRows: parsed.validRows,
      created: [],
    };
  }
}

export async function updateStudentProfileAction(
  _state: UpdateStudentProfileState,
  formData: FormData,
): Promise<UpdateStudentProfileState> {
  const studentProfileId = String(formData.get("studentProfileId") ?? "");
  let redirectTo = "/teacher/students";

  try {
    const updated = await updateTeacherStudentProfile(
      await getCurrentUser(),
      studentProfileId,
      {
        studentId: String(formData.get("studentId") ?? ""),
        fullName: String(formData.get("fullName") ?? ""),
        gradeLevel: String(formData.get("gradeLevel") ?? ""),
        classroom: String(formData.get("classroom") ?? ""),
        isActive: formData.get("isActive") === "on",
      },
    );

    revalidatePath("/teacher/students");
    revalidatePath(`/teacher/students/${encodeURIComponent(updated.previousStudentId)}`);
    revalidatePath(`/teacher/students/${encodeURIComponent(updated.studentId)}`);
    redirectTo = `/teacher/students/${encodeURIComponent(updated.studentId)}?updated=1`;
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "แก้ไขข้อมูลนักเรียนไม่สำเร็จ",
    };
  }

  redirect(redirectTo);
}

export async function resetStudentPasswordAction(
  _state: ResetStudentPasswordState,
  formData: FormData,
): Promise<ResetStudentPasswordState> {
  try {
    const reset = await resetTeacherStudentPassword(
      await getCurrentUser(),
      String(formData.get("studentProfileId") ?? ""),
    );

    revalidatePath("/teacher/students");
    revalidatePath(`/teacher/students/${encodeURIComponent(reset.studentId)}`);

    return {
      message: `รีเซ็ตรหัสผ่านของ ${reset.fullName} แล้ว`,
      initialPassword: reset.initialPassword,
      studentId: reset.studentId,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "รีเซ็ตรหัสผ่านนักเรียนไม่สำเร็จ",
    };
  }
}

export async function createWasteTypeAction(formData: FormData) {
  await createWasteType(await getCurrentUser(), {
    name: String(formData.get("name") ?? ""),
    itemsPerPoint: Number(formData.get("itemsPerPoint") ?? 0),
  });
  revalidatePath("/teacher/waste-types");
  redirect("/teacher/waste-types?created=1");
}

export async function deactivateWasteTypeAction(formData: FormData) {
  await setWasteTypeActive(
    await getCurrentUser(),
    String(formData.get("wasteTypeId") ?? ""),
    false,
  );
  revalidatePath("/teacher/waste-types");
  redirect("/teacher/waste-types");
}

export async function createAdultAccountAction(
  _state: { message: string; initialPassword?: string },
  formData: FormData,
) {
  try {
    const roleValue = String(formData.get("role") ?? "STAFF");
    const created = await createAdultAccount(await getCurrentUser(), {
      loginName: String(formData.get("loginName") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      role: roleValue === "TEACHER" ? UserRole.TEACHER : UserRole.STAFF,
      isSystemTeacher: formData.get("isSystemTeacher") === "on",
    });
    revalidatePath("/teacher/accounts");
    return {
      message: `สร้างบัญชี ${created.loginName} สำเร็จ`,
      initialPassword: created.initialPassword,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "สร้างบัญชีไม่สำเร็จ",
    };
  }
}

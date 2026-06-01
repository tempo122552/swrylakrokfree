import { UserRole } from "@prisma/client";
import * as XLSX from "xlsx";
import { getStudentImportTemplateRows } from "@/data/import-students";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (currentUser.role !== UserRole.TEACHER || currentUser.mustChangePassword) {
    return new Response("Forbidden", { status: 403 });
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(getStudentImportTemplateRows());

  XLSX.utils.book_append_sheet(workbook, worksheet, "ข้อมูลนักเรียน");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  const filename = "template-นำเข้านักเรียน.xlsx";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="student-import-template.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

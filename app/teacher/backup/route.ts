import { UserRole } from "@prisma/client";
import * as XLSX from "xlsx";
import { getTeacherBackupWorkbookData } from "@/data/backups";
import { projectName } from "@/lib/brand";
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

  const workbookData = await getTeacherBackupWorkbookData(currentUser);
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, workbookData.summary, "สรุป");
  appendSheet(workbook, workbookData.users, "บัญชีผู้ใช้");
  appendSheet(workbook, workbookData.students, "นักเรียน");
  appendSheet(workbook, workbookData.wasteTypes, "ชนิดขยะ");
  appendSheet(workbook, workbookData.exchanges, "รายการแลก");
  appendSheet(workbook, workbookData.exchangeItems, "รายการย่อย");
  appendSheet(workbook, workbookData.studentRemainders, "เศษคงค้าง");
  appendSheet(workbook, workbookData.pointAdjustments, "ปรับแต้ม");
  appendSheet(workbook, workbookData.remainderAdjustments, "ปรับเศษ");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  const filename = `${projectName}-backup.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="swry-environment-backup.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

function appendSheet(
  workbook: XLSX.WorkBook,
  rows: Array<Record<string, string | number>>,
  sheetName: string,
) {
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows),
    sheetName,
  );
}

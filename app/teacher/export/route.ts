import { UserRole } from "@prisma/client";
import * as XLSX from "xlsx";
import { getTeacherExportWorkbookData } from "@/data/reports";
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

  const workbookData = await getTeacherExportWorkbookData(currentUser);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookData.students),
    "นักเรียน",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookData.exchanges),
    "รายการแลกขยะ",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookData.classroomRankings),
    "อันดับห้องเรียน",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookData.wasteTypeSummary),
    "สรุปชนิดขยะ",
  );

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  const filename = "สว รย รักษ์โลกและสิ่งแวดล้อม.xlsx";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="swry-environment.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

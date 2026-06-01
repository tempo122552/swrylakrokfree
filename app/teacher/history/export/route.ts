import { UserRole } from "@prisma/client";
import * as XLSX from "xlsx";
import {
  buildTeacherExchangeHistoryExportWorkbookData,
  getTeacherExchangeHistory,
} from "@/data/exchange-history";
import { projectName } from "@/lib/brand";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (currentUser.role !== UserRole.TEACHER || currentUser.mustChangePassword) {
    return new Response("Forbidden", { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const history = await getTeacherExchangeHistory(currentUser, {
    q: searchParams.get("q") ?? undefined,
    classroom: searchParams.get("classroom") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });
  const workbookData = buildTeacherExchangeHistoryExportWorkbookData({
    filters: history.filters,
    rows: history.rows,
  });
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookData.summary),
    "สรุปตัวกรอง",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(workbookData.exchanges),
    "ประวัติการแลกแต้ม",
  );

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  const filename = `${projectName}-ประวัติการแลกแต้ม.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="swry-exchange-history.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

import * as XLSX from "xlsx";
import {
  buildStudentImportResultRows,
  type ImportedStudentAccount,
} from "@/data/import-students";

export const studentImportResultSheetName = "ข้อมูลนักเรียน";

export function buildStudentImportResultFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");

  return `บัญชีนักเรียน-${stamp}.xlsx`;
}

export function buildStudentImportResultWorkbook(accounts: ImportedStudentAccount[]) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(
    buildStudentImportResultRows(accounts),
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, studentImportResultSheetName);

  return workbook;
}

export function downloadStudentImportResultXlsx(accounts: ImportedStudentAccount[]) {
  const workbook = buildStudentImportResultWorkbook(accounts);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = buildStudentImportResultFilename();
  link.click();
  URL.revokeObjectURL(url);
}

import { describe, expect, it } from "vitest";
import {
  countStudentSearchMatches,
  filterStudentOptions,
  type StudentOption,
} from "./student-search";

const students: StudentOption[] = [
  {
    id: "student_1",
    studentId: "10001",
    fullName: "นักเรียน ตัวอย่างหนึ่ง",
    classroom: "ม.1/1",
  },
  {
    id: "student_2",
    studentId: "10002",
    fullName: "นักเรียน ตัวอย่างสอง",
    classroom: "ม.1/2",
  },
  {
    id: "student_3",
    studentId: "20001",
    fullName: "สมชาย รักษ์โลก",
    classroom: "ม.2/1",
  },
];

describe("filterStudentOptions", () => {
  it("finds students by student ID", () => {
    expect(filterStudentOptions(students, "10001")).toEqual([students[0]]);
  });

  it("finds students by name or classroom", () => {
    expect(filterStudentOptions(students, "รักษ์โลก")).toEqual([students[2]]);
    expect(filterStudentOptions(students, "ม.1")).toEqual([
      students[0],
      students[1],
    ]);
  });

  it("limits broad results", () => {
    expect(filterStudentOptions(students, "นักเรียน", 1)).toEqual([students[0]]);
    expect(countStudentSearchMatches(students, "นักเรียน")).toBe(2);
  });

  it("returns the first options when the query is blank", () => {
    expect(filterStudentOptions(students, " ", 2)).toEqual([
      students[0],
      students[1],
    ]);
  });
});

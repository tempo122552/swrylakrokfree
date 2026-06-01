export type StudentOption = {
  id: string;
  studentId: string;
  fullName: string;
  classroom: string;
};

export function normalizeStudentSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("th-TH");
}

export function filterStudentOptions(
  students: StudentOption[],
  query: string,
  limit = 12,
) {
  const normalizedQuery = normalizeStudentSearchValue(query);

  if (!normalizedQuery) {
    return students.slice(0, limit);
  }

  return students
    .filter((student) =>
      [student.studentId, student.fullName, student.classroom]
        .map(normalizeStudentSearchValue)
        .some((value) => value.includes(normalizedQuery)),
    )
    .slice(0, limit);
}

export function countStudentSearchMatches(
  students: StudentOption[],
  query: string,
) {
  const normalizedQuery = normalizeStudentSearchValue(query);

  if (!normalizedQuery) {
    return students.length;
  }

  return students.filter((student) =>
    [student.studentId, student.fullName, student.classroom]
      .map(normalizeStudentSearchValue)
      .some((value) => value.includes(normalizedQuery)),
  ).length;
}

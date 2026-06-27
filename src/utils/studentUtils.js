import { getStudentSummaryForIep } from "./iepStudentUtils";

export const getStudentName = (student) =>
  [student?.firstName, student?.lastName].filter(Boolean).join(" ");

export const getStudentFullName = (student) =>
  [student?.firstName, student?.middleName, student?.lastName]
    .filter(Boolean)
    .join(" ");

export const getStudentInitials = (student) => {
  if (!student) return "?";
  const initials = [student.firstName, student.lastName]
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "?";
};

export const getIepStudentName = (iep) =>
  getStudentSummaryForIep(iep).fullName || "";

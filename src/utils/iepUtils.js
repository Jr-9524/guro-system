import { parseJsonValue } from "./jsonUtils";

export const normalizeIep = (iep) => {
  if (!iep) return null;

  return {
    id: iep.id,
    studentId: iep.student_id ?? iep.studentId,
    title: iep.title || "Untitled IEP",
    data: parseJsonValue(iep.data, {}),
    completedSections: parseJsonValue(
      iep.completed_sections ?? iep.completedSections,
      [],
    ),
    activeSection: Number(iep.active_section ?? iep.activeSection ?? 0),
    status: iep.status || "draft",
    createdBy: iep.created_by ?? iep.createdBy,
    lastModified: iep.last_modified ?? iep.lastModified,
    deletedAt: iep.deleted_at ?? iep.deletedAt,
    createdAt: iep.created_at ?? iep.createdAt,
  };
};

export const getCompletionPercent = (iep) =>
  Math.round(((iep.completedSections?.length || 0) / 6) * 100);

export const getComplianceIssues = (iep) => {
  const info = iep.data?.studentInfo || {};
  const goals = iep.data?.goals || [];
  const plaaFP = iep.data?.plaaFP || {};
  const issues = [];

  if ((iep.completedSections?.length || 0) < 6) issues.push("Incomplete");
  if (!info.iepStartDate) issues.push("No start date");
  if (!info.iepEndDate) issues.push("No end date");
  if (!goals.length || goals.some((goal) => !goal.description?.trim())) {
    issues.push("Goal details");
  }
  if (
    !plaaFP.aiDraft?.trim() &&
    !plaaFP.strengths?.trim() &&
    !plaaFP.challenges?.trim()
  ) {
    issues.push("PLAAFP");
  }

  return issues;
};

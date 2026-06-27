import { getGoalStatement, normalizeGoal } from "./goalUtils";
import { getIepStudentName } from "./studentUtils";
import { getIepDates, getStudentSummaryForIep } from "./iepStudentUtils";

export const getProgressSummaryKey = (iepId) =>
  `report:ai-progress-summary:${iepId}`;

export const buildProgressSummaryPayload = ({
  iep,
  studentName,
  progressSessions = [],
}) => {
  const data = iep?.data || {};
  const learner = getStudentSummaryForIep(iep);
  const dates = getIepDates(iep);
  const plaafp = data.plaaFP || data.plaafp || {};
  const goals = (data.goals || []).map(normalizeGoal);

  return {
    studentName: studentName || getIepStudentName(iep),
    gradeLevel: learner.gradeLevel,
    iepTitle: iep?.title,
    iepPeriod: [dates.startDate, dates.endDate]
      .filter(Boolean)
      .join(" to "),
    plaafpDraft: plaafp.aiDraft || plaafp.statement,
    teacherObservations: plaafp.teacherObservations,
    goals: goals.map((goal) => ({
      id: goal.id,
      area: goal.area,
      statement: getGoalStatement(goal),
      status: goal.status,
      progressPercentage: goal.progressPercentage,
      measurementMethod: goal.measurementMethod,
    })),
    progressSessions: [...progressSessions]
      .sort(
        (a, b) =>
          new Date(b.sessionDate || b.createdAt) -
          new Date(a.sessionDate || a.createdAt),
      )
      .slice(0, 30)
      .map((session) => ({
        goalId: session.goalId,
        sessionDate: session.sessionDate || session.createdAt,
        score: session.score,
        total: session.total,
        notes: session.notes,
        teacherObservation: session.teacherObservation,
      })),
  };
};

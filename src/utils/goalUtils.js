export const goalAreas = [
  "Reading",
  "Writing",
  "Mathematics",
  "Communication",
  "Behavior",
  "Social Skills",
  "Motor Skills",
  "Functional / Self-care",
];

export const goalTemplates = {
  Reading: {
    timeframe: "By the end of the school year",
    condition: "Given a grade-appropriate reading passage and visual prompts",
    behavior: "answer comprehension questions",
    criteria: "with 80% accuracy in 4 out of 5 trials",
    measurementMethod: "Quiz/worksheet score",
  },
  Writing: {
    timeframe: "By the end of the school year",
    condition: "Given a writing prompt and graphic organizer",
    behavior: "write a clear paragraph with a topic sentence and supporting details",
    criteria: "meeting 4 out of 5 rubric criteria across 3 samples",
    measurementMethod: "Rubric",
  },
  Mathematics: {
    timeframe: "By the end of the school year",
    condition: "Given visual supports and grade-appropriate problems",
    behavior: "solve mathematics problems using an appropriate strategy",
    criteria: "with 80% accuracy across 3 consecutive assessments",
    measurementMethod: "Quiz/worksheet score",
  },
  Behavior: {
    timeframe: "By the end of the school year",
    condition: "Given classroom expectations and a visual reminder",
    behavior: "use an appropriate coping strategy before returning to the task",
    criteria: "in 4 out of 5 observed opportunities",
    measurementMethod: "Behavior frequency count",
  },
  Communication: {
    timeframe: "By the end of the school year",
    condition: "Given a familiar activity and appropriate communication supports",
    behavior: "express a need, response, or idea using their communication system",
    criteria: "in 4 out of 5 opportunities across 3 sessions",
    measurementMethod: "Teacher observation",
  },
};

export const measurementMethods = [
  "Teacher observation",
  "Checklist",
  "Quiz/worksheet score",
  "Rubric",
  "Behavior frequency count",
  "Performance task",
];

export const measurementFrequencies = [
  "Weekly",
  "Every 2 weeks",
  "Monthly",
  "Quarterly",
];

export const reportingSchedules = [
  "Monthly",
  "Quarterly",
  "Every grading period",
];

export const commonSupports = [
  "Visual prompts",
  "Repeated instructions",
  "Small-group instruction",
  "Extra response time",
  "Guided practice",
  "Simplified text",
  "Positive reinforcement",
  "Assistive technology",
];

export const objectiveStatuses = ["Not Started", "In Progress", "Completed"];
export const goalStatuses = ["Not Started", "In Progress", "Needs Attention", "Completed"];

export const buildGoalText = (annualGoal = {}) => {
  const { timeframe, condition, behavior, criteria } = annualGoal;
  if (![timeframe, condition, behavior, criteria].some(Boolean)) return "";

  const start = timeframe?.trim() || "By the review date";
  const context = condition?.trim() ? `, ${condition.trim()},` : ",";
  const skill = behavior?.trim() || "complete the target skill";
  const success = criteria?.trim() ? ` ${criteria.trim()}` : "";
  return `${start}${context} the student will ${skill}${success}.`.replace(/\s+/g, " ");
};

export const createObjective = (overrides = {}) => ({
  id: overrides.id || `objective-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  description: overrides.description || "",
  criteria: overrides.criteria || "",
  status: overrides.status || "Not Started",
});

export const normalizeGoal = (goal = {}, index = 0) => {
  const legacyCriteria = goal.accuracy
    ? `with ${String(goal.accuracy).replace(/%/g, "")}% accuracy`
    : "";
  const annualGoal = {
    timeframe: goal.annualGoal?.timeframe || goal.timeframe || "",
    condition: goal.annualGoal?.condition || goal.condition || "",
    behavior:
      goal.annualGoal?.behavior ||
      goal.behavior ||
      (!goal.annualGoal && goal.description ? goal.description : ""),
    criteria:
      goal.annualGoal?.criteria || goal.criteria || legacyCriteria,
  };
  const generatedGoalText =
    goal.generatedGoalText ||
    (goal.annualGoal ? buildGoalText(annualGoal) : goal.description) ||
    buildGoalText(annualGoal);
  const measurementMethod = goal.measurementMethod || goal.measurement || "";
  const measurementFrequency = goal.measurementFrequency || goal.sessions || "";

  return {
    ...goal,
    id: goal.id || `goal-${Date.now()}-${index}`,
    area: goal.area || "",
    currentPerformance: goal.currentPerformance || "",
    need: goal.need || "",
    baselineValue: goal.baselineValue || "",
    baselineMethod: goal.baselineMethod || "",
    annualGoal,
    generatedGoalText,
    objectives: (goal.objectives || []).map((objective, objectiveIndex) =>
      createObjective({
        ...objective,
        id: objective.id || `objective-${objectiveIndex}`,
      }),
    ),
    measurementMethod,
    measurementFrequency,
    progressReportingSchedule: goal.progressReportingSchedule || "",
    supports: Array.isArray(goal.supports) ? goal.supports : [],
    status: goal.status || "Not Started",
    progressPercentage: Number(goal.progressPercentage ?? goal.progress ?? 0),
    // Legacy aliases keep existing reports, search, and older code working.
    description: generatedGoalText,
    measurement: measurementMethod,
    sessions: measurementFrequency,
  };
};

export const createGoal = (overrides = {}) =>
  normalizeGoal({ id: `goal-${Date.now()}`, ...overrides });

export const applyGoalTemplate = (goal, area) => {
  const normalized = normalizeGoal({ ...goal, area });
  const template = goalTemplates[area];
  if (!template) return normalized;

  const annualGoal = {
    timeframe: normalized.annualGoal.timeframe || template.timeframe,
    condition: normalized.annualGoal.condition || template.condition,
    behavior: normalized.annualGoal.behavior || template.behavior,
    criteria: normalized.annualGoal.criteria || template.criteria,
  };

  return normalizeGoal({
    ...normalized,
    area,
    annualGoal,
    generatedGoalText: buildGoalText(annualGoal),
    measurementMethod:
      normalized.measurementMethod || template.measurementMethod,
  });
};

export const getGoalWarnings = (goal) => {
  const normalized = normalizeGoal(goal);
  const warnings = [];
  if (!normalized.area.trim()) warnings.push("Choose an area of need.");
  if (!normalized.currentPerformance.trim()) {
    warnings.push("Describe the student's current performance.");
  }
  if (!normalized.annualGoal.behavior.trim()) {
    warnings.push("Add the skill or behavior the student will demonstrate.");
  }
  if (!normalized.annualGoal.criteria.trim()) {
    warnings.push(
      "This goal may be hard to measure. Add a success criteria such as '80% accuracy' or '4 out of 5 trials.'",
    );
  }
  if (!normalized.measurementMethod.trim()) {
    warnings.push("Choose how progress will be measured.");
  }
  return warnings;
};

export const getGoalStatement = (goal) =>
  normalizeGoal(goal).generatedGoalText || "Goal statement not completed.";

export const normalizeGoalTemplate = (template = {}, index = 0) => ({
  ...template,
  id: template.id || `template-${Date.now()}-${index}`,
  area: template.area || "General",
  skillFocus: template.skillFocus || template.title || "Goal Template",
  difficulty: template.difficulty || "Beginner",
  goalText:
    template.goalText || template.description || template.title || "",
  objectives: (template.objectives || []).map((objective, objectiveIndex) =>
    createObjective({
      ...(typeof objective === "string"
        ? { description: objective }
        : objective),
      id:
        (typeof objective === "object" && objective.id) ||
        `template-objective-${objectiveIndex}`,
    }),
  ),
  measurementMethod:
    template.measurementMethod || template.measurement || "",
  frequency: template.frequency || "Weekly",
  reportingSchedule: template.reportingSchedule || "Quarterly",
  supports: Array.isArray(template.supports) ? template.supports : [],
  tags: Array.isArray(template.tags) ? template.tags : [],
  isCustom: Boolean(template.isCustom ?? template.source === "custom"),
});

export const goalTemplateToGoal = (template) => {
  const normalized = normalizeGoalTemplate(template);
  return createGoal({
    area: normalized.area,
    annualGoal: normalized.annualGoal,
    description: normalized.goalText,
    generatedGoalText: normalized.goalText,
    objectives: normalized.objectives,
    measurementMethod: normalized.measurementMethod,
    measurementFrequency: normalized.frequency,
    progressReportingSchedule: normalized.reportingSchedule,
    supports: normalized.supports,
  });
};

export const summarizeGoalProgress = (ieps = []) => {
  const goals = ieps.flatMap((iep) =>
    (iep.data?.goals || []).map(normalizeGoal),
  );
  const byArea = goals.reduce((summary, goal) => {
    const area = goal.area || "General";
    const current = summary[area] || { total: 0, progress: 0 };
    summary[area] = {
      total: current.total + 1,
      progress: current.progress + goal.progressPercentage,
    };
    return summary;
  }, {});

  return {
    total: goals.length,
    completed: goals.filter((goal) => goal.status === "Completed").length,
    inProgress: goals.filter((goal) => goal.status === "In Progress").length,
    needsAttention: goals.filter(
      (goal) =>
        goal.status === "Needs Attention" || goal.progressPercentage < 50,
    ).length,
    byArea: Object.entries(byArea).map(([area, values]) => ({
      area,
      progress: Math.round(values.progress / values.total),
      total: values.total,
    })),
  };
};

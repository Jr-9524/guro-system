import iepService from "./iepService";
import progressService from "./progressService";
import studentService from "./studentService";
import auditService from "./auditService";
import workspaceStoreService from "./workspaceStoreService";

const BACKUP_VERSION = "1.1";
const CUSTOM_GOALS_KEY = "goal-bank:custom-goals";
const PENDING_GOAL_KEY = "goal-bank:pending-goal";
const PREFERENCES_KEY = "app-preferences";
const REMINDERS_KEY = "reminders:dismissed";

const readJson = (key, fallback) => workspaceStoreService.get(key, fallback);
const writeJson = (key, value) => workspaceStoreService.set(key, value);

export const createWorkspaceBackup = async ({ theme, preferences }) => {
  const [students, ieps] = await Promise.all([
    studentService.getAll(),
    iepService.getAll({ includeDeleted: true }),
  ]);
  const progressSessions = await progressService.getAll(
    ieps.map((iep) => iep.id),
    { includeDeleted: true },
  );

  return {
    app: "GURO IEP Manager",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      students,
      ieps,
      progressSessions,
      customGoals: await readJson(CUSTOM_GOALS_KEY, []),
      dismissedReminders: await readJson(REMINDERS_KEY, []),
      activity: await auditService.getAll(),
      pendingGoal: await readJson(PENDING_GOAL_KEY, null),
    },
    settings: {
      theme,
      preferences,
    },
  };
};

export const downloadWorkspaceBackup = (backup) => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `guro-workspace-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const parseWorkspaceBackup = (text) => {
  const backup = JSON.parse(text);
  if (backup?.app !== "GURO IEP Manager" || !backup.data) {
    throw new Error("This file is not a valid GURO workspace backup.");
  }

  return {
    ...backup,
    data: {
      students: backup.data.students || [],
      ieps: backup.data.ieps || [],
      progressSessions: backup.data.progressSessions || [],
      customGoals: backup.data.customGoals || [],
      dismissedReminders: backup.data.dismissedReminders || [],
      activity: backup.data.activity || [],
      pendingGoal: backup.data.pendingGoal || null,
    },
    settings: {
      theme: backup.settings?.theme,
      preferences: backup.settings?.preferences || {},
    },
  };
};

export const getBackupSummary = (backup) => ({
  students: backup.data.students.length,
  ieps: backup.data.ieps.length,
  progressSessions: backup.data.progressSessions.length,
  customGoals: backup.data.customGoals.length,
  dismissedReminders: backup.data.dismissedReminders.length,
  activity: backup.data.activity.length,
  exportedAt: backup.exportedAt,
  version: backup.version,
});

export const restoreWorkspaceBackup = async (backup, { setTheme }) => {
  const existingStudents = await studentService.getAll();
  const existingLrns = new Set(
    existingStudents.map((student) => student.lrn).filter(Boolean),
  );
  const existingIeps = await iepService.getAll();
  const existingProgress = await progressService.getAll(
    existingIeps.map((iep) => iep.id),
  );
  const existingProgressKeys = new Set(
    existingProgress.map(
      (session) =>
        `${session.iepId}-${session.goalId}-${session.sessionDate}-${session.score}-${session.total}`,
    ),
  );

  let studentsImported = 0;
  let studentsSkipped = 0;
  for (const student of backup.data.students) {
    if (student.lrn && existingLrns.has(student.lrn)) {
      studentsSkipped += 1;
      continue;
    }
    await studentService.create(student);
    studentsImported += 1;
  }

  let iepsImported = 0;
  for (const iep of backup.data.ieps) {
    await iepService.save(iep);
    iepsImported += 1;
  }

  let progressImported = 0;
  let progressSkipped = 0;
  for (const session of backup.data.progressSessions) {
    const key = `${session.iepId}-${session.goalId}-${session.sessionDate}-${session.score}-${session.total}`;
    if (existingProgressKeys.has(key)) {
      progressSkipped += 1;
      continue;
    }
    await progressService.logSession(session);
    progressImported += 1;
  }

  await writeJson(CUSTOM_GOALS_KEY, backup.data.customGoals);
  await writeJson(REMINDERS_KEY, backup.data.dismissedReminders);
  await auditService.replace(backup.data.activity);
  if (backup.data.pendingGoal) {
    await writeJson(PENDING_GOAL_KEY, backup.data.pendingGoal);
  }
  if (backup.settings.preferences) {
    await writeJson(PREFERENCES_KEY, backup.settings.preferences);
  }
  if (backup.settings.theme) {
    setTheme(backup.settings.theme);
  }

  return {
    studentsImported,
    studentsSkipped,
    iepsImported,
    progressImported,
    progressSkipped,
    customGoalsImported: backup.data.customGoals.length,
  };
};

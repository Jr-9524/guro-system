import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Gift,
  Target,
  X,
} from "lucide-react";
import iepService from "../services/iepService";
import progressService from "../services/progressService";
import studentService from "../services/studentService";
import workspaceStoreService from "../services/workspaceStoreService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Stat from "../components/common/Stat";
import Button from "../components/common/Button";
import { formatDate, daysUntil, startOfDay } from "../utils/dateUtils";
import { getStudentName, getIepStudentName } from "../utils/studentUtils";

const DISMISSED_STORAGE_KEY = "reminders:dismissed";

const reminderConfig = {
  review: {
    label: "Reviews",
    icon: CalendarDays,
    className: "border border-warning/30 bg-warning/10 text-base-content",
  },
  progress: {
    label: "Progress",
    icon: Target,
    className: "border-info/30 bg-info/10 text-base-content",
  },
  birthday: {
    label: "Birthdays",
    icon: Gift,
    className: "border-gray-300 bg-success/10 text-base-content",
  },
  draft: {
    label: "Drafts",
    icon: FileText,
    className: "border-primary/30 bg-primary/10 text-base-content",
  },
};

const filters = [
  { value: "all", label: "All" },
  { value: "review", label: "Reviews" },
  { value: "progress", label: "Progress" },
  { value: "birthday", label: "Birthdays" },
  { value: "draft", label: "Drafts" },
];

const getStudentBirthdayThisYear = (student) => {
  if (!student.birthDate) return null;
  const birthDate = new Date(student.birthDate);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = startOfDay();
  let nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  );
  if (nextBirthday < today) {
    nextBirthday = new Date(
      today.getFullYear() + 1,
      birthDate.getMonth(),
      birthDate.getDate(),
    );
  }

  return nextBirthday;
};

const getLastProgressDate = (iep, sessions) => {
  const dates = sessions
    .filter((session) => session.iepId === iep.id)
    .map((session) => new Date(session.sessionDate))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a);

  return dates[0] || null;
};

const getPriority = (type, days) => {
  if (type === "review" && days < 0) return "high";
  if (type === "progress" && days <= 0) return "high";
  if (days <= 7) return "medium";
  return "low";
};

const getPriorityClass = (priority) => {
  if (priority === "high") return "badge-error";
  if (priority === "medium") return "badge-warning";
  return "badge-ghost";
};

const loadDismissed = () =>
  workspaceStoreService.get(DISMISSED_STORAGE_KEY, []);
const saveDismissed = (ids) =>
  workspaceStoreService.set(DISMISSED_STORAGE_KEY, ids);

const Reminders = () => {
  const [students, setStudents] = useState([]);
  const [ieps, setIeps] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [dismissed, setDismissed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const loadReminders = async () => {
      setIsLoading(true);
      try {
        const [studentRecords, iepRecords, dismissedReminderIds] =
          await Promise.all([
            studentService.getAll(),
            iepService.getAll(),
            loadDismissed(),
          ]);
        const progressRecords = await progressService.getAll(
          iepRecords.map((iep) => iep.id),
        );

        if (!isCurrent) return;
        setStudents(studentRecords);
        setIeps(iepRecords);
        setSessions(progressRecords);
        setDismissed(dismissedReminderIds);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadReminders();

    return () => {
      isCurrent = false;
    };
  }, []);

  const reminders = useMemo(
    () => buildReminders(students, ieps, sessions),
    [students, ieps, sessions],
  );
  const visibleReminders = useMemo(
    () =>
      reminders.filter(
        (reminder) =>
          !dismissed.includes(reminder.id) &&
          (activeFilter === "all" || reminder.type === activeFilter),
      ),
    [activeFilter, dismissed, reminders],
  );
  const counts = useMemo(
    () =>
      reminders.reduce(
        (totals, reminder) => ({
          ...totals,
          [reminder.type]: (totals[reminder.type] || 0) + 1,
        }),
        { all: reminders.length },
      ),
    [reminders],
  );

  const dismissReminder = async (id) => {
    const nextDismissed = [...new Set([...dismissed, id])];
    setDismissed(nextDismissed);
    await saveDismissed(nextDismissed);
  };

  const resetDismissed = async () => {
    setDismissed([]);
    await saveDismissed([]);
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Reminder Center</h1>
          <p className="text-sm text-base-content/60">
            Review dates, birthdays, progress logs, and draft IEP follow-ups.
          </p>
        </div>
        {dismissed.length > 0 && (
          <Button onClick={resetDismissed}>Show dismissed</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center rounded-lg border border-gray-300 bg-base-100">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Total" value={visibleReminders.length} icon={Bell} />
            <Stat
              label="High Priority"
              value={
                visibleReminders.filter(
                  (reminder) => reminder.priority === "high",
                ).length
              }
              icon={AlertTriangle}
            />
            <Stat
              label="This Week"
              value={
                visibleReminders.filter(
                  (reminder) => reminder.days >= 0 && reminder.days <= 7,
                ).length
              }
              icon={Clock3}
            />
            <Stat
              label="Dismissed"
              value={dismissed.length}
              icon={CheckCircle2}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={`btn btn-sm px-3 py-2${
                  activeFilter === filter.value
                    ? "btn-active bg-gray-100"
                    : "btn-outline"
                }`}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
                <span>
                  {filter.value === "all"
                    ? visibleReminders.length
                    : counts[filter.value] || 0}
                </span>
              </button>
            ))}
          </div>

          <section className="rounded-sm border border-gray-300 bg-base-100">
            {visibleReminders.length ? (
              <div className="divide-y divide-gray-300">
                {visibleReminders.map((reminder) => (
                  <ReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    onDismiss={dismissReminder}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 p-8 text-center">
                <CheckCircle2 className="h-9 w-9" />
                <div>
                  <p className="font-semibold">No reminders to show</p>
                  <p className="mt-1 text-sm text-base-content/60">
                    Your current filter has no open items.
                  </p>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

const buildReminders = (students, ieps, sessions) => {
  const reminders = [];

  students.forEach((student) => {
    const birthday = getStudentBirthdayThisYear(student);
    const days = daysUntil(birthday);
    if (birthday && days >= 0 && days <= 30) {
      reminders.push({
        id: `birthday-${student.id}-${birthday.getFullYear()}`,
        type: "birthday",
        title: `${getStudentName(student) || "Student"} birthday`,
        detail: `Birthday on ${formatDate(birthday)}`,
        days,
        priority: getPriority("birthday", days),
        to: `/students/${student.id}`,
      });
    }
  });

  ieps
    .filter((iep) => iep.status !== "archived")
    .forEach((iep) => {
      const name = getIepStudentName(iep) || iep.title;
      const endDate = iep.data?.studentInfo?.iepEndDate;
      const reviewDays = daysUntil(endDate);

      if (reviewDays !== null && reviewDays <= 60) {
        reminders.push({
          id: `review-${iep.id}-${endDate}`,
          type: "review",
          title:
            reviewDays < 0
              ? `${name} annual review is overdue`
              : `${name} annual review due soon`,
          detail: `IEP end date: ${formatDate(endDate)}`,
          days: reviewDays,
          priority: getPriority("review", reviewDays),
          to: `/iep/${iep.id}/view`,
        });
      }

      if (iep.status === "draft") {
        const daysSinceEdit = Math.abs(daysUntil(iep.lastModified));
        if (daysSinceEdit >= 14) {
          reminders.push({
            id: `draft-${iep.id}-${iep.lastModified}`,
            type: "draft",
            title: `${iep.title} has been in draft`,
            detail: `Last edited ${formatDate(iep.lastModified)}`,
            days: daysSinceEdit,
            priority: getPriority("draft", daysSinceEdit),
            to: `/iep/${iep.id}/view`,
          });
        }
      }

      if (iep.status === "complete" && (iep.data?.goals || []).length > 0) {
        const lastProgressDate = getLastProgressDate(iep, sessions);
        const daysSinceProgress = lastProgressDate
          ? Math.abs(daysUntil(lastProgressDate))
          : 999;

        if (!lastProgressDate || daysSinceProgress >= 14) {
          reminders.push({
            id: `progress-${iep.id}-${lastProgressDate?.toISOString() || "none"}`,
            type: "progress",
            title: `${name} needs progress monitoring`,
            detail: lastProgressDate
              ? `Last progress log: ${formatDate(lastProgressDate)}`
              : "No progress sessions logged yet",
            days: lastProgressDate ? daysSinceProgress : 0,
            priority: "high",
            to: "/progress",
          });
        }
      }
    });

  return reminders.sort(
    (a, b) =>
      priorityWeight(a.priority) - priorityWeight(b.priority) ||
      a.days - b.days ||
      a.title.localeCompare(b.title),
  );
};

const priorityWeight = (priority) => {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
};

const ReminderRow = ({ reminder, onDismiss }) => {
  const config = reminderConfig[reminder.type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <Link
        to={reminder.to}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${config.className}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{reminder.title}</p>
          <p className="mt-1 truncate text-sm text-base-content/60">
            {reminder.detail}
          </p>
        </div>
      </Link>

      <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
        <span className="badge badge-outline">{config.label}</span>
        <span className={`badge ${getPriorityClass(reminder.priority)}`}>
          {reminder.priority}
        </span>
        <span className="badge">
          {reminder.days < 0
            ? `${Math.abs(reminder.days)} days overdue`
            : `${reminder.days} days`}
        </span>
        <button
          className="btn btn-ghost btn-sm btn-square"
          title="Dismiss reminder"
          onClick={() => onDismiss(reminder.id)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Reminders;

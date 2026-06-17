import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  Plus,
  Settings,
  Target,
  UserRound,
} from "lucide-react";
import iepService from "./iepService";
import progressService from "./progressService";
import studentService from "./studentService";
import { loadCustomGoals } from "./goalBankService";
import { formatDate } from "../utils/dateUtils";
import { getStudentName, getIepStudentName } from "../utils/studentUtils";

export const searchCategories = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "ieps", label: "IEPs" },
  { value: "goals", label: "Goals" },
  { value: "progress", label: "Progress" },
  { value: "actions", label: "Actions" },
  { value: "pages", label: "Pages" },
];

const actionResults = [
  {
    id: "action-new-student",
    category: "actions",
    label: "Action",
    title: "Add Student",
    subtitle: "Open the quick add student form",
    meta: "Create",
    to: "/students?action=add",
    icon: Plus,
    searchText: ["add student", "new student", "create student", "register"],
  },
  {
    id: "action-new-iep",
    category: "actions",
    label: "Action",
    title: "Create New IEP",
    subtitle: "Start a new IEP document",
    meta: "Create",
    to: "/iep/new",
    icon: FileText,
    searchText: ["new iep", "create iep", "quick iep writing"],
  },
  {
    id: "action-log-progress",
    category: "actions",
    label: "Action",
    title: "Log Progress",
    subtitle: "Record a goal progress session",
    meta: "Progress",
    to: "/progress",
    icon: Activity,
    searchText: ["log progress", "progress monitoring", "session"],
  },
];

const pageResults = [
  {
    id: "page-dashboard",
    category: "pages",
    label: "Page",
    title: "Dashboard",
    subtitle: "Workspace overview and quick actions",
    meta: "Open page",
    to: "/dashboard",
    icon: LayoutDashboard,
    searchText: ["dashboard", "overview", "workspace"],
  },
  {
    id: "page-students",
    category: "pages",
    label: "Page",
    title: "Students",
    subtitle: "Student profiles, calendar, and IEP history",
    meta: "Open page",
    to: "/students",
    icon: UserRound,
    searchText: ["students", "profiles", "learners"],
  },
  {
    id: "page-calendar",
    category: "pages",
    label: "Page",
    title: "Calendar",
    subtitle: "Birthdays, IEP dates, and review prep",
    meta: "Open page",
    to: "/students?view=calendar",
    icon: CalendarDays,
    searchText: ["calendar", "birthdays", "iep dates", "review prep"],
  },
  {
    id: "page-goals",
    category: "pages",
    label: "Page",
    title: "Goal Bank",
    subtitle: "Reusable SMART goal templates",
    meta: "Open page",
    to: "/goals",
    icon: Target,
    searchText: ["goal bank", "smart goals", "templates"],
  },
  {
    id: "page-progress",
    category: "pages",
    label: "Page",
    title: "Progress Monitoring",
    subtitle: "Log and review goal session data",
    meta: "Open page",
    to: "/progress",
    icon: Activity,
    searchText: ["progress monitoring", "log progress", "session data"],
  },
  {
    id: "page-reminders",
    category: "pages",
    label: "Page",
    title: "Reminder Center",
    subtitle: "Review upcoming tasks and due dates",
    meta: "Open page",
    to: "/reminders",
    icon: Bell,
    searchText: ["reminders", "due dates", "tasks", "alerts"],
  },
  {
    id: "page-activity",
    category: "pages",
    label: "Page",
    title: "Activity Log",
    subtitle: "Recent student, IEP, progress, import, and backup activity",
    meta: "Open page",
    to: "/activity",
    icon: History,
    searchText: ["activity", "audit", "history", "log", "recent actions"],
  },
  {
    id: "page-reports",
    category: "pages",
    label: "Page",
    title: "Reports",
    subtitle: "Progress, compliance, and analytics views",
    meta: "Open page",
    to: "/reports",
    icon: ClipboardList,
    searchText: ["reports", "compliance", "analytics", "progress reports"],
  },
  {
    id: "page-settings",
    category: "pages",
    label: "Page",
    title: "Settings",
    subtitle: "Preferences, backups, and workspace configuration",
    meta: "Open page",
    to: "/settings",
    icon: Settings,
    searchText: ["settings", "preferences", "backup", "workspace"],
  },
];

export const includesQuery = (values, query) =>
  values
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));

export const filterSearchResults = (results, query, activeCategory = "all") => {
  const normalizedQuery = query.trim().toLowerCase();

  return results.filter((result) => {
    const matchesCategory =
      activeCategory === "all" || result.category === activeCategory;
    const matchesQuery =
      !normalizedQuery || includesQuery(result.searchText, normalizedQuery);

    return matchesCategory && matchesQuery;
  });
};

export const getSearchCounts = (results) =>
  searchCategories.reduce((totals, category) => {
    totals[category.value] =
      category.value === "all"
        ? results.length
        : results.filter((result) => result.category === category.value).length;
    return totals;
  }, {});

export const loadSearchResults = async () => {
  const [students, ieps] = await Promise.all([
    studentService.getAll(),
    iepService.getAll(),
  ]);
  const [sessions, customGoals] = await Promise.all([
    progressService.getAll(ieps.map((iep) => iep.id)),
    loadCustomGoals(),
  ]);

  return buildSearchResults({
    students,
    ieps,
    sessions,
    customGoals,
  });
};

export const buildSearchResults = ({
  students = [],
  ieps = [],
  sessions = [],
  customGoals = [],
}) => {
  const studentResults = students.map((student) => ({
    id: `student-${student.id}`,
    category: "students",
    label: "Student",
    title: getStudentName(student) || "Unnamed student",
    subtitle: `Grade ${student.gradeLevel || "Not set"} - LRN ${
      student.lrn || "Not set"
    }`,
    meta: student.primaryDisabilityCategory || "Student profile",
    to: `/students/${student.id}`,
    icon: UserRound,
    searchText: [
      getStudentName(student),
      student.lrn,
      student.gradeLevel,
      student.section,
      student.guardianName,
      student.primaryDisabilityCategory,
    ],
  }));

  const iepResults = ieps.map((iep) => ({
    id: `iep-${iep.id}`,
    category: "ieps",
    label: iep.status === "complete" ? "Active IEP" : "IEP",
    title: iep.title,
    subtitle: `${getIepStudentName(iep) || "No student name"} - Modified ${formatDate(
      iep.lastModified,
    )}`,
    meta: `${iep.completedSections.length}/6 sections`,
    to: `/iep/${iep.id}/edit`,
    icon: FileText,
    searchText: [
      iep.title,
      getIepStudentName(iep),
      iep.status,
      iep.data?.plaaFP?.strengths,
      iep.data?.plaaFP?.challenges,
      ...(iep.data?.goals || []).map((goal) => goal.description),
    ],
  }));

  const goalResults = customGoals.map((goal) => ({
    id: `goal-${goal.id}`,
    category: "goals",
    label: "Custom Goal",
    title: goal.title || "Untitled goal",
    subtitle: goal.description || "No goal description",
    meta: goal.area || "Goal Bank",
    to: "/goals",
    icon: Target,
    searchText: [
      goal.title,
      goal.description,
      goal.area,
      goal.category,
      goal.gradeBand,
      goal.criteria,
      goal.measurement,
    ],
  }));

  const progressResults = sessions.map((session) => {
    const iep = ieps.find((record) => record.id === session.iepId);

    return {
      id: `progress-${session.id}`,
      category: "progress",
      label: "Progress",
      title: iep?.title || "Progress session",
      subtitle: `${formatDate(session.sessionDate)} - ${session.score}/${session.total}`,
      meta: session.notes || "Session log",
      to: "/progress",
      icon: Activity,
      searchText: [
        iep?.title,
        getIepStudentName(iep),
        session.notes,
        session.score,
        session.total,
      ],
    };
  });

  return [
    ...studentResults,
    ...iepResults,
    ...goalResults,
    ...progressResults,
    ...actionResults,
    ...pageResults,
  ];
};

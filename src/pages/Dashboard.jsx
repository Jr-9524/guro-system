import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import useAuthStore from "../stores/authStore";
import iepService from "../services/iepService";
import studentService from "../services/studentService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Panel from "../components/common/Panel";
import Stat from "../components/common/Stat";
import { formatDate, daysUntil } from "../utils/dateUtils";
import { getIepStudentName } from "../utils/studentUtils";
import { getCompletionPercent, getComplianceIssues } from "../utils/iepUtils";

const Dashboard = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [ieps, setIeps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const loadDashboard = async () => {
      try {
        const [studentRecords, iepRecords] = await Promise.all([
          studentService.getAll(),
          iepService.getAll(),
        ]);
        if (!isCurrent) return;
        setStudents(studentRecords);
        setIeps(iepRecords);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isCurrent = false;
    };
  }, []);

  const dashboardData = useMemo(() => {
    const activeIeps = ieps.filter((iep) => iep.status === "complete");
    const draftIeps = ieps.filter((iep) => iep.status === "draft");
    const recentIeps = [...ieps]
      .sort(
        (a, b) =>
          new Date(b.lastModified || b.createdAt || 0) -
          new Date(a.lastModified || a.createdAt || 0),
      )
      .slice(0, 5);
    const recentStudents = [...students]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0),
      )
      .slice(0, 5);
    const upcomingReviews = ieps
      .map((iep) => ({
        iep,
        days: daysUntil(iep.data?.studentInfo?.iepEndDate),
      }))
      .filter(({ days }) => days !== null && days >= 0 && days <= 60)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
    const complianceAlerts = ieps
      .map((iep) => ({ iep, issues: getComplianceIssues(iep) }))
      .filter(({ issues }) => issues.length > 0)
      .slice(0, 5);
    const studentsWithIeps = new Set(ieps.map((iep) => iep.studentId)).size;
    const totalGoals = ieps.reduce(
      (total, iep) => total + (iep.data?.goals?.length || 0),
      0,
    );

    return {
      activeIeps,
      draftIeps,
      recentIeps,
      recentStudents,
      upcomingReviews,
      complianceAlerts,
      totalGoals,
      coverage: students.length
        ? Math.round((studentsWithIeps / students.length) * 100)
        : 0,
    };
  }, [ieps, students]);

  return (
    <div className="min-h-full w-full space-y-6 ">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {user?.fullName || "Teacher"}!
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Here is your current IEP workspace overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/students?action=add"
            className="btn border border-gray-300"
          >
            <Plus className="h-5 w-5" /> Student
          </Link>
          <Link to="/iep/new" className="btn border border-gray-300">
            <Plus className="h-5 w-5" /> IEP
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center rounded-lg border border-gray-300 bg-base-100">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Students" value={students.length} icon={Users} />
            <Stat
              label="Active IEPs"
              value={dashboardData.activeIeps.length}
              icon={CheckCircle2}
            />
            <Stat
              label="Upcoming Reviews"
              value={dashboardData.upcomingReviews.length}
              icon={Calendar}
            />
            <Stat
              label="Goals"
              value={dashboardData.totalGoals}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
              <Panel title="Recent IEPs" action="/iep/drafts">
                <RecentIepList ieps={dashboardData.recentIeps} />
              </Panel>

              <Panel title="Upcoming Reviews" action="/students?view=calendar">
                <UpcomingReviewList items={dashboardData.upcomingReviews} />
              </Panel>
            </div>

            <aside className="space-y-4">
              <Panel title="Compliance Alerts" action="/reports/compliance">
                <ComplianceList alerts={dashboardData.complianceAlerts} />
              </Panel>

              <Panel title="Quick Actions">
                <div className="grid gap-2">
                  <QuickAction
                    to="/reminders"
                    title="Check Reminders"
                    description="Review upcoming tasks and due dates."
                  />
                  <QuickAction
                    to="/goals"
                    title="Open Goal Bank"
                    description="Find reusable SMART goals."
                  />
                  <QuickAction
                    to="/progress"
                    title="Log Progress"
                    description="Record goal session data."
                  />
                  <QuickAction
                    to="/reports"
                    title="View Reports"
                    description="Review compliance and analytics."
                  />
                </div>
              </Panel>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

const RecentIepList = ({ ieps }) =>
  ieps.length ? (
    <div className="divide-y divide-gray-300 rounded-lg border border-gray-300">
      {ieps.map((iep) => (
        <Link
          key={iep.id}
          to={`/iep/${iep.id}/edit`}
          className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-base-200"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{iep.title}</p>
            <p className="mt-1 truncate text-xs text-base-content/60">
              {getIepStudentName(iep) || "No student name"} - Modified{" "}
              {formatDate(iep.lastModified)}
            </p>
          </div>
          <span className="text-sm">{getCompletionPercent(iep)}%</span>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyPanel icon={FileText} message="No IEPs saved yet." />
  );

const UpcomingReviewList = ({ items }) =>
  items.length ? (
    <div className="space-y-2">
      {items.map(({ iep, days }) => (
        <Link
          key={iep.id}
          to={`/iep/${iep.id}/edit`}
          className="flex items-center justify-between gap-3 rounded-lg border border-gray-300 p-3 transition-colors hover:bg-base-200"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {getIepStudentName(iep) || iep.title}
            </p>
            <p className="mt-1 text-xs text-base-content/60">
              Ends {formatDate(iep.data?.studentInfo?.iepEndDate)}
            </p>
          </div>
          <span className="badge badge-outline shrink-0">{days} days</span>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyPanel icon={Calendar} message="No reviews due in the next 60 days." />
  );

const ComplianceList = ({ alerts }) =>
  alerts.length ? (
    <div className="space-y-2">
      {alerts.map(({ iep, issues }) => (
        <Link
          key={iep.id}
          to={`/iep/${iep.id}/edit`}
          className="block rounded-lg border border-gray-300 p-3 transition-colors hover:bg-base-200"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{iep.title}</p>
              <p className="mt-1 text-xs text-base-content/70">
                {issues.join(", ")}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyPanel icon={CheckCircle2} message="No compliance alerts." />
  );

const QuickAction = ({ to, title, description }) => (
  <Link
    to={to}
    className="rounded-lg border border-gray-300 p-3 transition-colors hover:bg-base-200"
  >
    <p className="text-sm font-semibold">{title}</p>
    <p className="mt-1 text-xs text-base-content/60">{description}</p>
  </Link>
);

const EmptyPanel = ({ icon: Icon, message }) => (
  <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-6 text-center">
    <Icon className="h-7 w-7 opacity-50" />
    <p className="text-sm text-base-content/60">{message}</p>
  </div>
);

export default Dashboard;

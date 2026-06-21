import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";
import useAuthStore from "../stores/authStore";
import iepService from "../services/iepService";
import studentService from "../services/studentService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Panel from "../components/common/Panel";
import Stat from "../components/common/Stat";
import ButtonLink from "../components/common/ButtonLink";
import PageHeader from "../components/common/PageHeader";
import { formatDate, daysUntil } from "../utils/dateUtils";
import { getIepStudentName } from "../utils/studentUtils";
import { getCompletionPercent } from "../utils/iepUtils";
import { guroTable } from "../styles/guroStyles";

const Dashboard = () => {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [ieps, setIeps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([studentService.getAll(), iepService.getAll()])
      .then(([studentRecords, iepRecords]) => {
        if (!isCurrent) return;
        setStudents(studentRecords);
        setIeps(iepRecords);
      })
      .finally(() => isCurrent && setIsLoading(false));

    return () => {
      isCurrent = false;
    };
  }, []);

  const dashboardData = useMemo(() => {
    const activeIeps = ieps.filter((iep) => iep.status === "complete");
    const draftIeps = ieps.filter((iep) => iep.status === "draft");
    const studentIdsWithIeps = new Set(ieps.map((iep) => iep.studentId));
    const studentsWithoutIeps = students.filter(
      (student) => !studentIdsWithIeps.has(student.id),
    );
    const recentIeps = [...ieps]
      .sort(
        (a, b) =>
          new Date(b.lastModified || b.createdAt || 0) -
          new Date(a.lastModified || a.createdAt || 0),
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

    return {
      activeIeps,
      draftIeps,
      recentIeps,
      upcomingReviews,
      studentsWithoutIeps,
    };
  }, [ieps, students]);

  return (
    <div className="min-h-full w-full space-y-7">
      <PageHeader
        title={`Welcome, ${user?.fullName || "Teacher"}`}
        description="Review students, IEP activity, and upcoming teacher actions."
      />

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center rounded-2xl border border-base-300 bg-base-100">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Students" value={students.length} icon={Users} />
            <Stat
              label="Active IEPs"
              value={dashboardData.activeIeps.length}
              icon={CheckCircle2}
              variant="success"
            />
            <Stat
              label="Draft IEPs"
              value={dashboardData.draftIeps.length}
              icon={FileText}
              variant="slate"
            />
            <Stat
              label="Pending Reviews"
              value={dashboardData.upcomingReviews.length}
              icon={Calendar}
              variant="warning"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Recent IEPs" action="/iep/drafts" actionLabel="View all">
              <RecentIepList ieps={dashboardData.recentIeps} />
            </Panel>
            <Panel
              title="Pending Reviews"
              action="/reminders"
              actionLabel="View reminders"
            >
              <UpcomingReviewList items={dashboardData.upcomingReviews} />
            </Panel>
            <Panel
              title="Students without an IEP"
              action="/students"
              actionLabel="View students"
              className="xl:col-span-2"
            >
              <StudentsWithoutIep students={dashboardData.studentsWithoutIeps} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};

const RecentIepList = ({ ieps }) =>
  ieps.length ? (
    <div className={guroTable.wrapper}>
      {ieps.map((iep) => (
        <Link
          key={iep.id}
          to={`/iep/${iep.id}/view`}
          className="flex items-center justify-between gap-3 border-b border-base-300 px-4 py-3 transition-colors last:border-0 hover:bg-base-200"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{iep.title}</span>
            <span className="mt-1 block truncate text-xs text-base-content/60">
              {getIepStudentName(iep) || "No student selected"} - Modified {formatDate(iep.lastModified)}
            </span>
          </span>
          <span className={guroTable.badge}>{getCompletionPercent(iep)}%</span>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyPanel message="No IEPs saved yet. Start by creating an IEP for a student." action="/iep/new" actionLabel="Create an IEP" />
  );

const UpcomingReviewList = ({ items }) =>
  items.length ? (
    <div className="space-y-2">
      {items.map(({ iep, days }) => (
        <Link
          key={iep.id}
          to={`/iep/${iep.id}/view`}
          className="flex items-center justify-between gap-3 rounded-xl border border-base-300 p-3 transition-colors hover:bg-base-200"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {getIepStudentName(iep) || iep.title}
            </span>
            <span className="mt-1 block text-xs text-base-content/60">
              Review ends {formatDate(iep.data?.studentInfo?.iepEndDate)}
            </span>
          </span>
          <span className="badge badge-warning badge-outline shrink-0">{days} days</span>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyPanel message="No IEP reviews are due in the next 60 days." />
  );

const StudentsWithoutIep = ({ students }) =>
  students.length ? (
    <div className="grid gap-2 sm:grid-cols-2">
      {students.slice(0, 5).map((student) => (
        <Link
          key={student.id}
          to={`/iep/new?studentId=${student.id}`}
          className="flex items-center justify-between rounded-xl border border-base-300 p-3 text-sm transition-colors hover:bg-base-200"
        >
          <span className="font-semibold">{student.firstName} {student.lastName}</span>
          <span className="text-xs font-semibold text-base-content">Create IEP</span>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyPanel message="Every student currently has an IEP record." />
  );

const EmptyPanel = ({ message, action, actionLabel }) => (
  <div className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-base-300 p-6 text-center">
    <p className="text-sm text-base-content/60">{message}</p>
    {action && <ButtonLink to={action} size="sm">{actionLabel}</ButtonLink>}
  </div>
);

export default Dashboard;

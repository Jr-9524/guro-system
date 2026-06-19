import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus,
  Printer,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Panel from "../components/common/Panel";
import Stat from "../components/common/Stat";
import SectionTabs from "../components/common/SectionTabs";
import iepService from "../services/iepService";
import studentService from "../services/studentService";
import { formatDate } from "../utils/dateUtils";
import { getIepStudentName } from "../utils/studentUtils";
import { getCompletionPercent, getComplianceIssues } from "../utils/iepUtils";
import {
  getGoalStatement,
  normalizeGoal,
  summarizeGoalProgress,
} from "../utils/goalUtils";

const reportConfig = {
  overview: {
    title: "Reports",
    description: "Review IEP activity, compliance needs, and student coverage.",
  },
  progress: {
    title: "Progress Reports",
    description: "Review student goals and monitoring plans across IEPs.",
  },
  compliance: {
    title: "Compliance Report",
    description: "Find incomplete IEPs, missing dates, and plans due soon.",
  },
  analytics: {
    title: "Analytics",
    description: "See student, IEP, and completion trends at a glance.",
  },
};

const Reports = ({ view = "overview" }) => {
  const navigate = useNavigate();
  const config = reportConfig[view] || reportConfig.overview;
  const [students, setStudents] = useState([]);
  const [ieps, setIeps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const loadReports = async () => {
      setIsLoading(true);
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

    loadReports();

    return () => {
      isCurrent = false;
    };
  }, []);

  const reportData = useMemo(() => {
    const activeIeps = ieps.filter((iep) => iep.status === "complete");
    const draftIeps = ieps.filter((iep) => iep.status === "draft");
    const iepsWithIssues = ieps
      .map((iep) => ({ iep, issues: getComplianceIssues(iep) }))
      .filter((item) => item.issues.length > 0);
    const studentsWithIeps = new Set(ieps.map((iep) => iep.studentId)).size;
    const totalGoals = ieps.reduce(
      (total, iep) => total + (iep.data?.goals?.length || 0),
      0,
    );
    const averageCompletion = ieps.length
      ? Math.round(
          ieps.reduce((total, iep) => total + getCompletionPercent(iep), 0) /
            ieps.length,
        )
      : 0;

    return {
      activeIeps,
      draftIeps,
      iepsWithIssues,
      studentsWithIeps,
      totalGoals,
      averageCompletion,
      coveragePercent: students.length
        ? Math.round((studentsWithIeps / students.length) * 100)
        : 0,
    };
  }, [ieps, students]);

  return (
    <div className="min-h-full w-full space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-base-content/60">{config.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/iep/new")} icon={Plus}>
            New IEP
          </Button>
          <Button onClick={() => window.print()} icon={Printer}>
            Print
          </Button>
        </div>
      </div>

      <ReportTabs activeView={view} />

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center rounded-lg border border-gray-300 bg-base-100">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <SummaryGrid
            students={students}
            ieps={ieps}
            reportData={reportData}
          />

          {view === "overview" && (
            <OverviewReport students={students} ieps={ieps} data={reportData} />
          )}
          {view === "progress" && <ProgressReport ieps={ieps} />}
          {view === "compliance" && (
            <ComplianceReport items={reportData.iepsWithIssues} />
          )}
          {view === "analytics" && (
            <AnalyticsReport
              students={students}
              ieps={ieps}
              data={reportData}
            />
          )}
        </>
      )}
    </div>
  );
};

const ReportTabs = ({ activeView }) => {
  return (
    <SectionTabs
      label="Report views"
      activeId={activeView}
      items={[
        { id: "overview", label: "Overview", href: "/reports" },
        { id: "progress", label: "Progress", href: "/reports/progress" },
        {
          id: "compliance",
          label: "Compliance",
          href: "/reports/compliance",
        },
        { id: "analytics", label: "Analytics", href: "/reports/analytics" },
      ]}
    />
  );
};

const SummaryGrid = ({ students, reportData }) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <Stat label="Students" value={students.length} icon={Users} />
    <Stat
      label="Active IEPs"
      value={reportData.activeIeps.length}
      icon={CheckCircle2}
    />
    <Stat label="Goals" value={reportData.totalGoals} icon={TrendingUp} />
    <Stat
      label="Compliance Needs"
      value={reportData.iepsWithIssues.length}
      icon={AlertTriangle}
    />
  </div>
);

const OverviewReport = ({ students, ieps, data }) => (
  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <Panel title="Recent IEP Activity">
      <IepTable ieps={ieps.slice(0, 8)} />
    </Panel>

    <Panel title="Coverage">
      <ProgressBar label="Students with IEPs" value={data.coveragePercent} />
      <ProgressBar
        label="Average IEP completion"
        value={data.averageCompletion}
      />
      <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-base-content/70">
        {students.length - data.studentsWithIeps} students do not have an IEP
        record yet.
      </div>
    </Panel>
  </div>
);

const ProgressReport = ({ ieps }) => {
  const summary = summarizeGoalProgress(ieps);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Goals" value={summary.total} icon={Target} />
        <Stat
          label="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          variant="success"
        />
        <Stat
          label="In Progress"
          value={summary.inProgress}
          icon={TrendingUp}
        />
        <Stat
          label="Needs Attention"
          value={summary.needsAttention}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      <Panel title="Progress by Area">
        {summary.byArea.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {summary.byArea.map((area) => (
              <div
                key={area.area}
                className="rounded-xl border border-base-300 p-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{area.area}</span>
                  <span className="text-base-content/60">
                    {area.progress}% / {area.total} goals
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-base-200">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(area.progress, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyReport message="No goal progress is available by area yet." />
        )}
      </Panel>

      <Panel title="Goal Progress Summary">
        {ieps.length ? (
          <div className="space-y-3">
            {ieps.map((iep) => (
              <div
                key={iep.id}
                className="rounded-lg border border-gray-300 bg-base-100 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{iep.title}</p>
                    <p className="text-sm text-base-content/60">
                      {getIepStudentName(iep) || "No student name"}
                    </p>
                  </div>
                  <span className="badge badge-outline">
                    {getCompletionPercent(iep)}% complete
                  </span>
                </div>
                <div className="space-y-2">
                  {(iep.data?.goals || []).map(normalizeGoal).map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-md bg-base-200 p-3 text-sm"
                    >
                      <p className="font-medium">{goal.area || "Goal"}</p>
                      <p className="mt-1 text-base-content/70">
                        {getGoalStatement(goal)}
                      </p>
                      <p className="mt-2 text-xs text-base-content/50">
                        {goal.status} | {goal.progressPercentage}% |{" "}
                        {goal.measurementMethod || "Measurement not set"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyReport message="No IEP goals available yet." />
        )}
      </Panel>
    </div>
  );
};

const ComplianceReport = ({ items }) => (
  <Panel title="Compliance Checklist">
    {items.length ? (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>IEP</th>
              <th>Student</th>
              <th>End Date</th>
              <th>Issues</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ iep, issues }) => (
              <tr key={iep.id}>
                <td className="font-medium">{iep.title}</td>
                <td>{getIepStudentName(iep) || "No student name"}</td>
                <td>{formatDate(iep.data?.studentInfo?.iepEndDate)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {issues.map((issue) => (
                      <span
                        key={issue}
                        className="badge badge-warning badge-sm"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <Link to={`/iep/${iep.id}/edit`} className="btn btn-xs">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyReport message="No compliance issues found." />
    )}
  </Panel>
);

const AnalyticsReport = ({ students, ieps, data }) => {
  const complete = data.activeIeps.length;
  const draft = data.draftIeps.length;
  const inactive = Math.max(students.length - data.studentsWithIeps, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="IEP Status Mix">
        <ProgressBar label="Complete" value={getShare(complete, ieps.length)} />
        <ProgressBar label="Draft" value={getShare(draft, ieps.length)} />
      </Panel>
      <Panel title="Student Coverage">
        <ProgressBar label="With IEP" value={data.coveragePercent} />
        <ProgressBar
          label="Without IEP"
          value={getShare(inactive, students.length)}
        />
      </Panel>
      <Panel title="Recent IEPs">
        <IepTable ieps={ieps.slice(0, 5)} compact />
      </Panel>
      <Panel title="Report Notes">
        <div className="space-y-3 text-sm text-base-content/70">
          <p>
            Analytics are calculated from saved IEP records and active student
            profiles.
          </p>
          <p>
            Progress scores can be added later through the existing
            `progress_data` database table.
          </p>
        </div>
      </Panel>
    </div>
  );
};

const IepTable = ({ ieps, compact = false }) =>
  ieps.length ? (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>IEP</th>
            {!compact && <th>Student</th>}
            <th>Status</th>
            <th>Modified</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          {ieps.map((iep) => (
            <tr key={iep.id}>
              <td>
                <Link
                  to={`/iep/${iep.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {iep.title}
                </Link>
              </td>
              {!compact && (
                <td>{getIepStudentName(iep) || "No student name"}</td>
              )}
              <td>
                <span
                  className={`badge badge-sm ${
                    iep.status === "complete"
                      ? "badge-default"
                      : "badge-default"
                  }`}
                >
                  {iep.status}
                </span>
              </td>
              <td>{formatDate(iep.lastModified)}</td>
              <td>{getCompletionPercent(iep)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <EmptyReport message="No IEP records yet." />
  );

const ProgressBar = ({ label, value }) => (
  <div className="mb-4">
    <div className="mb-1 flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-base-200">
      <div
        className="h-full rounded-full bg-neutral"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  </div>
);

const EmptyReport = ({ message }) => (
  <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-8 text-center">
    <FileText className="h-8 w-8 opacity-50" />
    <p className="text-sm text-base-content/60">{message}</p>
  </div>
);

const getShare = (value, total) =>
  total ? Math.round((value / total) * 100) : 0;

export default Reports;

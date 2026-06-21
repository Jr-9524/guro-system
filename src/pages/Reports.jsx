import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  Plus,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Panel from "../components/common/Panel";
import Stat from "../components/common/Stat";
import SectionTabs from "../components/common/SectionTabs";
import PageHeader from "../components/common/PageHeader";
import AiProgressSummaryPanel from "../components/common/AiProgressSummaryPanel";
import FormalIepReport from "../components/reports/FormalIepReport";
import iepService from "../services/iepService";
import progressService from "../services/progressService";
import studentService from "../services/studentService";
import workspaceStoreService from "../services/workspaceStoreService";
import useAuthStore from "../stores/authStore";
import { downloadIepWordDocument } from "../services/iepExportService";
import { formatDate } from "../utils/dateUtils";
import { getIepStudentName } from "../utils/studentUtils";
import { getCompletionPercent, getComplianceIssues } from "../utils/iepUtils";
import {
  getGoalStatement,
  normalizeGoal,
  summarizeGoalProgress,
} from "../utils/goalUtils";
import {
  buildProgressSummaryPayload,
  getProgressSummaryKey,
} from "../utils/progressSummaryUtils";
import { hasPermission, PERMISSIONS } from "../utils/permissions";

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
  document: {
    title: "IEP Document",
    description: "Review a formal IEP document before printing or export.",
  },
};

const Reports = ({ view = "overview" }) => {
  const navigate = useNavigate();
  const { id: routeIepId } = useParams();
  const [searchParams] = useSearchParams();
  const config = reportConfig[view] || reportConfig.overview;
  const [students, setStudents] = useState([]);
  const [ieps, setIeps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressResult, setProgressResult] = useState({
    iepId: null,
    sessions: [],
  });
  const [includedSummaryResult, setIncludedSummaryResult] = useState({
    iepId: null,
    text: "",
  });
  const requestedIepId = routeIepId || searchParams.get("iepId") || "";
  const selectedIep =
    ieps.find((iep) => String(iep.id) === String(requestedIepId)) || null;
  const selectedStudent = selectedIep
    ? students.find(
        (student) => String(student.id) === String(selectedIep.studentId),
      ) || null
    : null;
  const progressSessions =
    String(progressResult.iepId) === String(selectedIep?.id)
      ? progressResult.sessions
      : [];
  const isProgressLoading =
    Boolean(selectedIep) &&
    String(progressResult.iepId) !== String(selectedIep.id);
  const includedProgressSummary =
    String(includedSummaryResult.iepId) === String(selectedIep?.id)
      ? includedSummaryResult.text
      : "";

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

  useEffect(() => {
    let isCurrent = true;
    if (!selectedIep) return undefined;

    progressService
      .getByIEP(selectedIep.id)
      .then((records) => {
        if (isCurrent) {
          setProgressResult({ iepId: selectedIep.id, sessions: records });
        }
      })
      .catch(() => {
        if (isCurrent) {
          setProgressResult({ iepId: selectedIep.id, sessions: [] });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedIep]);

  useEffect(() => {
    let isCurrent = true;
    if (!selectedIep) return undefined;

    workspaceStoreService
      .get(getProgressSummaryKey(selectedIep.id), "")
      .then((text) => {
        if (isCurrent) {
          setIncludedSummaryResult({
            iepId: selectedIep.id,
            text: text || "",
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedIep]);

  const selectIep = (iepId) => {
    navigate(iepId ? `/reports/iep?iepId=${encodeURIComponent(iepId)}` : "/reports/iep");
  };

  const selectProgressIep = (iepId) => {
    navigate(
      iepId
        ? `/reports/progress?iepId=${encodeURIComponent(iepId)}`
        : "/reports/progress",
    );
  };

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
      <PageHeader
        className="report-screen-only"
        title={config.title}
        description={config.description}
        actions={
          <>
            <Button onClick={() => navigate("/iep/new")} icon={Plus}>
              New IEP
            </Button>
            {view !== "document" && (
              <Button variant="secondary" onClick={() => window.print()} icon={Printer}>
                Print
              </Button>
            )}
          </>
        }
      />

      <div className="report-screen-only">
        <ReportTabs activeView={view} />
      </div>

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center rounded-lg border border-gray-300 bg-base-100">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {view !== "progress" && view !== "document" && (
            <SummaryGrid
              students={students}
              ieps={ieps}
              reportData={reportData}
            />
          )}

          {view === "overview" && (
            <OverviewReport students={students} ieps={ieps} data={reportData} />
          )}
          {view === "progress" && (
            <ProgressReport
              ieps={ieps}
              selectedIep={selectedIep}
              selectedStudent={selectedStudent}
              progressSessions={progressSessions}
              isProgressLoading={isProgressLoading}
              onSelectIep={selectProgressIep}
              onIncluded={(text) =>
                setIncludedSummaryResult({
                  iepId: selectedIep?.id || null,
                  text,
                })
              }
            />
          )}
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
          {view === "document" && (
            <IepDocumentReport
              ieps={ieps}
              selectedIep={selectedIep}
              selectedStudent={selectedStudent}
              progressSessions={progressSessions}
              isProgressLoading={isProgressLoading}
              onSelectIep={selectIep}
              includedProgressSummary={includedProgressSummary}
            />
          )}
        </>
      )}
    </div>
  );
};

const ReportTabs = ({ activeView }) => {
  const { user } = useAuthStore();
  const items = [
    { id: "overview", label: "Overview", href: "/reports" },
    { id: "document", label: "IEP Document", href: "/reports/iep" },
    { id: "progress", label: "Progress", href: "/reports/progress" },
    {
      id: "compliance",
      label: "Compliance",
      href: "/reports/compliance",
      permission: PERMISSIONS.AUDIT_READ,
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/reports/analytics",
      permission: PERMISSIONS.AUDIT_READ,
    },
  ].filter((item) => hasPermission(user, item.permission));

  return (
    <SectionTabs label="Report views" activeId={activeView} items={items} />
  );
};

const IepDocumentReport = ({
  ieps,
  selectedIep,
  selectedStudent,
  progressSessions,
  isProgressLoading,
  onSelectIep,
  includedProgressSummary,
}) => {
  if (!ieps.length) {
    return (
      <div className="report-screen-only">
        <EmptyReport message="No IEPs are available. Create and save an IEP before generating a report." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Panel className="report-screen-only">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="form-control w-full">
            <span className="mb-1.5 text-sm font-medium">Choose an IEP</span>
            <select
              className="select select-bordered w-full"
              value={selectedIep?.id || ""}
              onChange={(event) => onSelectIep(event.target.value)}
            >
              <option value="">Select an IEP to preview</option>
              {ieps.map((iep) => (
                <option key={iep.id} value={iep.id}>
                  {getIepStudentName(iep) || "Unnamed student"} - {iep.title}
                </option>
              ))}
            </select>
            <span className="mt-2 text-xs text-base-content/60">
              Review the complete document and correct the IEP before printing
              or exporting it.
            </span>
          </label>

          {selectedIep && (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/iep/${selectedIep.id}/edit`}
                className="btn btn-ghost"
              >
                <Pencil className="h-4 w-4" /> Edit IEP
              </Link>
              <Button
                icon={Download}
                variant="secondary"
                onClick={() =>
                  downloadIepWordDocument({
                    title: selectedIep.title,
                    data: selectedIep.data,
                    student: selectedStudent,
                    progressSessions,
                    aiProgressSummary: includedProgressSummary,
                  })
                }
              >
                Export Word
              </Button>
              <Button icon={Printer} onClick={() => window.print()}>
                Print
              </Button>
            </div>
          )}
        </div>
      </Panel>

      {selectedIep ? (
        <>
          {isProgressLoading && (
            <p className="report-screen-only text-center text-sm text-base-content/60">
              Loading recent progress notes...
            </p>
          )}
          <FormalIepReport
            iep={selectedIep}
            student={selectedStudent}
            progressSessions={progressSessions}
            aiProgressSummary={includedProgressSummary}
          />
        </>
      ) : (
        <div className="report-screen-only">
          <EmptyReport message="Select an IEP to preview the formal document." />
        </div>
      )}
    </div>
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

const ProgressReport = ({
  ieps,
  selectedIep,
  progressSessions,
  isProgressLoading,
  onSelectIep,
  onIncluded,
}) => {
  const [summaryDraft, setSummaryDraft] = useState({ iepId: null, text: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const goalRecords = getUniqueGoalRecords(ieps);
  const reportIeps = goalRecords.map(({ iep, goal }) => ({
    ...iep,
    data: { ...iep.data, goals: [goal] },
  }));
  const summary = summarizeGoalProgress(reportIeps);
  const aiSummary =
    String(summaryDraft.iepId) === String(selectedIep?.id)
      ? summaryDraft.text
      : "";

  const generateSummary = async () => {
    if (!selectedIep) {
      toast.error("Choose an IEP before generating a progress summary");
      return;
    }
    if (!window.electronAPI?.ai?.summarizeProgress) {
      toast.error("AI progress summaries are available in the GURO desktop app");
      return;
    }

    setIsGenerating(true);
    try {
      const text = await window.electronAPI.ai.summarizeProgress(
        buildProgressSummaryPayload({
          iep: selectedIep,
          studentName: getIepStudentName(selectedIep),
          progressSessions,
        }),
      );
      setSummaryDraft({ iepId: selectedIep.id, text });
      toast.success("AI progress summary generated for review");
    } catch (error) {
      toast.error(error.message || "Unable to generate the progress summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(aiSummary);
      toast.success("Progress summary copied");
    } catch {
      toast.error("Could not copy the progress summary");
    }
  };

  const includeSummary = async () => {
    if (!selectedIep || !aiSummary.trim()) return;
    try {
      await workspaceStoreService.set(
        getProgressSummaryKey(selectedIep.id),
        aiSummary.trim(),
      );
      onIncluded(aiSummary.trim());
      toast.success("Progress summary included in the printable IEP report");
    } catch (error) {
      toast.error(error.message || "Could not include the summary in the report");
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="AI Progress Summary">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="form-control w-full">
            <span className="mb-1.5 text-sm font-medium">IEP record</span>
            <select
              className="select select-bordered w-full"
              value={selectedIep?.id || ""}
              onChange={(event) => onSelectIep(event.target.value)}
            >
              <option value="">Choose an IEP</option>
              {ieps.map((iep) => (
                <option key={iep.id} value={iep.id}>
                  {getIepStudentName(iep) || "Unnamed student"} - {iep.title}
                </option>
              ))}
            </select>
          </label>
          <Button
            icon={Sparkles}
            loading={isGenerating}
            disabled={!selectedIep || isProgressLoading}
            onClick={generateSummary}
          >
            {isGenerating
              ? "Generating summary..."
              : "Generate AI Progress Summary"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-base-content/55">
          Uses the selected IEP goals and recent saved progress records only.
        </p>
      </Panel>

      {aiSummary && (
        <AiProgressSummaryPanel
          value={aiSummary}
          onChange={(text) =>
            setSummaryDraft({ iepId: selectedIep.id, text })
          }
          onCopy={copySummary}
          onInclude={includeSummary}
        />
      )}
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
          <div className="divide-y divide-base-300">
            {summary.byArea.map((area) => (
              <div
                key={area.area}
                className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)_7rem] sm:items-center"
              >
                <span className="text-sm font-semibold">{area.area}</span>
                <div className="h-2 overflow-hidden rounded-full bg-base-200">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(area.progress, 100)}%` }}
                  />
                </div>
                <span className="text-sm text-base-content/60 sm:text-right">
                  {area.progress}% / {area.total} {area.total === 1 ? "goal" : "goals"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyReport message="No goal progress is available by area yet." />
        )}
      </Panel>

      <Panel title="Goal Progress Summary">
        {goalRecords.length ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Goal</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Monitoring</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {goalRecords.map(({ iep, goal }) => (
                  <tr key={`${iep.id}-${goal.id}`}>
                    <td className="whitespace-nowrap font-medium">
                      {getIepStudentName(iep) || "No student name"}
                    </td>
                    <td className="min-w-72 max-w-xl">
                      <p className="font-medium">{goal.area || "Goal"}</p>
                      <p className="line-clamp-2 text-sm text-base-content/60">
                        {getGoalStatement(goal)}
                      </p>
                    </td>
                    <td>
                      <span className="badge badge-outline whitespace-nowrap">
                        {goal.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-medium">
                      {goal.progressPercentage}%
                    </td>
                    <td className="min-w-40 text-sm text-base-content/60">
                      {goal.measurementMethod || "Not set"}
                      {goal.measurementFrequency
                        ? ` / ${goal.measurementFrequency}`
                        : ""}
                    </td>
                    <td>
                      <Link
                        to={`/iep/${iep.id}/view`}
                        className="btn btn-ghost btn-xs"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyReport message="No IEP goals available yet." />
        )}
      </Panel>
    </div>
  );
};

const getUniqueGoalRecords = (ieps) => {
  const newestFirst = [...ieps].sort(
    (a, b) =>
      new Date(b.lastModified || 0).getTime() -
      new Date(a.lastModified || 0).getTime(),
  );
  const seen = new Set();

  return newestFirst.flatMap((iep) =>
    (iep.data?.goals || []).map(normalizeGoal).flatMap((goal) => {
      const studentKey = String(
        iep.studentId || iep.data?.studentInfo?.studentId || getIepStudentName(iep),
      ).toLowerCase();
      const goalKey = `${goal.area}::${getGoalStatement(goal)}`
        .trim()
        .toLowerCase();
      const key = `${studentKey}::${goalKey}`;

      if (seen.has(key)) return [];
      seen.add(key);
      return [{ iep, goal }];
    }),
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
                  <Link to={`/iep/${iep.id}/view`} className="btn btn-xs">
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
                  to={`/iep/${iep.id}/view`}
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

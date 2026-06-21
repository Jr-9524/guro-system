import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Plus,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import SectionTabs from "../components/common/SectionTabs";
import Stat from "../components/common/Stat";
import Input from "../components/common/Input";
import AiProgressSummaryPanel from "../components/common/AiProgressSummaryPanel";
import PageHeader from "../components/common/PageHeader";
import SelectInput from "../components/forms/SelectInput";
import CreatableSelectInput from "../components/forms/CreatableSelectInput";
import iepService from "../services/iepService";
import progressService from "../services/progressService";
import { formatDate } from "../utils/dateUtils";
import { getIepStudentName } from "../utils/studentUtils";
import { getGoalStatement, normalizeGoal } from "../utils/goalUtils";
import { buildProgressSummaryPayload } from "../utils/progressSummaryUtils";

const today = () => new Date().toISOString().slice(0, 10);

const getPercent = (score, total) =>
  total > 0 ? Math.round((Number(score) / Number(total)) * 100) : 0;

const getTargetPercent = (goal) => {
  const match = String(goal.accuracy || goal.annualGoal?.criteria || "").match(
    /\d+(?:\.\d+)?/,
  );
  const target = Number(match?.[0]);
  return Number.isFinite(target) && target > 0 ? target : 80;
};

const daysSince = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return Infinity;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
};

const statusStyles = {
  "Not Started": "badge-ghost",
  "In Progress": "badge-info",
  "Needs Attention": "badge-warning",
  Completed: "badge-success",
};

const ProgressMonitoring = () => {
  const [ieps, setIeps] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedIepId, setSelectedIepId] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiProgressSummary, setAiProgressSummary] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [visibleNotes, setVisibleNotes] = useState(5);
  const [formData, setFormData] = useState({
    sessionDate: today(),
    score: "",
    total: "",
    notes: "",
    teacherObservation: "",
  });

  useEffect(() => {
    let isCurrent = true;

    iepService
      .getAll()
      .then((records) => {
        if (isCurrent) setIeps(records);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const studentOptions = useMemo(() => {
    const students = new Map();
    ieps.forEach((iep) => {
      if (iep.studentId && !students.has(iep.studentId)) {
        students.set(
          iep.studentId,
          getIepStudentName(iep) || "Unnamed student",
        );
      }
    });

    return [...students.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ieps]);

  const studentIeps = useMemo(
    () => ieps.filter((iep) => iep.studentId === selectedStudentId),
    [ieps, selectedStudentId],
  );

  const selectedIep = useMemo(
    () => studentIeps.find((iep) => iep.id === selectedIepId),
    [selectedIepId, studentIeps],
  );

  const goals = useMemo(
    () => (selectedIep?.data?.goals || []).map(normalizeGoal),
    [selectedIep],
  );

  useEffect(() => {
    let isCurrent = true;

    if (!selectedIepId) {
      return undefined;
    }

    progressService
      .getByIEP(selectedIepId)
      .then((records) => {
        if (isCurrent) setSessions(records);
      })
      .finally(() => {
        if (isCurrent) setIsSessionLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedIepId]);

  const goalMetrics = useMemo(
    () =>
      goals.map((goal, index) => {
        const goalSessions = sessions
          .filter((session) => String(session.goalId) === String(goal.id))
          .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
        const latest = goalSessions[0];
        const percent = latest
          ? getPercent(latest.score, latest.total)
          : goal.progressPercentage;
        const isStale = latest ? daysSince(latest.sessionDate) > 14 : true;
        const isCompleted = latest && percent >= getTargetPercent(goal);
        const needsAttention =
          !isCompleted &&
          (percent < 50 || isStale || goal.status === "Needs Attention");
        const status = !latest
          ? goal.status
          : isCompleted
            ? "Completed"
            : needsAttention
              ? "Needs Attention"
              : "In Progress";

        return {
          goal,
          index,
          latest,
          percent,
          status,
          needsAttention,
        };
      }),
    [goals, sessions],
  );

  const timeline = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))
        .map((session) => ({
          ...session,
          goal: goals.find(
            (goal) => String(goal.id) === String(session.goalId),
          ),
        })),
    [goals, sessions],
  );

  const summary = useMemo(() => {
    const latest = timeline[0];
    return {
      activeGoals: goals.length,
      completed: goalMetrics.filter(({ status }) => status === "Completed")
        .length,
      needsAttention: goalMetrics.filter((item) => item.needsAttention).length,
      lastUpdate: latest ? formatDate(latest.sessionDate) : "No updates",
    };
  }, [goalMetrics, goals.length, timeline]);

  const handleStudentSelect = (studentId) => {
    const nextIep = ieps.find((iep) => iep.studentId === studentId);
    setSelectedStudentId(studentId);
    setSelectedIepId(nextIep?.id || "");
    setSelectedGoalId("");
    setSessions([]);
    setIsSessionLoading(Boolean(nextIep));
    setActiveTab("overview");
    setVisibleNotes(5);
    setAiProgressSummary("");
  };

  const openNoteModal = (goalId) => {
    if (!selectedIepId || !goals.length) {
      toast.error("Choose a student with an IEP goal first");
      return;
    }
    setSelectedGoalId(String(goalId || goals[0].id));
    setIsNoteModalOpen(true);
  };

  const handleLogSession = async (event) => {
    event.preventDefault();

    if (!selectedIepId || !selectedGoalId) {
      toast.error("Choose a goal first");
      return;
    }
    if (!formData.sessionDate || !formData.score || !formData.total) {
      toast.error("Date, score, and total are required");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await progressService.logSession({
        iepId: selectedIepId,
        goalId: selectedGoalId,
        sessionDate: formData.sessionDate,
        score: Number(formData.score),
        total: Number(formData.total),
        notes: [
          formData.notes,
          formData.teacherObservation
            ? `Teacher observation: ${formData.teacherObservation}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        recordedBy: null,
      });
      const percent = getPercent(saved.score, saved.total);
      const updatedIep = await iepService.save({
        ...selectedIep,
        data: {
          ...selectedIep.data,
          goals: goals.map((goal) =>
            String(goal.id) === selectedGoalId
              ? normalizeGoal({
                  ...goal,
                  progressPercentage: percent,
                  status:
                    percent >= getTargetPercent(goal)
                      ? "Completed"
                      : percent < 50
                        ? "Needs Attention"
                        : "In Progress",
                })
              : goal,
          ),
        },
      });
      setIeps((current) =>
        current.map((iep) => (iep.id === updatedIep.id ? updatedIep : iep)),
      );
      setSessions((current) => [saved, ...current]);
      setAiProgressSummary("");
      setFormData({
        sessionDate: today(),
        score: "",
        total: "",
        notes: "",
        teacherObservation: "",
      });
      setIsNoteModalOpen(false);
      toast.success("Progress note saved");
    } catch (error) {
      toast.error(error.message || "Failed to save progress note");
    } finally {
      setIsSaving(false);
    }
  };

  const generateProgressSummary = async () => {
    if (!selectedIep) {
      toast.error("Choose a student and IEP before generating a summary");
      return;
    }
    if (!window.electronAPI?.ai?.summarizeProgress) {
      toast.error("AI progress summaries are available in the GURO desktop app");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const text = await window.electronAPI.ai.summarizeProgress(
        buildProgressSummaryPayload({
          iep: selectedIep,
          studentName: getIepStudentName(selectedIep),
          progressSessions: sessions,
        }),
      );
      setAiProgressSummary(text);
      toast.success("Progress summary generated for teacher review");
    } catch (error) {
      toast.error(error.message || "Unable to generate the progress summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const copyProgressSummary = async () => {
    try {
      await navigator.clipboard.writeText(aiProgressSummary);
      toast.success("Progress summary copied");
    } catch {
      toast.error("Could not copy the progress summary");
    }
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <PageHeader
        title="Progress Monitoring"
        description="Review goal progress and record teacher observations after learning activities."
        actions={
          <>
            <Button variant="secondary" icon={Sparkles} loading={isGeneratingSummary} disabled={!selectedIep || isSessionLoading} onClick={generateProgressSummary}>
              {isGeneratingSummary ? "Generating summary..." : "Generate Progress Summary"}
            </Button>
            <Button icon={Plus} onClick={() => openNoteModal()}>
              Add Progress Note
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center rounded-2xl border border-base-300 bg-base-100">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="max-w-xl">
              <CreatableSelectInput
                label="Student"
                helperText="Select the learner whose IEP goals you want to review."
                value={selectedStudentId}
                onChange={handleStudentSelect}
                options={studentOptions}
                placeholder="Search or choose a student"
                allowCreate={false}
              />
            </div>
            {selectedStudentId && studentIeps.length > 1 && (
              <div className="mt-4 max-w-xl">
                <SelectInput
                  label="IEP record"
                  value={selectedIepId}
                  onChange={(iepId) => {
                    setSelectedIepId(iepId);
                    setSelectedGoalId("");
                    setSessions([]);
                    setIsSessionLoading(true);
                    setActiveTab("overview");
                    setVisibleNotes(5);
                    setAiProgressSummary("");
                  }}
                  options={studentIeps.map((iep) => ({
                    value: iep.id,
                    label: iep.title,
                  }))}
                />
              </div>
            )}
          </section>

          {!selectedStudentId ? (
            <EmptyState
              icon={Target}
              title="Select a student"
              message="Select a student to view progress records and goal updates."
            />
          ) : !goals.length ? (
            <EmptyState
              icon={Target}
              title="No IEP goals available"
              message="Create or save an IEP with annual goals before recording progress."
            />
          ) : (
            <>
              <SectionTabs
                label="Progress views"
                activeId={activeTab}
                onChange={setActiveTab}
                items={[
                  { id: "overview", label: "Overview" },
                  { id: "goals", label: "Goals" },
                  { id: "timeline", label: "Timeline" },
                  { id: "attention", label: "Needs Attention" },
                ]}
              />

              {aiProgressSummary && (
                <AiProgressSummaryPanel
                  value={aiProgressSummary}
                  onChange={setAiProgressSummary}
                  onCopy={copyProgressSummary}
                />
              )}

              {activeTab === "overview" && (
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <Stat
                    label="Active Goals"
                    value={summary.activeGoals}
                    icon={Target}
                  />
                  <Stat
                    label="Completed Objectives"
                    value={summary.completed}
                    icon={CheckCircle2}
                    variant="success"
                  />
                  <Stat
                    label="Needs Attention"
                    value={summary.needsAttention}
                    icon={AlertTriangle}
                    variant="warning"
                  />
                  <Stat
                    label="Last Progress Update"
                    value={summary.lastUpdate}
                    icon={Clock3}
                    variant="slate"
                    className="[&_h3]:text-xl"
                  />
                </div>
              )}

              {activeTab === "goals" && (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold">Goal Progress</h2>
                    <p className="mt-1 text-sm text-base-content/60">
                      Progress percentage is based on the most recent recorded
                      score for each goal.
                    </p>
                  </div>
                  {isSessionLoading ? (
                    <ProgressLoading />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                      {goalMetrics.map((item) => (
                        <GoalCard
                          key={item.goal.id}
                          item={item}
                          onAddNote={() => openNoteModal(item.goal.id)}
                          onUpdate={() => openNoteModal(item.goal.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "timeline" && (
                <section className="max-w-3xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                  <h2 className="text-lg font-bold">Progress Timeline</h2>
                  <p className="mb-5 mt-1 text-sm text-base-content/60">
                    Add a note after an activity, assessment, or meaningful
                    observation.
                  </p>
                  {isSessionLoading ? (
                    <ProgressLoading />
                  ) : (
                    <>
                      <ProgressTimeline
                        items={timeline.slice(0, visibleNotes)}
                      />
                      {visibleNotes < timeline.length && (
                        <div className="mt-5 flex justify-center">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              setVisibleNotes((count) => count + 5)
                            }
                          >
                            Show more notes
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              {activeTab === "attention" && (
                <section className="max-w-3xl rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                  <h2 className="text-lg font-bold">Needs Attention</h2>
                  <p className="mb-5 mt-1 text-sm text-base-content/60">
                    Goals appear here when progress is below 50% or no update
                    has been recorded for more than 14 days.
                  </p>
                  {isSessionLoading ? (
                    <ProgressLoading />
                  ) : (
                    <NeedsAttentionList
                      items={goalMetrics.filter((item) => item.needsAttention)}
                      onUpdate={openNoteModal}
                    />
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}

      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Progress Note"
        size="lg"
      >
        <ProgressNoteForm
          goals={goals}
          selectedGoalId={selectedGoalId}
          setSelectedGoalId={setSelectedGoalId}
          formData={formData}
          setFormData={setFormData}
          isSaving={isSaving}
          onSubmit={handleLogSession}
        />
      </Modal>
    </div>
  );
};

const GoalCard = ({ item, onAddNote, onUpdate }) => (
  <article className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-base-content">
          {item.goal.area || `Goal ${item.index + 1}`}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold">
          {getGoalStatement(item.goal)}
        </h3>
      </div>
      <span className={`badge shrink-0 ${statusStyles[item.status]}`}>
        {item.status}
      </span>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-base-200 p-3 text-center">
      <ProgressPoint
        label="Baseline"
        value={item.goal.baselineValue || "Not set"}
      />
      <ProgressPoint
        label="Current"
        value={
          item.latest
            ? `${item.latest.score}/${item.latest.total}`
            : `${item.percent}%`
        }
      />
      <ProgressPoint
        label="Target"
        value={item.goal.annualGoal.criteria || "Not set"}
      />
    </div>
    <div className="mt-4 flex items-end justify-between">
      <span className="text-sm text-base-content/60">Progress percentage</span>
      <span className="text-2xl font-black">{item.percent}%</span>
    </div>
    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-base-200">
      <div
        className={`h-full rounded-full ${
          item.status === "Needs Attention" ? "bg-warning" : "bg-primary"
        }`}
        style={{ width: `${Math.min(Math.max(item.percent, 0), 100)}%` }}
      />
    </div>
    <p className="mt-2 text-xs text-base-content/50">
      {item.latest
        ? `Last updated ${formatDate(item.latest.sessionDate)}`
        : "No progress recorded yet"}
    </p>
    <p className="mt-1 text-xs text-base-content/50">
      {item.goal.measurementMethod || "Measurement not set"} |{" "}
      {item.goal.objectives.length} short-term objectives
    </p>

    {item.goal.objectives.length > 0 && (
      <div className="mt-4 border-t border-base-300 pt-3">
        <p className="text-xs font-bold uppercase tracking-wide text-base-content/50">
          Objectives
        </p>
        <div className="mt-2 space-y-2">
          {item.goal.objectives.map((objective) => (
            <div key={objective.id} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  objective.status === "Completed"
                    ? "border-success bg-success text-success-content"
                    : "border-base-300"
                }`}
              >
                {objective.status === "Completed" && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </span>
              <span className="text-base-content/70">
                {objective.description || "Untitled objective"}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {item.latest?.notes && (
      <p className="mt-4 rounded-xl border border-base-300 bg-base-200/50 p-3 text-sm text-base-content/70">
        <strong>Recent note:</strong> {item.latest.notes}
      </p>
    )}

    {item.needsAttention && (
      <p className="mt-4 rounded-xl border border-warning/25 bg-warning/5 p-3 text-sm text-base-content/70">
        This goal may need follow-up because progress is below 50% or it has not
        been updated recently.
      </p>
    )}

    <div className="mt-4 flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={onAddNote}>
        Add Note
      </Button>
      <Button size="sm" onClick={onUpdate}>
        Update Progress
      </Button>
    </div>
  </article>
);

const ProgressPoint = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-wide text-base-content/45">
      {label}
    </p>
    <p className="mt-1 line-clamp-2 text-xs font-semibold">{value}</p>
  </div>
);

const ProgressLoading = () => (
  <div className="rounded-xl border border-base-300 py-12 text-center">
    <LoadingSpinner />
  </div>
);

const NeedsAttentionList = ({ items, onUpdate }) =>
  items.length ? (
    <div className="space-y-2">
      {items.map(({ goal, percent, latest }) => (
        <button
          key={goal.id}
          type="button"
          onClick={() => onUpdate(goal.id)}
          className="w-full rounded-xl border border-warning/25 bg-warning/5 p-3 text-left transition-colors hover:bg-warning/10"
        >
          <span className="block text-sm font-semibold">
            {goal.area || "IEP Goal"}
          </span>
          <span className="mt-1 block text-xs text-base-content/60">
            {latest ? `${percent}% progress` : "No progress update recorded"}
          </span>
        </button>
      ))}
    </div>
  ) : (
    <p className="rounded-xl border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60">
      No goals currently need attention.
    </p>
  );

const ProgressTimeline = ({ items }) =>
  items.length ? (
    <div className="space-y-0">
      {items.map((session, index) => (
        <div key={session.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && (
            <span className="absolute left-[7px] top-5 h-[calc(100%-0.5rem)] w-px bg-base-300" />
          )}
          <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-4 border-primary/20 bg-primary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-base-content/50">
              {formatDate(session.sessionDate)}
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {session.goal?.area || "IEP Goal"}
            </p>
            <p className="mt-1 text-sm leading-5 text-base-content/70">
              {session.notes || "Progress score recorded."}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-base-content">
              {session.score}/{session.total} (
              {getPercent(session.score, session.total)}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="rounded-xl border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60">
      No progress notes yet. Add a note after an activity or assessment.
    </p>
  );

const ProgressNoteForm = ({
  goals,
  selectedGoalId,
  setSelectedGoalId,
  formData,
  setFormData,
  isSaving,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <SelectInput
      label="Goal"
      value={selectedGoalId}
      onChange={setSelectedGoalId}
      options={goals.map((goal, index) => ({
        value: String(goal.id),
        label: goal.area || `Goal ${index + 1}`,
      }))}
      placeholder="Choose a goal"
    />
    <Input
      label="Date"
      type="date"
      value={formData.sessionDate}
      onChange={(event) =>
        setFormData((current) => ({
          ...current,
          sessionDate: event.target.value,
        }))
      }
    />
    <div className="grid grid-cols-2 gap-3">
      <Input
        label="Score"
        type="number"
        min="0"
        value={formData.score}
        onChange={(event) =>
          setFormData((current) => ({ ...current, score: event.target.value }))
        }
        placeholder="8"
      />
      <Input
        label="Total possible"
        type="number"
        min="1"
        value={formData.total}
        onChange={(event) =>
          setFormData((current) => ({ ...current, total: event.target.value }))
        }
        placeholder="10"
      />
    </div>
    <div className="rounded-xl bg-base-200 p-3 text-sm">
      <span className="text-base-content/60">Calculated progress: </span>
      <strong>
        {formData.score && formData.total
          ? `${getPercent(formData.score, formData.total)}%`
          : "Enter a score and total"}
      </strong>
    </div>
    <label className="flex flex-col gap-1.5">
      <span className="mb-1.5 text-sm font-semibold text-base-content/80">
        Teacher note
      </span>
      <textarea
        className="min-h-28 rounded-xl border border-base-300 bg-base-100 px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
        value={formData.notes}
        onChange={(event) =>
          setFormData((current) => ({ ...current, notes: event.target.value }))
        }
        placeholder="Describe the activity, support provided, and what you observed."
      />
    </label>
    <label className="flex flex-col gap-1.5">
      <span className="mb-1.5 text-sm font-semibold text-base-content/80">
        Teacher observation
      </span>
      <textarea
        className="min-h-24 rounded-xl border border-base-300 bg-base-100 px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
        value={formData.teacherObservation}
        onChange={(event) =>
          setFormData((current) => ({
            ...current,
            teacherObservation: event.target.value,
          }))
        }
        placeholder="What support helped? What should the next teacher try?"
      />
    </label>
    <p className="text-xs leading-5 text-base-content/55">
      Add a note after an activity or assessment so the next teacher can
      understand what supported the result.
    </p>
    <div className="flex justify-end">
      <Button type="submit" loading={isSaving} icon={Save}>
        Save Progress Note
      </Button>
    </div>
  </form>
);

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
    <Icon className="mx-auto h-10 w-10 text-base-content/35" />
    <p className="mt-3 font-semibold">{title}</p>
    <p className="mx-auto mt-1 max-w-lg text-sm text-base-content/60">
      {message}
    </p>
  </div>
);

export default ProgressMonitoring;

// Progress Monitoring is used to record goal-session scores and notes for saved IEP goals.
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Plus,
  Save,
  Target,
} from "lucide-react";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Panel from "../components/common/Panel";
import Stat from "../components/common/Stat";
import Input from "../components/common/Input";
import SelectInput from "../components/forms/SelectInput";
import iepService from "../services/iepService";
import progressService from "../services/progressService";
import { formatDate } from "../utils/dateUtils";
import { getStudentName } from "../utils/studentUtils";

const today = () => new Date().toISOString().slice(0, 10);

const getGoalLabel = (goal, index) =>
  `${goal.area || `Goal ${index + 1}`}: ${
    goal.description?.slice(0, 80) || "No description"
  }`;

const getPercent = (score, total) =>
  total > 0 ? Math.round((Number(score) / Number(total)) * 100) : 0;

const ProgressMonitoring = () => {
  const [ieps, setIeps] = useState([]);
  const [selectedIepId, setSelectedIepId] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    sessionDate: today(),
    score: "",
    total: "",
    notes: "",
  });

  useEffect(() => {
    let isCurrent = true;

    const loadIeps = async () => {
      setIsLoading(true);
      try {
        const records = await iepService.getAll();
        if (!isCurrent) return;
        setIeps(records);
        setSelectedIepId((current) => current || records[0]?.id || "");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadIeps();

    return () => {
      isCurrent = false;
    };
  }, []);

  const selectedIep = useMemo(
    () => ieps.find((iep) => iep.id === selectedIepId),
    [ieps, selectedIepId],
  );

  const goals = useMemo(() => selectedIep?.data?.goals || [], [selectedIep]);
  const effectiveGoalId = goals.some(
    (goal) => String(goal.id) === selectedGoalId,
  )
    ? selectedGoalId
    : goals[0]?.id
      ? String(goals[0].id)
      : "";

  useEffect(() => {
    let isCurrent = true;

    const loadSessions = async () => {
      if (!selectedIepId) {
        setSessions([]);
        return;
      }

      setIsSessionLoading(true);
      try {
        const records = await progressService.getByIEP(selectedIepId);
        if (isCurrent) setSessions(records);
      } finally {
        if (isCurrent) setIsSessionLoading(false);
      }
    };

    loadSessions();

    return () => {
      isCurrent = false;
    };
  }, [selectedIepId]);

  const selectedGoalSessions = useMemo(
    () =>
      sessions.filter((session) => String(session.goalId) === effectiveGoalId),
    [effectiveGoalId, sessions],
  );

  const stats = useMemo(() => {
    const latest = selectedGoalSessions[0];
    const average = selectedGoalSessions.length
      ? Math.round(
          selectedGoalSessions.reduce(
            (total, session) =>
              total + getPercent(session.score, session.total),
            0,
          ) / selectedGoalSessions.length,
        )
      : 0;

    return {
      sessions: selectedGoalSessions.length,
      latestPercent: latest ? getPercent(latest.score, latest.total) : 0,
      average,
    };
  }, [selectedGoalSessions]);

  const handleLogSession = async (event) => {
    event.preventDefault();

    if (!selectedIepId || !effectiveGoalId) {
      toast.error("Choose an IEP and goal first");
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
        goalId: effectiveGoalId,
        sessionDate: formData.sessionDate,
        score: Number(formData.score),
        total: Number(formData.total),
        notes: formData.notes,
        recordedBy: null,
      });
      setSessions((current) => [saved, ...current]);
      setFormData({ sessionDate: today(), score: "", total: "", notes: "" });
      toast.success("Progress session logged");
    } catch (error) {
      toast.error(error.message || "Failed to log progress");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress Monitoring</h1>
          <p className="text-sm text-base-content/60">
            Log goal sessions and watch student progress over time.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[20rem] items-center justify-center rounded-lg border border-gray-300 bg-base-100">
          <LoadingSpinner size="lg" />
        </div>
      ) : ieps.length > 0 ? (
        <>
          <section className="rounded-lg border border-gray-300 bg-base-100 p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <SelectInput
                label="IEP"
                value={selectedIepId}
                onChange={setSelectedIepId}
                options={ieps.map((iep) => ({
                  value: iep.id,
                  label: `${iep.title} - ${getStudentName(iep) || "No student"}`,
                }))}
                placeholder="Select and IEP"
              />
              <SelectInput
                label="Goal"
                value={effectiveGoalId}
                onChange={setSelectedGoalId}
                options={goals.map((goal, index) => ({
                  value: String(goal.id),
                  label: getGoalLabel(goal, index),
                }))}
                placeholder="Select a goal"
              />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Stat
                  label="Sessions"
                  value={stats.sessions}
                  icon={ClipboardList}
                />
                <Stat
                  label="Latest Score"
                  value={`${stats.latestPercent}%`}
                  icon={Activity}
                />
                <Stat
                  label="Average"
                  value={`${stats.average}%`}
                  icon={BarChart3}
                />
              </div>

              <Panel title="Recent Sessions">
                {isSessionLoading ? (
                  <div className="py-8 text-center">
                    <LoadingSpinner />
                  </div>
                ) : selectedGoalSessions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedGoalSessions.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </Panel>
            </div>

            <Panel title="Log Session">
              <form onSubmit={handleLogSession} className="space-y-4">
                <Input
                  label="Session date"
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
                    value={formData.score}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        score: event.target.value,
                      }))
                    }
                    placeholder="8"
                  />

                  <Input
                    label="Total"
                    type="number"
                    value={formData.total}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        total: event.target.value,
                      }))
                    }
                    placeholder="10"
                  />
                </div>
                <label className="form-control">
                  <span className="label pb-2">
                    <span className="label-text">Notes</span>
                  </span>
                  <textarea
                    className="textarea textarea-bordered min-h-28 border border-gray-300"
                    value={formData.notes}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Prompting, accommodations used, behavior notes..."
                  />
                </label>
                <Button type="submit" loading={isSaving} icon={Save}>
                  Save Session
                </Button>
              </form>
            </Panel>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-base-100 p-8 text-center">
          <Target className="mx-auto h-10 w-10 opacity-50" />
          <p className="mt-3 font-semibold">No IEP goals available</p>
          <p className="mt-1 text-sm text-base-content/60">
            Create or save an IEP with annual goals before logging progress.
          </p>
        </div>
      )}
    </div>
  );
};

const SessionRow = ({ session }) => {
  const percent = getPercent(session.score, session.total);

  return (
    <div className="rounded-lg border border-gray-300 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="h-4 w-4 opacity-60" />
          {formatDate(session.sessionDate)}
        </div>
        <span className="badge badge-outline">
          {session.score}/{session.total} ({percent}%)
        </span>
      </div>
      {session.notes && (
        <p className="mt-2 text-sm text-base-content/70">{session.notes}</p>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-base-200">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
    <Plus className="mx-auto h-8 w-8 opacity-50" />
    <p className="mt-2 text-sm text-base-content/60">
      No sessions logged for this goal yet.
    </p>
  </div>
);

export default ProgressMonitoring;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ClipboardCopy, Plus, Send, Trash2 } from "lucide-react";

import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import SelectInput from "../components/forms/SelectInput";
import SelectFilter from "../components/filters/SelectFilter";
import Stat from "../components/common/Stat";
import TextAreaInput from "../components/forms/TextAreaInput";
import SearchInput from "../components/common/SearchInput";

import workspaceStoreService from "../services/workspaceStoreService";
import { loadCustomGoals, saveCustomGoals } from "../services/goalBankService";
import { PENDING_GOAL_KEY, seededGoals } from "../data/goalBankTemplates";

const emptyGoal = {
  area: "",
  category: "",
  gradeBand: "",
  title: "",
  description: "",
  criteria: "",
  measurement: "",
};

const GoalBank = () => {
  const navigate = useNavigate();
  const [customGoals, setCustomGoals] = useState([]);
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftGoal, setDraftGoal] = useState(emptyGoal);

  useEffect(() => {
    let isCurrent = true;

    loadCustomGoals().then((goals) => {
      if (isCurrent) setCustomGoals(goals);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const goals = useMemo(() => [...seededGoals, ...customGoals], [customGoals]);
  const areas = useMemo(
    () => [
      "All areas",
      ...new Set(goals.map((goal) => goal.area).filter(Boolean)),
    ],
    [goals],
  );
  const categories = useMemo(
    () => [
      "All categories",
      ...new Set(goals.map((goal) => goal.category).filter(Boolean)),
    ],
    [goals],
  );

  const filteredGoals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return goals.filter((goal) => {
      const matchesQuery =
        !normalizedQuery ||
        [goal.title, goal.description, goal.area, goal.category, goal.gradeBand]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesArea = areaFilter === "all" || goal.area === areaFilter;
      const matchesCategory =
        categoryFilter === "all" || goal.category === categoryFilter;

      return matchesQuery && matchesArea && matchesCategory;
    });
  }, [areaFilter, categoryFilter, goals, query]);

  const copyGoal = async (goal) => {
    await navigator.clipboard.writeText(goal.description);
    toast.success("Goal copied");
  };

  const sendToIep = async (goal) => {
    await workspaceStoreService.set(PENDING_GOAL_KEY, {
      area: goal.area,
      description: goal.description,
      accuracy: goal.criteria,
      measurement: goal.measurement,
      sessions: "As documented",
      date: "",
    });
    toast.success("Goal queued for IEP builder");
    navigate("/iep/new");
  };

  const saveGoal = async (event) => {
    event.preventDefault();

    if (!draftGoal.title.trim() || !draftGoal.description.trim()) {
      toast.error("Goal title and description are required");
      return;
    }

    const nextGoals = [
      ...customGoals,
      {
        ...draftGoal,
        id: `custom-${Date.now()}`,
        source: "custom",
      },
    ];
    setCustomGoals(nextGoals);
    await saveCustomGoals(nextGoals);
    setDraftGoal(emptyGoal);
    setIsModalOpen(false);
    toast.success("Goal template saved");
  };

  const deleteCustomGoal = async (goalId) => {
    const nextGoals = customGoals.filter((goal) => goal.id !== goalId);
    setCustomGoals(nextGoals);
    await saveCustomGoals(nextGoals);
    toast.success("Custom goal deleted");
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goal Bank</h1>
          <p className="text-sm text-base-content/60">
            Search reusable SMART goal templates and send one into the IEP
            builder.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
          New Template
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Templates"
          value={goals.length}
          // icon={CheckCircle2}
        />
        <Stat
          label="Custom"
          value={customGoals.length}
          // icon={CheckCircle2}
        />
        <Stat
          label="Areas"
          value={areas.length - 1}
          // icon={CheckCircle2}
        />
      </div>
      <section className="rounded-sm border border-gray-300 bg-base-100 p-2">
        <div className="grid gap-3 lg:grid-cols-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by skill, disability, or template text..."
          />

          <SelectFilter
            value={areaFilter}
            onChange={setAreaFilter}
            options={areas}
            allLabel="All areas"
          />

          <SelectFilter
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories}
            allLabel="All categories"
          />
        </div>
      </section>

      <div className="grid gap-4]">
        <section className="grid gap-3">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onCopy={() => copyGoal(goal)}
                onSend={() => sendToIep(goal)}
                onDelete={
                  goal.source === "custom"
                    ? () => deleteCustomGoal(goal.id)
                    : null
                }
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-base-100 p-8 text-center">
              <p className="font-semibold">No matching goals</p>
              <p className="mt-1 text-sm text-base-content/60">
                Adjust filters or create a custom template.
              </p>
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Goal Template"
        size="2xl"
      >
        <form onSubmit={saveGoal} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Title"
              value={draftGoal.title}
              onChange={(event) =>
                setDraftGoal((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
            />
            <SelectInput
              label="Area"
              value={draftGoal.area}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  area: value,
                }))
              }
              options={goalAreaOptions}
              placeholder="Select an area"
            />
            <SelectInput
              label="Category"
              value={draftGoal.category}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  category: value,
                }))
              }
              options={goalCategoryOptions}
              placeholder="Select a category"
            />
            <SelectInput
              label="Grade band"
              value={draftGoal.gradeBand}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  gradeBand: value,
                }))
              }
              options={gradeBandOptions}
              placeholder="Select a grade band"
            />
          </div>

          <TextAreaInput
            label="Goal description"
            value={draftGoal.description}
            onChange={(value) =>
              setDraftGoal((current) => ({
                ...current,
                description: value,
              }))
            }
            required
            rows={4}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <SelectInput
              label="Criteria"
              value={draftGoal.criteria}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  criteria: value,
                }))
              }
              options={criteriaOptions}
              placeholder="Select criteria"
            />
            <SelectInput
              label="Measurement"
              value={draftGoal.measurement}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  measurement: value,
                }))
              }
              options={measurementOptions}
              placeholder="Select measurement"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Template</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const GoalCard = ({ goal, onCopy, onSend, onDelete }) => (
  <article className="rounded-lg border border-gray-300 bg-base-100 p-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-3">
          <span className="badge badge-outline">{goal.area || "General"}</span>
          <span className="badge ">{goal.category || "No category"}</span>
          <span className="badge ">{goal.gradeBand || "All grades"}</span>
          {goal.source === "custom" && (
            <span className="badge badge-primary">Custom</span>
          )}
        </div>

        <h2 className="text-base font-semibold">{goal.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-base-content/70">
          {goal.description}
        </p>
        <div className="mt-3 grid gap-2 text-xs text-base-content/60 md:grid-cols-2">
          <p>
            <span className="font-semibold">Criteria:</span>{" "}
            {goal.criteria || "Not set"}
          </p>
          <p>
            <span className="font-semibold">Measurement:</span>{" "}
            {goal.measurement || "Not set"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button onClick={onCopy} icon={ClipboardCopy}>
          Copy
        </Button>
        <Button onClick={onSend} icon={Send}>
          Send to IEP
        </Button>
        {onDelete && (
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={onDelete}
            title="Delete custom template"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  </article>
);

const criteriaOptions = [
  "80% accuracy across 3 sessions",
  "70% accuracy across 3 sessions",
  "90% accuracy across 3 sessions",
  "Independence with minimal prompting",
];

const measurementOptions = [
  "Rubric",
  "Checklist",
  "Observation",
  "Work sample",
  "Probe",
  "Teacher record",
];

const goalAreaOptions = [
  "Reading",
  "Math",
  "Writing",
  "Behavior",
  "Communication",
];

const goalCategoryOptions = [
  "Academic",
  "Behavioral",
  "Functional",
  "Social Skills",
];

const gradeBandOptions = [
  "Preschool",
  "Kindergarten",
  "Grades 1-3",
  "Grades 4-6",
  "Grades 7-9",
  "Grades 10-12",
  "All Grades",
];

export default GoalBank;

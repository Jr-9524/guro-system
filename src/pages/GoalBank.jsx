import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ClipboardCopy, Pencil, Plus, Send, Trash2 } from "lucide-react";

import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import CreatableSelectInput from "../components/forms/CreatableSelectInput";
import SelectFilter from "../components/filters/SelectFilter";
import TextAreaInput from "../components/forms/TextAreaInput";
import SearchInput from "../components/common/SearchInput";
import IepTabs from "../components/common/IepTabs";
import Pagination from "../components/common/Pagination";
import PageHeader from "../components/common/PageHeader";
import usePagination from "../hooks/usePagination";

import workspaceStoreService from "../services/workspaceStoreService";
import { loadCustomGoals, saveCustomGoals } from "../services/goalBankService";
import { PENDING_GOAL_KEY, seededGoals } from "../data/goalBankTemplates";
import {
  commonSupports,
  goalAreas,
  goalTemplateToGoal,
  measurementFrequencies,
  measurementMethods,
  normalizeGoalTemplate,
  reportingSchedules,
} from "../utils/goalUtils";
import ActionMenu from "../components/common/ActionMenu";
import Tooltip from "../components/common/Tooltip";

const createEmptyTemplate = () => ({
  area: "",
  skillFocus: "",
  difficulty: "Beginner",
  goalText: "",
  objectives: [],
  measurementMethod: "",
  frequency: "Weekly",
  reportingSchedule: "Quarterly",
  supports: [],
  tags: [],
  isCustom: true,
});

const GoalBank = () => {
  const navigate = useNavigate();
  const [customGoals, setCustomGoals] = useState([]);
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftGoal, setDraftGoal] = useState(createEmptyTemplate);
  const [editingGoalId, setEditingGoalId] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    loadCustomGoals().then((goals) => {
      if (isCurrent) setCustomGoals(goals.map(normalizeGoalTemplate));
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const goals = useMemo(
    () => [...seededGoals, ...customGoals].map(normalizeGoalTemplate),
    [customGoals],
  );
  const areas = useMemo(
    () => [...new Set(goals.map((goal) => goal.area).filter(Boolean))],
    [goals],
  );
  const skillFocusOptions = useMemo(
    () => [...new Set(goals.map((goal) => goal.skillFocus).filter(Boolean))],
    [goals],
  );
  const tagOptions = useMemo(
    () => [
      ...new Set(goals.flatMap((goal) => goal.tags || []).filter(Boolean)),
    ],
    [goals],
  );
  const filteredGoals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return goals.filter((goal) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          goal.skillFocus,
          goal.goalText,
          goal.area,
          goal.difficulty,
          ...goal.tags,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesArea = areaFilter === "all" || goal.area === areaFilter;
      const matchesDifficulty =
        difficultyFilter === "all" || goal.difficulty === difficultyFilter;

      return matchesQuery && matchesArea && matchesDifficulty;
    });
  }, [areaFilter, difficultyFilter, goals, query]);
  const pagination = usePagination(filteredGoals, 10);

  const copyGoal = async (goal) => {
    await navigator.clipboard.writeText(goal.goalText);
    toast.success("Goal copied");
  };

  const sendToIep = async (goal) => {
    await workspaceStoreService.set(PENDING_GOAL_KEY, {
      goal: goalTemplateToGoal(goal),
    });
    toast.success("Goal queued for IEP builder");
    navigate("/iep/new");
  };

  const saveGoal = async (event) => {
    event.preventDefault();

    if (!draftGoal.skillFocus.trim() || !draftGoal.goalText.trim()) {
      toast.error("Skill focus and goal sentence are required");
      return;
    }

    const savedTemplate = normalizeGoalTemplate({
      ...draftGoal,
      id: editingGoalId || `custom-${Date.now()}`,
      isCustom: true,
    });
    const nextGoals = editingGoalId
      ? customGoals.map((goal) =>
          goal.id === editingGoalId ? savedTemplate : goal,
        )
      : [...customGoals, savedTemplate];
    setCustomGoals(nextGoals);
    await saveCustomGoals(nextGoals);
    setDraftGoal(createEmptyTemplate());
    setEditingGoalId(null);
    setIsModalOpen(false);
    toast.success(
      editingGoalId ? "Goal template updated" : "Goal template saved",
    );
  };

  const editCustomGoal = (goal) => {
    setDraftGoal(normalizeGoalTemplate(goal));
    setEditingGoalId(goal.id);
    setIsModalOpen(true);
  };

  const openNewTemplate = () => {
    setDraftGoal(createEmptyTemplate());
    setEditingGoalId(null);
    setIsModalOpen(true);
  };

  const deleteCustomGoal = async (goalId) => {
    const nextGoals = customGoals.filter((goal) => goal.id !== goalId);
    setCustomGoals(nextGoals);
    await saveCustomGoals(nextGoals);
    toast.success("Custom goal deleted");
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <PageHeader
        title="Goal Bank"
        description="Find and reuse measurable goals."
        actions={
          <Button onClick={openNewTemplate} icon={Plus}>
            Create Custom Goal
          </Button>
        }
      />
      <IepTabs activeId="goals" />
      <section>
        <div className="grid gap-3 lg:grid-cols-3">
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value);
              pagination.goToPage(1);
            }}
            placeholder="Search by skill, area, tag, or goal text..."
          />

          <SelectFilter
            value={areaFilter}
            onChange={(value) => {
              setAreaFilter(value);
              pagination.goToPage(1);
            }}
            options={[
              { value: "all", label: "All areas" },
              ...areas.map((area) => ({ value: area, label: area })),
            ]}
          />

          <SelectFilter
            value={difficultyFilter}
            onChange={(value) => {
              setDifficultyFilter(value);
              pagination.goToPage(1);
            }}
            options={[
              { value: "all", label: "All difficulties" },
              "Beginner",
              "Intermediate",
              "Advanced",
            ]}
          />
        </div>
      </section>

      <div className="rounded-md border border-base-300 bg-base-100 overflow-hidden">
        <section className="divide-y divide-base-300 ">
          {filteredGoals.length > 0 ? (
            pagination.currentItems.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onCopy={() => copyGoal(goal)}
                onSend={() => sendToIep(goal)}
                onEdit={goal.isCustom ? () => editCustomGoal(goal) : null}
                onDelete={
                  goal.isCustom ? () => deleteCustomGoal(goal.id) : null
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
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={filteredGoals.length}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
          pageSizeOptions={[10, 20, 40]}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="goals"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoalId ? "Edit Goal Template" : "Create Custom Template"}
        size="2xl"
      >
        <form onSubmit={saveGoal} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CreatableSelectInput
              label="Skill focus"
              value={draftGoal.skillFocus}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  skillFocus: value,
                }))
              }
              options={skillFocusOptions}
              placeholder="Select or add a skill focus"
              required
            />
            <CreatableSelectInput
              label="Area"
              value={draftGoal.area}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  area: value,
                }))
              }
              options={goalAreas}
              placeholder="Select an area"
            />
            <CreatableSelectInput
              label="Difficulty"
              value={draftGoal.difficulty}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  difficulty: value,
                }))
              }
              options={["Beginner", "Intermediate", "Advanced"]}
            />
          </div>

          <TextAreaInput
            label="Editable goal sentence"
            value={draftGoal.goalText}
            onChange={(value) =>
              setDraftGoal((current) => ({
                ...current,
                goalText: value,
              }))
            }
            required
            rows={4}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CreatableSelectInput
              label="Measurement method"
              value={draftGoal.measurementMethod}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  measurementMethod: value,
                }))
              }
              options={measurementMethods}
              placeholder="Choose how progress is measured"
            />
            <CreatableSelectInput
              label="Frequency"
              value={draftGoal.frequency}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  frequency: value,
                }))
              }
              options={measurementFrequencies}
            />
            <CreatableSelectInput
              label="Reporting schedule"
              value={draftGoal.reportingSchedule}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  reportingSchedule: value,
                }))
              }
              options={reportingSchedules}
            />
            <CreatableSelectInput
              label="Tags"
              value={draftGoal.tags}
              onChange={(value) =>
                setDraftGoal((current) => ({
                  ...current,
                  tags: value,
                }))
              }
              options={tagOptions}
              placeholder="Select or add tags"
              isMulti
            />
          </div>

          <TextAreaInput
            label="Short-term objectives (one per line)"
            value={draftGoal.objectives
              .map((objective) => objective.description)
              .join("\n")}
            onChange={(value) =>
              setDraftGoal((current) => ({
                ...current,
                objectives: value
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((description, index) => ({
                    id: `custom-objective-${index}`,
                    description,
                    criteria: "",
                    status: "Not Started",
                  })),
              }))
            }
            rows={4}
          />

          <CreatableSelectInput
            label="Suggested supports"
            value={draftGoal.supports}
            onChange={(value) =>
              setDraftGoal((current) => ({
                ...current,
                supports: value,
              }))
            }
            options={commonSupports}
            placeholder="Select or add supports"
            isMulti
            closeMenuOnSelect={false}
          />

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

const GoalCard = ({ goal, onCopy, onSend, onEdit, onDelete }) => (
  <article className="py-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between px-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
          {goal.area || "General"}
        </p>
        <h2 className="text-base font-semibold">{goal.skillFocus}</h2>
        <p className="mt-2 text-sm leading-relaxed text-base-content/70">
          {goal.goalText}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          icon={ClipboardCopy}
        ></Button>

        <Button size="sm" onClick={onSend} icon={Send} variant="ghost"></Button>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} icon={Pencil}>
            Edit
          </Button>
        )}
        {onDelete && (
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-square text-base-content"
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

export default GoalBank;

// src/pages/IEPBuilder.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Check,
  Download,
  Plus,
  Printer,
  Pencil,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Button from "../components/common/Button";
import SelectInput from "../components/forms/SelectInput";
import Input from "../components/common/Input";
import TextAreaInput from "../components/forms/TextAreaInput";

import {
  downloadIepWordDocument,
  printIepDocument,
} from "../services/iepExportService";
import iepService from "../services/iepService";
import selectStyles from "../utils/selectStyles";
import workspaceStoreService from "../services/workspaceStoreService";
import useStudentStore from "../stores/studentStore";
import CreatableSelectInput from "../components/forms/CreatableSelectInput";
import {
  CUSTOM_GOALS_KEY,
  PENDING_GOAL_KEY,
  seededGoals,
} from "../data/goalBankTemplates";
import {
  applyGoalTemplate,
  buildGoalText,
  commonSupports,
  createGoal,
  createObjective,
  getGoalStatement,
  getGoalWarnings,
  goalAreas,
  goalStatuses,
  goalTemplateToGoal,
  measurementFrequencies,
  measurementMethods,
  normalizeGoal,
  normalizeGoalTemplate,
  objectiveStatuses,
  reportingSchedules,
} from "../utils/goalUtils";

const sections = [
  { title: "Choose Student", sub: "Learner profile", key: "studentInfo" },
  { title: "Present Level", sub: "PLAAFP", key: "plaaFP" },
  { title: "Annual Goals", sub: "Measurable goals", key: "goals" },
  { title: "Accommodations", sub: "Learning supports", key: "accommodations" },
  { title: "Services", sub: "Service plan", key: "services" },
  { title: "Review & Export", sub: "Progress plan", key: "progressPlan" },
];

const disabilityCategories = [
  "Visual Impairment",
  "Hearing Impairment",
  "Learning Disability",
  "Intellectual Disability",
  "Autism Spectrum Disorder",
  "Emotional-Behavioral Disorder",
  "Orthopedic/Physical Handicap",
  "Speech/Language Disorder",
  "Cerebral Palsy",
  "Special Health Problem/Chronic Disease",
  "Multiple Disabilities",
];

const severityLevels = ["Mild", "Moderate", "Severe", "Profound"];
const communicationModes = ["Verbal", "Non-verbal", "FSL", "AAC", "Braille"];
const gradeLevels = [
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

const serviceFrequencyOptions = [
  "1x per week",
  "2x per week",
  "3x per week",
  "Weekly",
  "Bi-weekly",
];

const serviceDurationOptions = ["30 minutes", "45 minutes", "60 minutes"];

const serviceSettingOptions = [
  "Pull-out",
  "Push-in",
  "Inclusive",
  "Home-based",
];

const serviceProviderOptions = [
  "SPED Teacher",
  "Speech Therapist",
  "Occupational Therapist",
  "General Education Teacher",
];

const defaultIepData = {
  studentInfo: {
    firstName: "",
    lastName: "",
    gradeLevel: "",
    age: "",
    school: "",
    disabilityCategory: "",
    disabilitySeverity: "",
    communicationMode: "",
    iepStartDate: "",
    iepEndDate: "",
  },
  plaaFP: {
    readingLevel: "",
    mathLevel: "",
    assessmentResults: "",
    teacherObservations: "",
    strengths: "",
    challenges: "",
    impact: "",
    aiDraft: "",
  },
  goals: [createGoal()],
  accommodations: {
    presentation: ["Read-aloud for tests", "Visual aids and diagrams"],
    timeEnvironment: ["Extended time", "Preferential seating"],
    response: ["Oral responses allowed"],
  },
  services: [
    {
      id: 1,
      name: "Special Education Support",
      frequency: "3x per week",
      duration: "45 minutes",
      setting: "Pull-out",
      provider: "SPED Teacher",
    },
  ],
  progressPlan: {
    dataMethod: "Trial-by-trial recording",
    frequency: "Weekly",
    parentReport: "Quarterly",
    responsible: "",
    notes: "",
  },
};

const cloneDefaultIepData = () => structuredClone(defaultIepData);

const getAgeFromBirthDate = (birthDate) => {
  if (!birthDate) return "";

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 ? String(age) : "";
};

const getStudentInfoAutofill = (studentRecord) => ({
  firstName: studentRecord.firstName || "",
  lastName: studentRecord.lastName || "",
  gradeLevel: studentRecord.gradeLevel || "",
  age: getAgeFromBirthDate(studentRecord.birthDate),
  school: studentRecord.school || "",
  disabilityCategory: studentRecord.primaryDisabilityCategory || "",
  disabilitySeverity: studentRecord.severityLevel || "",
  communicationMode: studentRecord.communicationMode || "",
});

const applyStudentInfo = (currentInfo, studentRecord) => {
  const autofill = getStudentInfoAutofill(studentRecord);

  return {
    ...currentInfo,
    ...autofill,
  };
};

const IEPBuilder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { students, fetchStudents } = useStudentStore();

  const [activeSection, setActiveSection] = useState(0);
  const [student, setStudent] = useState(null);
  const [completedSections, setCompletedSections] = useState([]);
  const [currentIepId, setCurrentIepId] = useState(id || null);
  const [iepData, setIepData] = useState(cloneDefaultIepData);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPlaafp, setIsGeneratingPlaafp] = useState(false);
  const [isSuggestingGoals, setIsSuggestingGoals] = useState(false);
  const [aiGoalSuggestions, setAiGoalSuggestions] = useState([]);
  const [customGoalTemplates, setCustomGoalTemplates] = useState([]);
  const [goalBankQuery, setGoalBankQuery] = useState("");
  const [isGoalBankOpen, setIsGoalBankOpen] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState(
    defaultIepData.goals[0].id,
  );

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let isCurrent = true;

    workspaceStoreService.get(CUSTOM_GOALS_KEY, []).then((goals) => {
      if (isCurrent) setCustomGoalTemplates(goals);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadPendingGoal = async () => {
      const queuedGoal = await workspaceStoreService.get(
        PENDING_GOAL_KEY,
        null,
      );
      if (!isCurrent || !queuedGoal) return;

      // Goal Bank uses this as a handoff queue; clear after one successful read.
      await workspaceStoreService.remove(PENDING_GOAL_KEY);
      const importedGoal = queuedGoal.goal
        ? normalizeGoal(queuedGoal.goal)
        : createGoal({
            area: queuedGoal.area || "",
            description: queuedGoal.description || "",
            generatedGoalText: queuedGoal.description || "",
            accuracy: queuedGoal.accuracy || "",
            measurementFrequency: queuedGoal.sessions || "",
            measurementMethod: queuedGoal.measurement || "",
          });
      toast.success("Goal added from Goal Bank");
      setActiveSection(2);
      setExpandedGoalId(importedGoal.id);
      setIepData((current) => ({
        ...current,
        goals: [...current.goals, importedGoal],
      }));
    };

    loadPendingGoal();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const applyStudent = (studentRecord) => {
      if (!studentRecord) return;

      setStudent(studentRecord);
      setIepData((current) => ({
        ...current,
        studentInfo: applyStudentInfo(current.studentInfo, studentRecord),
      }));
    };

    const load = async () => {
      setIsLoading(Boolean(id));

      if (!id) {
        const studentId = searchParams.get("studentId");
        applyStudent(students.find((item) => item.id === studentId));
        setCurrentIepId(null);
        setIsLoading(false);
        return;
      }

      try {
        const existing = await iepService.getById(id);
        if (!isCurrent) return;

        if (!existing) {
          toast.error("IEP record not found");
          navigate("/iep/drafts");
          return;
        }

        setCurrentIepId(existing.id);
        setIepData({
          ...cloneDefaultIepData(),
          ...existing.data,
          plaaFP: {
            ...cloneDefaultIepData().plaaFP,
            ...existing.data?.plaaFP,
          },
          goals: (existing.data?.goals || []).map(normalizeGoal),
        });
        setCompletedSections(existing.completedSections || []);
        setActiveSection(existing.activeSection || 0);
        applyStudent(students.find((item) => item.id === existing.studentId));
      } catch (error) {
        if (isCurrent) toast.error(error.message || "Failed to load IEP");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    load();

    return () => {
      isCurrent = false;
    };
  }, [id, navigate, searchParams, students]);

  const studentName = useMemo(
    () =>
      [iepData.studentInfo.firstName, iepData.studentInfo.lastName]
        .filter(Boolean)
        .join(" "),
    [iepData.studentInfo.firstName, iepData.studentInfo.lastName],
  );

  const goalBankTemplates = useMemo(
    () => [...seededGoals, ...customGoalTemplates].map(normalizeGoalTemplate),
    [customGoalTemplates],
  );

  const filteredGoalBankTemplates = useMemo(() => {
    const normalizedQuery = goalBankQuery.trim().toLowerCase();

    if (!normalizedQuery) return goalBankTemplates.slice(0, 6);

    return goalBankTemplates
      .filter((goal) =>
        [
          goal.skillFocus,
          goal.goalText,
          goal.area,
          goal.difficulty,
          goal.measurementMethod,
          ...goal.tags,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 8);
  }, [goalBankQuery, goalBankTemplates]);

  const markSectionDone = (index) => {
    setCompletedSections((current) =>
      current.includes(index) ? current : [...current, index],
    );
  };

  const getCompletedWith = (index) =>
    completedSections.includes(index)
      ? completedSections
      : [...completedSections, index];

  const updateStudentInfo = (field, value) => {
    setIepData((current) => ({
      ...current,
      studentInfo: { ...current.studentInfo, [field]: value },
    }));
  };

  const updatePlaafp = (field, value) => {
    setIepData((current) => ({
      ...current,
      plaaFP: { ...current.plaaFP, [field]: value },
    }));
  };

  const updateProgressPlan = (field, value) => {
    setIepData((current) => ({
      ...current,
      progressPlan: { ...current.progressPlan, [field]: value },
    }));
  };

  const replaceGoal = (goalId, updater) => {
    setIepData((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId ? normalizeGoal(updater(normalizeGoal(goal))) : goal,
      ),
    }));
  };

  const updateGoal = (goalId, field, value) => {
    replaceGoal(goalId, (goal) => ({ ...goal, [field]: value }));
  };

  const updateGoalArea = (goalId, area) => {
    replaceGoal(goalId, (goal) => applyGoalTemplate(goal, area));
  };

  const updateAnnualGoal = (goalId, field, value) => {
    replaceGoal(goalId, (goal) => {
      const annualGoal = { ...goal.annualGoal, [field]: value };
      const criteriaPercent =
        field === "criteria" ? String(value).match(/\d+(?:\.\d+)?/)?.[0] : null;
      return {
        ...goal,
        annualGoal,
        generatedGoalText: buildGoalText(annualGoal),
        accuracy: criteriaPercent || goal.accuracy,
      };
    });
  };

  const addObjective = (goalId) => {
    replaceGoal(goalId, (goal) => ({
      ...goal,
      objectives: [...goal.objectives, createObjective()],
    }));
  };

  const updateObjective = (goalId, objectiveId, field, value) => {
    replaceGoal(goalId, (goal) => ({
      ...goal,
      objectives: goal.objectives.map((objective) =>
        objective.id === objectiveId
          ? { ...objective, [field]: value }
          : objective,
      ),
    }));
  };

  const removeObjective = (goalId, objectiveId) => {
    replaceGoal(goalId, (goal) => ({
      ...goal,
      objectives: goal.objectives.filter(
        (objective) => objective.id !== objectiveId,
      ),
    }));
  };


  const addGoal = () => {
    const goal = createGoal();
    setIepData((current) => ({
      ...current,
      goals: [...current.goals, goal],
    }));
    setExpandedGoalId(goal.id);
  };

  const removeGoal = (goalId) => {
    setIepData((current) => ({
      ...current,
      goals:
        current.goals.length === 1
          ? current.goals
          : current.goals.filter((goal) => goal.id !== goalId),
    }));
  };

  const addGoalFromBank = (template) => {
    const importedGoal = goalTemplateToGoal(template);

    setIepData((current) => ({
      ...current,
      goals: [...current.goals, importedGoal],
    }));
    setExpandedGoalId(importedGoal.id);
    toast.success("Goal added from Goal Bank");
  };

  const updateService = (serviceId, field, value) => {
    setIepData((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === serviceId ? { ...service, [field]: value } : service,
      ),
    }));
  };

  const addService = () => {
    setIepData((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id: Date.now(),
          name: "New Service",
          frequency: "1x per week",
          duration: "30 minutes",
          setting: "Pull-out",
          provider: "Specialist",
        },
      ],
    }));
  };

  const removeService = (serviceId) => {
    setIepData((current) => ({
      ...current,
      services:
        current.services.length === 1
          ? current.services
          : current.services.filter((service) => service.id !== serviceId),
    }));
  };

  const toggleAccommodation = (group, item) => {
    setIepData((current) => {
      const selected = current.accommodations[group];
      return {
        ...current,
        accommodations: {
          ...current.accommodations,
          [group]: selected.includes(item)
            ? selected.filter((selectedItem) => selectedItem !== item)
            : [...selected, item],
        },
      };
    });
  };

  const handleStudentSelect = (studentId) => {
    const selected = students.find((item) => item.id === studentId);
    setStudent(selected || null);

    if (!selected) {
      setIepData((current) => ({
        ...current,
        studentInfo: cloneDefaultIepData().studentInfo,
      }));
      return;
    }

    setIepData((current) => ({
      ...current,
      studentInfo: applyStudentInfo(current.studentInfo, selected),
    }));
  };

  const validateBeforeSave = (validateGoals = false) => {
    if (!student?.id && !searchParams.get("studentId")) {
      toast.error("Choose a linked student before saving");
      setActiveSection(0);
      return false;
    }

    if (!iepData.studentInfo.firstName || !iepData.studentInfo.lastName) {
      toast.error("Student first and last name are required");
      setActiveSection(0);
      return false;
    }

    const goalWarning = validateGoals
      ? iepData.goals.flatMap(getGoalWarnings)[0]
      : null;
    if (goalWarning) {
      toast(`Goal warning: ${goalWarning}`, { icon: "!" });
    }

    return true;
  };

  const handleSave = async ({ completeCurrentSection = true } = {}) => {
    if (!validateBeforeSave(completeCurrentSection && activeSection >= 2)) {
      return false;
    }

    const nextCompletedSections = completeCurrentSection
      ? getCompletedWith(activeSection)
      : completedSections;
    setCompletedSections(nextCompletedSections);
    setIsSaving(true);

    try {
      const saved = await iepService.save({
        id: currentIepId,
        studentId: student?.id || searchParams.get("studentId"),
        title: `IEP - ${studentName || "Untitled Student"}`,
        data: iepData,
        completedSections: nextCompletedSections,
        activeSection,
        status:
          nextCompletedSections.length >= sections.length
            ? "complete"
            : "draft",
        createdBy: null,
      });

      setCurrentIepId(saved.id);
      toast.success(saved.status === "complete" ? "IEP saved" : "Draft saved");

      if (!id) navigate(`/iep/${saved.id}/edit`, { replace: true });
      return true;
    } catch (error) {
      toast.error(error.message || "Failed to save IEP");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const generatePlaafpDraft = async () => {
    if (!student?.id) {
      toast.error("Choose a linked student before generating a PLAAFP draft");
      return;
    }

    if (!window.electronAPI?.ai?.generatePlaafp) {
      toast.error("AI drafting is available in the GURO desktop app");
      return;
    }

    setIsGeneratingPlaafp(true);
    try {
      const draft = await window.electronAPI.ai.generatePlaafp({
        studentName,
        age: iepData.studentInfo.age,
        gradeLevel: iepData.studentInfo.gradeLevel,
        disabilityCategory: iepData.studentInfo.disabilityCategory,
        learningNeeds: iepData.plaaFP.challenges,
        assessmentResults: iepData.plaaFP.assessmentResults,
        teacherObservations: iepData.plaaFP.teacherObservations,
        strengths: iepData.plaaFP.strengths,
        needs: iepData.plaaFP.challenges,
        classroomImpact: iepData.plaaFP.impact,
        currentPerformance: [
          iepData.plaaFP.readingLevel
            ? `Reading: ${iepData.plaaFP.readingLevel}`
            : "",
          iepData.plaaFP.mathLevel
            ? `Mathematics: ${iepData.plaaFP.mathLevel}`
            : "",
        ]
          .filter(Boolean)
          .join("; "),
      });

      updatePlaafp("aiDraft", draft);
      toast.success("PLAAFP draft generated. Review it before saving.");
    } catch (error) {
      toast.error(error.message || "Unable to generate the PLAAFP draft");
    } finally {
      setIsGeneratingPlaafp(false);
    }
  };

  const suggestGoalsWithAi = async () => {
    if (!student?.id) {
      toast.error("Choose a linked student before requesting goal suggestions");
      return;
    }

    if (!window.electronAPI?.ai?.suggestGoals) {
      toast.error("AI goal suggestions are available in the GURO desktop app");
      return;
    }

    const selectedGoal = iepData.goals.find(
      (goal) => goal.id === expandedGoalId,
    );

    setIsSuggestingGoals(true);
    try {
      const result = await window.electronAPI.ai.suggestGoals({
        studentName,
        age: iepData.studentInfo.age,
        gradeLevel: iepData.studentInfo.gradeLevel,
        disabilityCategory: iepData.studentInfo.disabilityCategory,
        learningNeeds: iepData.plaaFP.challenges,
        assessmentResults: iepData.plaaFP.assessmentResults,
        teacherObservations: iepData.plaaFP.teacherObservations,
        strengths: iepData.plaaFP.strengths,
        needs: iepData.plaaFP.challenges,
        classroomImpact: iepData.plaaFP.impact,
        currentPerformance: iepData.goals
          .map((goal) => normalizeGoal(goal).currentPerformance)
          .filter(Boolean)
          .join("\n"),
        plaafpDraft: iepData.plaaFP.aiDraft,
        selectedArea:
          normalizeGoal(selectedGoal).area ||
          iepData.goals.map(normalizeGoal).find((goal) => goal.area)?.area ||
          "",
        existingGoals: iepData.goals
          .map(normalizeGoal)
          .filter((goal) => goal.generatedGoalText)
          .map((goal) => ({
            area: goal.area,
            statement: getGoalStatement(goal),
          })),
      });

      setAiGoalSuggestions(result.goals || []);
      toast.success("Goal suggestions are ready for review");
    } catch (error) {
      toast.error(error.message || "Unable to suggest goals");
    } finally {
      setIsSuggestingGoals(false);
    }
  };

  const useAiGoalSuggestion = (suggestion, suggestionIndex) => {
    const annualGoal = {
      timeframe: suggestion.annualGoal?.timeframe || "",
      condition: suggestion.annualGoal?.condition || "",
      behavior: suggestion.annualGoal?.behavior || "",
      criteria: suggestion.annualGoal?.criteria || "",
    };
    const goal = createGoal({
      area: suggestion.area || "",
      currentPerformance: suggestion.currentPerformance || "",
      need: iepData.plaaFP.challenges || "",
      annualGoal,
      generatedGoalText: buildGoalText(annualGoal),
      objectives: (suggestion.objectives || []).map((objective) =>
        createObjective({
          description: objective.description || "",
          criteria: objective.criteria || "",
        }),
      ),
      measurementMethod: suggestion.measurementMethod || "",
      measurementFrequency: suggestion.measurementFrequency || "",
      progressReportingSchedule:
        suggestion.progressReportingSchedule || "",
      supports: suggestion.supports || [],
    });

    setIepData((current) => ({
      ...current,
      goals: [...current.goals, goal],
    }));
    setExpandedGoalId(goal.id);
    setAiGoalSuggestions((current) =>
      current.filter((_, index) => index !== suggestionIndex),
    );
    toast.success("Suggested goal added for teacher review");
  };

  const getExportTitle = () => `IEP - ${studentName || "Untitled Student"}`;

  const handlePrintExport = () => {
    const opened = printIepDocument({
      title: getExportTitle(),
      data: iepData,
    });

    if (!opened) {
      toast.error("Allow popups to print or save this IEP as PDF");
      return;
    }

    toast.success("Print dialog opened");
  };

  const handleWordExport = () => {
    downloadIepWordDocument({
      title: getExportTitle(),
      data: iepData,
    });
    toast.success("Word document downloaded");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] -mx-6 -my-6 lg:-mx-8">
      <aside className="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100">
        <div className="border-b border-base-300 p-5">
          <div className="mb-1 text-xs text-base-content/50">
            Writing IEP for
          </div>
          <div className="truncate text-base font-semibold">
            {studentName || "Select a student"}
          </div>
          <div className="truncate text-xs text-base-content/50">
            {iepData.studentInfo.gradeLevel
              ? `Grade ${iepData.studentInfo.gradeLevel}`
              : "No grade set"}
            {iepData.studentInfo.disabilityCategory
              ? ` - ${iepData.studentInfo.disabilityCategory}`
              : ""}
          </div>
        </div>

        <div className="">
          <div className="m-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
            Sections
          </div>
          {sections.map((section, index) => {
            const isDone = completedSections.includes(index);
            const isActive = activeSection === index;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(index)}
                className={`mb-0.5 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-all ${
                  isActive ? "bg-base-200 font-medium" : "hover:bg-base-200"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-success text-success-content"
                      : isActive
                        ? "bg-neutral text-base-100"
                        : "bg-base-300 text-base-content/60"
                  }`}
                >
                  {isDone ? <Check size={13} strokeWidth={3} /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {section.title}
                  </span>
                  <span className="block truncate text-xs text-base-content/40">
                    {isDone ? "Complete" : section.sub}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto border-t border-base-300 p-5">
          <div className="space-y-2">
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleSave({ completeCurrentSection: false })}
              loading={isSaving}
            >
              <Save size={18} />
              <span>Save Draft</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-2"
              onClick={handlePrintExport}
            >
              <Printer size={18} />
              <span>Print / PDF</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleWordExport}
            >
              <Download size={18} />
              <span>Export Word</span>
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-base-200 p-4 sm:p-6 xl:p-8 pb-24">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-xl border border-base-300 bg-base-100 px-5 py-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-base-content">
              Step {activeSection + 1} of {sections.length}
            </p>
            <p className="mt-1 text-lg font-bold">
              {sections[activeSection].title}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-base-200">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${((activeSection + 1) / sections.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {activeSection === 0 && (
            <SectionWrapper
              title="Choose a Student"
              description="Select a learner profile, then confirm the IEP dates before continuing."
            >
              <SelectInput
                label="Linked Student"
                helperText="Select the student this IEP belongs to"
                value={student?.id || ""}
                onChange={handleStudentSelect}
                placeholder="No student selected"
                options={students.map((item) => ({
                  value: item.id,
                  label: `${item.firstName} ${item.lastName}`,
                }))}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="First name (Read Only)"
                  value={iepData.studentInfo.firstName}
                  // onChange={(value) => updateStudentInfo("firstName", value)}
                  readOnly
                />
                <Input
                  label="Last name (Read Only)"
                  value={iepData.studentInfo.lastName}
                  // onChange={(value) => updateStudentInfo("lastName", value)}
                  readOnly
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SelectInput
                  label="Grade level (Read Only)"
                  value={iepData.studentInfo.gradeLevel}
                  // onChange={(value) => updateStudentInfo("gradeLevel", value)}

                  options={gradeLevels}
                  placeholder="Select grade"
                  disabled
                />
                <Input
                  label="Age (Read Only)"
                  value={iepData.studentInfo.age}
                  readOnly
                />
                <Input
                  label="School (Read Only)"
                  value={iepData.studentInfo.school}
                  readOnly
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SelectInput
                  label="Disability category (Read Only)"
                  value={iepData.studentInfo.disabilityCategory}
                  // onChange={(value) =>
                  //   updateStudentInfo("disabilityCategory", value)
                  // }
                  options={disabilityCategories}
                  placeholder="Select category"
                  disabled
                />
                <SelectInput
                  label="Disability severity (Read Only)"
                  value={iepData.studentInfo.disabilitySeverity}
                  // onChange={(value) =>
                  //   updateStudentInfo("disabilitySeverity", value)
                  // }
                  options={severityLevels}
                  placeholder="Select severity"
                  disabled
                />
                <SelectInput
                  label="Communication mode (Read Only)"
                  value={iepData.studentInfo.communicationMode}
                  // onChange={(value) =>
                  //   updateStudentInfo("communicationMode", value)
                  // }
                  options={communicationModes}
                  placeholder="Select mode"
                  disabled
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="IEP start date"
                  type="date"
                  value={iepData.studentInfo.iepStartDate}
                  onChange={(event) =>
                    updateStudentInfo("iepStartDate", event.target.value)
                  }
                />
                <Input
                  label="IEP end date"
                  type="date"
                  value={iepData.studentInfo.iepEndDate}
                  onChange={(event) =>
                    updateStudentInfo("iepEndDate", event.target.value)
                  }
                />
              </div>
            </SectionWrapper>
          )}

          {activeSection === 1 && (
            <SectionWrapper
              title="Present Levels (PLAAFP)"
              description="Describe what the student can currently do, what they struggle with, and what support they need."
              example="Example: Juan can recognize basic sight words but needs support reading short passages and answering comprehension questions."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Reading level"
                  value={iepData.plaaFP.readingLevel}
                  onChange={(event) =>
                    updatePlaafp("readingLevel", event.target.value)
                  }
                  placeholder="e.g., Grade 1 level"
                />
                <Input
                  label="Math level"
                  value={iepData.plaaFP.mathLevel}
                  onChange={(event) =>
                    updatePlaafp("mathLevel", event.target.value)
                  }
                  placeholder="e.g., At grade level"
                />
              </div>

              <TextAreaInput
                label="Current strengths"
                value={iepData.plaaFP.strengths}
                onChange={(value) => updatePlaafp("strengths", value)}
                placeholder="Strengths, learning preferences, and successful supports."
              />
              <TextAreaInput
                label="Current challenges / areas of need"
                value={iepData.plaaFP.challenges}
                onChange={(value) => updatePlaafp("challenges", value)}
                placeholder="Academic or functional areas that need support."
              />
              <TextAreaInput
                label="Impact on classroom participation"
                value={iepData.plaaFP.impact}
                onChange={(value) => updatePlaafp("impact", value)}
                placeholder="Describe how the disability affects progress in the general curriculum."
              />
              <TextAreaInput
                label="Assessment results"
                value={iepData.plaaFP.assessmentResults}
                onChange={(value) => updatePlaafp("assessmentResults", value)}
                placeholder="Summarize available classroom, curriculum-based, or formal assessment results."
              />
              <TextAreaInput
                label="Teacher observations"
                value={iepData.plaaFP.teacherObservations}
                onChange={(value) => updatePlaafp("teacherObservations", value)}
                placeholder="Describe observed performance, participation, and support needs."
              />

              <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100">
                <div className="space-y-3 p-5">
                  <TextAreaInput
                    label="Draft PLAAFP"
                    value={iepData.plaaFP.aiDraft}
                    onChange={(value) => updatePlaafp("aiDraft", value)}
                    placeholder="Generated or manually written PLAAFP text."
                    rows={7}
                  />
                  <div className="rounded-lg bg-base-200 p-3 text-xs text-base-content/70">
                    <p className="font-semibold">
                      AI-generated draft. Please review and edit before saving.
                    </p>
                    <p className="mt-1">
                      AI assists with drafting only. The teacher remains
                      responsible for reviewing and approving the final IEP
                      content.
                    </p>
                    <p className="mt-1">
                      An internet connection is required. Only the PLAAFP
                      context shown above is sent to the configured Groq
                      service.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={generatePlaafpDraft}
                      loading={isGeneratingPlaafp}
                      disabled={isGeneratingPlaafp || !student?.id}
                    >
                      {!isGeneratingPlaafp && <Sparkles size={18} />}
                      {isGeneratingPlaafp
                        ? "Generating draft..."
                        : "Generate PLAAFP Draft"}
                    </Button>
                  </div>
                </div>
              </div>
            </SectionWrapper>
          )}

          {activeSection === 2 && (
            <SectionWrapper
              title="Annual Goals"
              description="Write a measurable goal the student can work toward within the school year."
              example="Tip: Include the target date, condition, observable skill, success criteria, and measurement method."
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Button
                    onClick={suggestGoalsWithAi}
                    loading={isSuggestingGoals}
                    disabled={isSuggestingGoals || !student?.id}
                  >
                    {!isSuggestingGoals && <Sparkles size={18} />}
                    {isSuggestingGoals
                      ? "Suggesting goals..."
                      : "Suggest Goals with AI"}
                  </Button>
                  <p className="mt-2 max-w-xl text-xs text-base-content/60">
                    AI suggests editable goals only. The teacher remains
                    responsible for reviewing and approving all IEP goals.
                  </p>
                </div>
                <Button
                  className={isGoalBankOpen ? "btn-primary" : "btn-ghost"}
                  onClick={() => setIsGoalBankOpen((isOpen) => !isOpen)}
                >
                  <Search size={16} /> Goal Bank
                </Button>
              </div>

              {aiGoalSuggestions.length > 0 && (
                <AiGoalSuggestionPanel
                  suggestions={aiGoalSuggestions}
                  onUse={useAiGoalSuggestion}
                  onDismiss={(suggestionIndex) =>
                    setAiGoalSuggestions((current) =>
                      current.filter((_, index) => index !== suggestionIndex),
                    )
                  }
                  onDismissAll={() => setAiGoalSuggestions([])}
                />
              )}

              <div
                className={`grid gap-4 ${
                  isGoalBankOpen
                    ? "xl:grid-cols-[minmax(0,1fr)_24rem]"
                    : "grid-cols-1"
                }`}
              >
                <div className="space-y-4">
                  {iepData.goals.map((goal, index) => (
                    <GoalBuilderCard
                      key={goal.id}
                      goal={normalizeGoal(goal)}
                      index={index}
                      totalGoals={iepData.goals.length}
                      isExpanded={expandedGoalId === goal.id}
                      onEdit={() => setExpandedGoalId(goal.id)}
                      onRemove={() => removeGoal(goal.id)}
                      onChange={(field, value) =>
                        updateGoal(goal.id, field, value)
                      }
                      onAreaChange={(area) => updateGoalArea(goal.id, area)}
                      onAnnualChange={(field, value) =>
                        updateAnnualGoal(goal.id, field, value)
                      }
                      onAddObjective={() => addObjective(goal.id)}
                      onUpdateObjective={(objectiveId, field, value) =>
                        updateObjective(goal.id, objectiveId, field, value)
                      }
                      onRemoveObjective={(objectiveId) =>
                        removeObjective(goal.id, objectiveId)
                      }

                      onDone={() => {
                        const warning = getGoalWarnings(goal)[0];
                        setExpandedGoalId(null);
                        if (warning) {
                          toast(`Goal needs review: ${warning}`, { icon: "!" });
                        } else {
                          toast.success("Goal ready");
                        }
                      }}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full justify-center"
                    onClick={addGoal}
                  >
                    <Plus size={14} /> Add another goal
                  </Button>
                </div>

                {isGoalBankOpen && (
                  <GoalBankPicker
                    query={goalBankQuery}
                    onQueryChange={setGoalBankQuery}
                    templates={filteredGoalBankTemplates}
                    totalTemplates={goalBankTemplates.length}
                    onAddGoal={addGoalFromBank}
                    onClose={() => setIsGoalBankOpen(false)}
                  />
                )}
              </div>
            </SectionWrapper>
          )}

          {activeSection === 3 && (
            <SectionWrapper
              title="Accommodations & Modifications"
              description="Select or describe supports that help the student access lessons and activities."
            >
              <AccommodationGroup
                title="Presentation accommodations"
                items={[
                  "Read-aloud for tests",
                  "Larger print materials",
                  "Visual aids and diagrams",
                  "Audio version of texts",
                ]}
                selected={iepData.accommodations.presentation}
                onToggle={(item) => toggleAccommodation("presentation", item)}
              />
              <AccommodationGroup
                title="Time and environment"
                items={[
                  "Extended time",
                  "Preferential seating",
                  "Reduced distractions room",
                  "Frequent breaks",
                ]}
                selected={iepData.accommodations.timeEnvironment}
                onToggle={(item) =>
                  toggleAccommodation("timeEnvironment", item)
                }
              />
              <AccommodationGroup
                title="Response accommodations"
                items={[
                  "Oral responses allowed",
                  "Scribe for written work",
                  "Reduced writing volume",
                  "Multiple choice format",
                ]}
                selected={iepData.accommodations.response}
                onToggle={(item) => toggleAccommodation("response", item)}
              />
            </SectionWrapper>
          )}

          {activeSection === 4 && (
            <SectionWrapper
              title="Special Education Services"
              description="Identify who will support the student, where support happens, and how often it is provided."
            >
              {iepData.services.map((service, index) => (
                <div
                  key={service.id}
                  className="card card-compact bg-base-100 border border-base-300 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">
                      Service {index + 1}
                    </h3>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square text-base-content"
                      onClick={() => removeService(service.id)}
                      disabled={iepData.services.length === 1}
                      title="Remove service"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <Input
                    label="Service name"
                    value={service.name}
                    onChange={(event) =>
                      updateService(service.id, "name", event.target.value)
                    }
                  />

                  <div className="grid gap-4 md:grid-cols-4 mt-2.5">
                    <CreatableSelectInput
                      label="Frequency"
                      value={service.frequency}
                      onChange={(value) =>
                        updateService(service.id, "frequency", value)
                      }
                      options={serviceFrequencyOptions}
                      styles={selectStyles}
                    />

                    <CreatableSelectInput
                      label="Duration"
                      value={service.duration}
                      onChange={(value) =>
                        updateService(service.id, "duration", value)
                      }
                      options={serviceDurationOptions}
                      styles={selectStyles}
                    />

                    <CreatableSelectInput
                      label="Setting"
                      value={service.setting}
                      onChange={(value) =>
                        updateService(service.id, "setting", value)
                      }
                      options={serviceSettingOptions}
                      styles={selectStyles}
                    />

                    <CreatableSelectInput
                      label="Provider"
                      value={service.provider}
                      onChange={(value) =>
                        updateService(service.id, "provider", value)
                      }
                      options={serviceProviderOptions}
                      styles={selectStyles}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                className="justify-center"
                onClick={addService}
              >
                <Plus size={14} /> Add service
              </Button>
            </SectionWrapper>
          )}

          {activeSection === 5 && (
            <SectionWrapper
              title="Review, Progress Monitoring & Export"
              description="Choose how the teacher will check if the student is improving, then review and save the IEP."
              example="Use Print / PDF or Export Word in the left panel after saving the completed IEP."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CreatableSelectInput
                  label="Data collection method"
                  value={iepData.progressPlan.dataMethod}
                  onChange={(value) => updateProgressPlan("dataMethod", value)}
                  options={[
                    "Trial-by-trial recording",
                    "Percent correct",
                    "Frequency count",
                    "Duration recording",
                    "Work sample review",
                  ]}
                />
                <CreatableSelectInput
                  label="Collection frequency"
                  value={iepData.progressPlan.frequency}
                  onChange={(value) => updateProgressPlan("frequency", value)}
                  options={["Daily", "2x per week", "Weekly", "Bi-weekly"]}
                />
                <CreatableSelectInput
                  label="Parent report schedule"
                  value={iepData.progressPlan.parentReport}
                  onChange={(value) =>
                    updateProgressPlan("parentReport", value)
                  }
                  options={["Monthly", "Quarterly", "Semi-annually"]}
                />
                <Input
                  label="Person responsible"
                  value={iepData.progressPlan.responsible}
                  onChange={(event) =>
                    updateProgressPlan("responsible", event.target.value)
                  }
                />
              </div>
              <TextAreaInput
                label="Additional notes"
                value={iepData.progressPlan.notes}
                onChange={(value) => updateProgressPlan("notes", value)}
              />
              <div className="rounded-lg border border-success/30 bg-success/10 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-base-content">
                  <Check size={18} /> Ready to save
                </div>
                <p className="text-sm text-base-content">
                  Mark this section complete and save to move the IEP into
                  Active IEPs.
                </p>
              </div>
            </SectionWrapper>
          )}

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 shadow-md">
            <Button
              variant="ghost"
              disabled={activeSection === 0}
              onClick={() => setActiveSection((section) => section - 1)}
            >
              Back
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => markSectionDone(activeSection)}>
                <Check size={16} /> Mark Complete
              </Button>
              {activeSection < sections.length - 1 ? (
                <Button
                  onClick={async () => {
                    markSectionDone(activeSection);
                    const saved = await handleSave();
                    if (saved) setActiveSection((section) => section + 1);
                  }}
                >
                  Save Draft & Next
                </Button>
              ) : (
                <Button onClick={() => handleSave()} loading={isSaving}>
                  <Save size={16} /> Review & Save IEP
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SectionWrapper = ({ title, description, example, children }) => (
  <section className="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-base-content/60">{description}</p>
      {example && (
        <p className="mt-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-base-content/70">
          {example}
        </p>
      )}
    </div>
    {children}
  </section>
);

const AiGoalSuggestionPanel = ({
  suggestions,
  onUse,
  onDismiss,
  onDismissAll,
}) => (
  <section className="rounded-xl border border-base-300 bg-base-200/60 p-4">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold">AI Goal Suggestions</h3>
        <p className="mt-1 text-sm text-base-content/60">
          Review every field before adding a suggestion. Nothing here is saved
          automatically.
        </p>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square"
        onClick={onDismissAll}
        aria-label="Dismiss all goal suggestions"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="grid gap-3 xl:grid-cols-2">
      {suggestions.map((suggestion, index) => (
        <article
          key={`${suggestion.area || "goal"}-${index}`}
          className="rounded-lg border border-base-300 bg-base-100 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="badge badge-primary badge-outline">
              {suggestion.area || "Area not specified"}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => onDismiss(index)}
              aria-label={`Dismiss ${suggestion.area || "goal"} suggestion`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="mt-3 font-medium leading-relaxed">
            {buildGoalText(suggestion.annualGoal) ||
              "Goal statement needs teacher input."}
          </p>

          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Current Performance
              </p>
              <p className="mt-1 text-base-content/75">
                {suggestion.currentPerformance || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Short-Term Objectives
              </p>
              {suggestion.objectives?.length ? (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-base-content/75">
                  {suggestion.objectives.map((objective, objectiveIndex) => (
                    <li key={`${objective.description}-${objectiveIndex}`}>
                      {objective.description || "Objective"}
                      {objective.criteria ? ` - ${objective.criteria}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-base-content/60">
                  No objectives suggested.
                </p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-base-content/50">
                  Measurement
                </p>
                <p>{suggestion.measurementMethod || "Not specified"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-base-content/50">
                  Frequency
                </p>
                <p>{suggestion.measurementFrequency || "Not specified"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-base-content/50">
                Supports
              </p>
              <p className="mt-1 text-base-content/75">
                {suggestion.supports?.length
                  ? suggestion.supports.join(", ")
                  : "Not specified"}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            className="mt-4 w-full justify-center"
            onClick={() => onUse(suggestion, index)}
          >
            <Plus size={14} /> Use this goal
          </Button>
        </article>
      ))}
    </div>
  </section>
);

const GoalBuilderCard = ({
  goal,
  index,
  totalGoals,
  isExpanded,
  onEdit,
  onRemove,
  onChange,
  onAreaChange,
  onAnnualChange,
  onAddObjective,
  onUpdateObjective,
  onRemoveObjective,
  onDone,
}) => {
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  if (!isExpanded) {
    return (
      <article className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-base-content">
                {goal.area || `Goal ${index + 1}`}
              </span>
              <span className="badge badge-outline">{goal.status}</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6">
              {getGoalStatement(goal)}
            </p>
            <div className="mt-4 grid gap-2 text-xs text-base-content/60 sm:grid-cols-3">
              <span>
                <strong className="text-base-content/80">Progress:</strong>{" "}
                {goal.progressPercentage}%
              </span>
              <span>
                <strong className="text-base-content/80">Monitoring:</strong>{" "}
                {goal.measurementMethod || "Not set"}
                {goal.measurementFrequency
                  ? ` / ${goal.measurementFrequency}`
                  : ""}
              </span>
              <span>
                <strong className="text-base-content/80">Objectives:</strong>{" "}
                {goal.objectives.length}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="secondary" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              disabled={totalGoals === 1}
              onClick={onRemove}
            >
              Remove
            </Button>
          </div>
        </div>
      </article>
    );
  }

  const warnings = getGoalWarnings(goal);

  return (
    <article className="space-y-6 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-base-300 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-base-content">
            Guided Goal Builder
          </p>
          <h3 className="mt-1 text-lg font-bold">Goal {index + 1}</h3>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAdvancedFields((visible) => !visible)}
          >
            {showAdvancedFields
              ? "Hide Advanced Fields"
              : "Show Advanced Fields"}
          </Button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-base-content"
            onClick={onRemove}
            disabled={totalGoals === 1}
          >
            <Trash2 className="h-5 w-5" /> Remove
          </button>
        </div>
      </div>

      <section className="space-y-5">
        <div>
          <h4 className="font-bold">Essential Goal Information</h4>
          <p className="mt-1 text-sm text-base-content/60">
            Start with the fields needed for a clear, measurable goal.
          </p>
        </div>

        <CreatableSelectInput
          label="Area of Need"
          value={goal.area}
          onChange={onAreaChange}
          options={goalAreas}
          placeholder="Choose an area of need"
        />

        <div>
          <TextAreaInput
            label="Current Performance"
            value={goal.currentPerformance}
            onChange={(value) => onChange("currentPerformance", value)}
            placeholder="Describe current skills using recent classroom evidence."
            rows={3}
          />
          <p className="mt-1 text-xs text-base-content/55">
            Describe what the learner can currently do and what support is needed.
          </p>
        </div>

        <div>
          <TextAreaInput
            label="Goal Statement"
            value={goal.generatedGoalText}
            onChange={(value) => onChange("generatedGoalText", value)}
            placeholder="Write the measurable annual goal sentence."
            rows={4}
          />
          <p className="mt-1 text-xs text-base-content/55">
            This sentence will appear in the final IEP report.
          </p>
        </div>

        {!showAdvancedFields && (
          <Input
            label="Success Criteria"
            value={goal.annualGoal.criteria}
            onChange={(event) =>
              onChange("annualGoal", {
                ...goal.annualGoal,
                criteria: event.target.value,
              })
            }
            helperText="Example: with 80% accuracy in 4 out of 5 trials."
            placeholder="with 80% accuracy in 4 out of 5 trials"
          />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <CreatableSelectInput
            label="How Progress Will Be Measured"
            value={goal.measurementMethod}
            onChange={(value) => onChange("measurementMethod", value)}
            options={measurementMethods}
            placeholder="Choose a method"
          />
          <CreatableSelectInput
            label="How Often Progress Will Be Checked"
            value={goal.measurementFrequency}
            onChange={(value) => onChange("measurementFrequency", value)}
            options={measurementFrequencies}
            placeholder="Choose frequency"
          />
        </div>

        <div className="rounded-xl bg-base-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-base-content/50">
            Goal Preview
          </p>
          <p className="mt-2 text-sm font-semibold leading-6">
            {getGoalStatement(goal)}
          </p>
        </div>
      </section>

      {showAdvancedFields && (
        <div className="space-y-6 border-t border-base-300 pt-6">
          <div>
            <h4 className="text-lg font-bold">Advanced Goal Details</h4>
            <p className="mt-1 text-sm text-base-content/60">
              Add baseline evidence, structured goal parts, objectives, supports,
              and reporting details when needed.
            </p>
          </div>

          <GoalSection letter="A" title="Baseline and Identified Need">
            <TextAreaInput
              label="Need"
              value={goal.need}
              onChange={(value) => onChange("need", value)}
              placeholder="Explain the skill gap and support needed."
              rows={3}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Baseline Value"
                value={goal.baselineValue}
                onChange={(event) =>
                  onChange("baselineValue", event.target.value)
                }
                placeholder="e.g., 4/10 questions or 3 prompts"
              />
              <CreatableSelectInput
                label="Baseline Method"
                value={goal.baselineMethod}
                onChange={(value) => onChange("baselineMethod", value)}
                options={measurementMethods}
                placeholder="How was baseline measured?"
              />
            </div>
          </GoalSection>

          <GoalSection
            letter="B"
            title="Structured Annual Goal"
            helper="Changing these fields regenerates the Goal Statement above."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Timeframe"
                value={goal.annualGoal.timeframe}
                onChange={(event) =>
                  onAnnualChange("timeframe", event.target.value)
                }
                placeholder="By the end of the school year"
              />
              <Input
                label="Success Criteria"
                value={goal.annualGoal.criteria}
                onChange={(event) =>
                  onAnnualChange("criteria", event.target.value)
                }
                helperText="Example: with 80% accuracy in 4 out of 5 trials."
                placeholder="with 80% accuracy in 4 out of 5 trials"
              />
            </div>
            <TextAreaInput
              label="Condition"
              value={goal.annualGoal.condition}
              onChange={(value) => onAnnualChange("condition", value)}
              placeholder="Given a short reading passage and visual prompts"
              rows={2}
            />
            <TextAreaInput
              label="Behavior / Skill"
              value={goal.annualGoal.behavior}
              onChange={(value) => onAnnualChange("behavior", value)}
              placeholder="answer comprehension questions"
              rows={2}
            />
          </GoalSection>

          <GoalSection letter="C" title="Short-Term Objectives">
            {goal.objectives.length ? (
              <div className="space-y-3">
                {goal.objectives.map((objective, objectiveIndex) => (
                  <div
                    key={objective.id}
                    className="rounded-xl border border-base-300 bg-base-200/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        Objective {objectiveIndex + 1}
                      </h4>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-base-content"
                        onClick={() => onRemoveObjective(objective.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <TextAreaInput
                      label="Objective Description"
                      value={objective.description}
                      onChange={(value) =>
                        onUpdateObjective(objective.id, "description", value)
                      }
                      rows={2}
                    />
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <Input
                        label="Success Criteria"
                        value={objective.criteria}
                        onChange={(event) =>
                          onUpdateObjective(
                            objective.id,
                            "criteria",
                            event.target.value,
                          )
                        }
                        placeholder="e.g., 70% accuracy"
                      />
                      <CreatableSelectInput
                        label="Status"
                        value={objective.status}
                        onChange={(value) =>
                          onUpdateObjective(objective.id, "status", value)
                        }
                        options={objectiveStatuses}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60">
                No short-term objectives added yet.
              </p>
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={Plus}
              onClick={onAddObjective}
            >
              Add Objective
            </Button>
          </GoalSection>

          <GoalSection letter="D" title="Progress and Reporting">
            <div className="grid gap-4 md:grid-cols-3">
              <CreatableSelectInput
                label="Reporting Schedule"
                value={goal.progressReportingSchedule}
                onChange={(value) =>
                  onChange("progressReportingSchedule", value)
                }
                options={reportingSchedules}
                placeholder="Choose schedule"
              />
              <CreatableSelectInput
                label="Goal Status"
                value={goal.status}
                onChange={(value) => onChange("status", value)}
                options={goalStatuses}
              />
              <Input
                label="Progress Percentage"
                type="number"
                min="0"
                max="100"
                value={goal.progressPercentage}
                onChange={(event) =>
                  onChange("progressPercentage", Number(event.target.value))
                }
              />
            </div>
          </GoalSection>

          <GoalSection letter="E" title="Suggested Supports">
            <CreatableSelectInput
              label="Supports"
              value={goal.supports}
              onChange={(value) => onChange("supports", value)}
              options={commonSupports}
              placeholder="Select or add supports"
              isMulti
            />
          </GoalSection>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-warning/25 bg-warning/5 p-4">
          <p className="text-sm font-semibold text-base-content">
            Complete these items before finishing the goal:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-base-content/70">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onDone}>Finish Goal</Button>
      </div>
    </article>
  );
};

const GoalSection = ({ letter, title, helper, children }) => (
  <section className="space-y-4">
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-base-content">
        {letter}
      </span>
      <div>
        <h4 className="font-bold">{title}</h4>
        {helper && (
          <p className="mt-1 text-sm leading-6 text-base-content/60">{helper}</p>
        )}
      </div>
    </div>
    <div className="space-y-4 pl-0 sm:pl-10">{children}</div>
  </section>
);

const GoalBankPicker = ({
  query,
  onQueryChange,
  templates,
  totalTemplates,
  onAddGoal,
  onClose,
}) => (
  <aside className="rounded-lg border border-base-300 bg-base-100 p-4 xl:sticky xl:top-0 xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto">
    <div className="mb-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Goal Bank</h3>
          <p className="text-xs text-base-content/60">
            Search templates and add one directly to this IEP.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square"
          onClick={onClose}
          title="Close Goal Bank"
        >
          <X size={14} />
        </button>
      </div>
      <label className="input input-bordered flex w-full items-center gap-2 border border-base-300">
        <Search className="h-4 w-4 opacity-60" />
        <input
          type="text"
          className="grow"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search goal templates..."
        />
      </label>
    </div>

    {templates.length > 0 ? (
      <div className="grid gap-3">
        {templates.map((goal) => (
          <article
            key={goal.id}
            className="rounded-md border border-base-300 bg-base-100 p-3"
          >
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="badge badge-outline">
                {goal.area || "General"}
              </span>
              <span className="badge badge-ghost">
                {goal.difficulty}
              </span>
              {goal.isCustom && (
                <span className="badge badge-primary">Custom</span>
              )}
            </div>
            <div className="space-y-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">{goal.skillFocus}</h4>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-base-content/70">
                  {goal.goalText}
                </p>
                <p className="mt-2 line-clamp-1 text-xs text-base-content/55">
                  {goal.measurementMethod || "Measurement not set"} / {goal.frequency}
                </p>
              </div>
              <Button
                size="sm"
                className="btn-ghost w-full justify-center"
                onClick={() => onAddGoal(goal)}
              >
                <Plus size={14} /> Use Template
              </Button>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="rounded-md border border-dashed border-base-300 p-5 text-center text-sm text-base-content/60">
        No matching templates from {totalTemplates} saved goals.
      </div>
    )}
  </aside>
);

const AccommodationGroup = ({ title, items, selected, onToggle }) => (
  <div>
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
      {title}
    </div>
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const isChecked = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
              isChecked
                ? "border-success/30 bg-success/10"
                : "border-base-300 bg-base-100 hover:bg-base-200"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                isChecked
                  ? "bg-success text-success-content"
                  : "border-2 border-base-300"
              }`}
            >
              {isChecked && <Check size={12} strokeWidth={3} />}
            </span>
            <span>{item}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default IEPBuilder;

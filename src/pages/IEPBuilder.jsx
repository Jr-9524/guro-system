// src/pages/IEPBuilder.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Check,
  Download,
  Plus,
  Printer,
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

const sections = [
  { title: "Student Info", sub: "Profile", key: "studentInfo" },
  { title: "Present Levels", sub: "PLAAFP", key: "plaaFP" },
  { title: "Annual Goals", sub: "SMART goals", key: "goals" },
  { title: "Accommodations", sub: "Supports", key: "accommodations" },
  { title: "Services", sub: "Schedule", key: "services" },
  { title: "Progress Plan", sub: "Monitoring", key: "progressPlan" },
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
const goalAreas = [
  "Reading",
  "Writing",
  "Math",
  "Communication",
  "Behavior",
  "Social Skills",
  "Motor Skills",
  "Self-help",
  "Attendance",
];
const sessionOptions = [
  "1 consecutive session",
  "2 consecutive sessions",
  "3 consecutive sessions",
  "4 consecutive sessions",
  "Weekly",
  "Bi-weekly",
  "Monthly",
];
const measurementOptions = [
  "Teacher-made assessment",
  "Curriculum-based measurement",
  "Work sample review",
  "Observation checklist",
  "Rubric",
  "Progress monitoring probe",
];

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
    strengths: "",
    challenges: "",
    impact: "",
    aiDraft: "",
  },
  goals: [
    {
      id: 1,
      area: "Reading",
      description: "",
      date: "",
      accuracy: "80",
      sessions: "3 consecutive sessions",
      measurement: "Teacher-made assessment",
    },
  ],
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
  const [customGoalTemplates, setCustomGoalTemplates] = useState([]);
  const [goalBankQuery, setGoalBankQuery] = useState("");
  const [isGoalBankOpen, setIsGoalBankOpen] = useState(false);

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
      toast.success("Goal added from Goal Bank");
      setActiveSection(2);
      setIepData((current) => ({
        ...current,
        goals: [
          ...current.goals,
          {
            id: Date.now(),
            area: queuedGoal.area || "Goal Bank",
            description: queuedGoal.description || "",
            date: queuedGoal.date || "",
            accuracy: queuedGoal.accuracy || "",
            sessions: queuedGoal.sessions || "",
            measurement: queuedGoal.measurement || "",
          },
        ],
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
        setIepData({ ...cloneDefaultIepData(), ...existing.data });
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
    () => [...seededGoals, ...customGoalTemplates],
    [customGoalTemplates],
  );

  const filteredGoalBankTemplates = useMemo(() => {
    const normalizedQuery = goalBankQuery.trim().toLowerCase();

    if (!normalizedQuery) return goalBankTemplates.slice(0, 6);

    return goalBankTemplates
      .filter((goal) =>
        [
          goal.title,
          goal.description,
          goal.area,
          goal.category,
          goal.gradeBand,
          goal.criteria,
          goal.measurement,
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

  const updateGoal = (goalId, field, value) => {
    setIepData((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId ? { ...goal, [field]: value } : goal,
      ),
    }));
  };

  const addGoal = () => {
    setIepData((current) => ({
      ...current,
      goals: [
        ...current.goals,
        {
          id: Date.now(),
          area: "New Goal",
          description: "",
          date: "",
          accuracy: "80",
          sessions: "Weekly",
          measurement: "Teacher-made assessment",
        },
      ],
    }));
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
    const percentMatch = template.criteria?.match(/(\d+(?:\.\d+)?)\s*%/);

    setIepData((current) => ({
      ...current,
      goals: [
        ...current.goals,
        {
          id: Date.now(),
          area: template.area || "Goal Bank",
          description: template.description || "",
          date: "",
          accuracy: percentMatch ? percentMatch[1] : "",
          sessions: template.criteria || "As documented",
          measurement: template.measurement || "",
        },
      ],
    }));
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

  const validateBeforeSave = () => {
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

    return true;
  };

  const handleSave = async ({ completeCurrentSection = true } = {}) => {
    if (!validateBeforeSave()) return false;

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

  const prepareAiSpace = () => {
    updatePlaafp(
      "aiDraft",
      iepData.plaaFP.aiDraft ||
        "AI draft placeholder. Connect your AI generation here and write the generated PLAAFP text into this field.",
    );
    toast.success("AI draft space is ready");
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
          {activeSection === 0 && (
            <SectionWrapper
              title="Student Information"
              description="Link the IEP to a student and confirm basic profile details."
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
              description="Capture current performance, strengths, needs, and classroom impact."
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

              <div className="overflow-hidden rounded-md border border-gray-300 border-success/30 bg-base-100">
                <div className="space-y-3 p-5">
                  <TextAreaInput
                    label="Draft PLAAFP"
                    value={iepData.plaaFP.aiDraft}
                    onChange={(value) => updatePlaafp("aiDraft", value)}
                    placeholder="Generated or manually written PLAAFP text."
                    rows={7}
                  />
                  <div className="flex justify-end">
                    <Button onClick={prepareAiSpace}>
                      <Sparkles size={18} /> Generate AI PLAAFP
                    </Button>
                  </div>
                </div>
              </div>
            </SectionWrapper>
          )}

          {activeSection === 2 && (
            <SectionWrapper
              title="Annual Goals"
              description="Write measurable SMART goals for the IEP period."
            >
              <div className="flex justify-end">
                <Button
                  className={isGoalBankOpen ? "btn-primary" : "btn-ghost"}
                  onClick={() => setIsGoalBankOpen((isOpen) => !isOpen)}
                >
                  <Search size={16} /> Goal Bank
                </Button>
              </div>

              <div
                className={`grid gap-4 ${
                  isGoalBankOpen
                    ? "xl:grid-cols-[minmax(0,1fr)_24rem]"
                    : "grid-cols-1"
                }`}
              >
                <div className="space-y-4">
                  {iepData.goals.map((goal, index) => (
                    <div
                      key={goal.id}
                      className="card card-compact bg-base-100 border border-base-300 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">
                          Goal {index + 1}
                        </h3>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square text-error"
                          onClick={() => removeGoal(goal.id)}
                          disabled={iepData.goals.length === 1}
                          title="Remove goal"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 mb-2">
                        <CreatableSelectInput
                          label="Goal area"
                          value={goal.area}
                          onChange={(value) =>
                            updateGoal(goal.id, "area", value)
                          }
                          options={goalAreas}
                          styles={selectStyles}
                          className="w-full"
                          placeholder="Select or type to create"
                        />

                        <Input
                          label="Target date"
                          type="date"
                          value={goal.date}
                          onChange={(event) =>
                            updateGoal(goal.id, "date", event.target.value)
                          }
                        />
                      </div>
                      <div className="mb-2">
                        <TextAreaInput
                          label="SMART goal"
                          value={goal.description}
                          onChange={(value) =>
                            updateGoal(goal.id, "description", value)
                          }
                          placeholder="By [date], given [condition], the student will [behavior] with [criteria] as measured by [method]."
                          rows={3}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <Input
                          label="Criteria (%)"
                          type="number"
                          value={String(goal.accuracy || "").replace(
                            /[^\d.]/g,
                            "",
                          )}
                          onChange={(event) =>
                            updateGoal(goal.id, "accuracy", event.target.value)
                          }
                          min="0"
                          max="100"
                          step="1"
                        />
                        <SelectInput
                          label="Sessions"
                          value={goal.sessions}
                          onChange={(value) =>
                            updateGoal(goal.id, "sessions", value)
                          }
                          options={sessionOptions}
                          placeholder="Select sessions"
                        />
                        <SelectInput
                          label="Measurement"
                          value={goal.measurement}
                          onChange={(value) =>
                            updateGoal(goal.id, "measurement", value)
                          }
                          options={measurementOptions}
                          placeholder="Select measurement"
                        />
                      </div>
                    </div>
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
              description="Select the supports the student needs to access instruction."
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
              description="Define the services, frequency, setting, and provider."
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
                      className="btn btn-ghost btn-xs btn-square text-error"
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
              title="Progress Monitoring Plan"
              description="Document how progress will be collected and reported."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SelectInput
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
                <SelectInput
                  label="Collection frequency"
                  value={iepData.progressPlan.frequency}
                  onChange={(value) => updateProgressPlan("frequency", value)}
                  options={["Daily", "2x per week", "Weekly", "Bi-weekly"]}
                />
                <SelectInput
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
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-success">
                  <Check size={18} /> Ready to save
                </div>
                <p className="text-sm text-success/70">
                  Mark this section complete and save to move the IEP into
                  Active IEPs.
                </p>
              </div>
            </SectionWrapper>
          )}

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-info px-4 py-3 shadow-md">
            <Button
              variant="ghost"
              disabled={activeSection === 0}
              onClick={() => setActiveSection((section) => section - 1)}
            >
              Previous "Baguhin nalang kulay"
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
                  Save Section & Continue
                </Button>
              ) : (
                <Button onClick={() => handleSave()} loading={isSaving}>
                  <Save size={16} /> Save IEP
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SectionWrapper = ({ title, description, children }) => (
  <section className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-base-content/60 mb-6">{description}</p>
    </div>
    {children}
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
                {goal.gradeBand || "All grades"}
              </span>
              {goal.source === "custom" && (
                <span className="badge badge-primary">Custom</span>
              )}
            </div>
            <div className="space-y-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">{goal.title}</h4>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-base-content/70">
                  {goal.description}
                </p>
                <p className="mt-2 line-clamp-1 text-xs text-base-content/55">
                  {goal.measurement || "Measurement not set"}
                </p>
              </div>
              <Button
                size="sm"
                className="btn-ghost w-full justify-center"
                onClick={() => onAddGoal(goal)}
              >
                <Plus size={14} /> Add to goals
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
                : "border-gray-300 bg-base-100 hover:bg-base-200"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                isChecked
                  ? "bg-success text-primary-content"
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

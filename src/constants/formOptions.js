export const disabilityCategories = [
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

export const gradeLevels = [
  { label: "Kindergarten", value: "K" },
  ...Array.from({ length: 12 }, (_, index) => ({
    label: `Grade ${index + 1}`,
    value: String(index + 1),
  })),
];

export const areasOfNeed = [
  "Reading",
  "Writing",
  "Mathematics",
  "Communication",
  "Behavior",
  "Social Skills",
  "Motor Skills",
  "Functional / Self-care",
];

export const communicationModes = [
  "Verbal",
  "Non-verbal",
  "FSL",
  "AAC",
  "Braille",
];

export const supportIntensityOptions = [
  "Consultative",
  "Intermittent",
  "Limited",
  "Extensive",
  "Pervasive",
];

export const developmentalLevels = [
  "Emerging",
  "Developing",
  "Approaching expected level",
  "At expected level",
];

export const measurementMethods = [
  "Teacher observation",
  "Checklist",
  "Quiz/worksheet score",
  "Rubric",
  "Behavior frequency count",
  "Performance task",
  "Work sample review",
];

export const progressFrequencies = [
  "Daily",
  "Weekly",
  "Every 2 weeks",
  "Monthly",
  "Quarterly",
];

export const reportingSchedules = [
  "Monthly",
  "Quarterly",
  "Every grading period",
  "Semi-annually",
];

export const commonAccommodations = [
  "Visual prompts",
  "Repeated instructions",
  "Small-group instruction",
  "Extra response time",
  "Guided practice",
  "Simplified text",
  "Positive reinforcement",
  "Assistive technology",
];

export const commonSupports = [...commonAccommodations];

export const goalStatuses = [
  "Not Started",
  "In Progress",
  "Needs Attention",
  "Completed",
];

export const objectiveStatuses = [
  "Not Started",
  "In Progress",
  "Completed",
];
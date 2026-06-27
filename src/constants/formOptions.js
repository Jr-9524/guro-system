export const disabilityCategories = [
  "Autism Spectrum Disorder", "Intellectual Disability", "Learning Disability",
  "Speech or Language Impairment", "Hearing Impairment", "Visual Impairment",
  "Orthopedic Impairment", "Emotional-Behavioral Difficulty", "Multiple Disabilities", "Other",
];

export const gradeLevels = [
  { label: "Kindergarten", value: "K" },
  ...Array.from({ length: 12 }, (_, index) => ({ label: "Grade " + (index + 1), value: String(index + 1) })),
];

export const academicPerformanceLevels = [
  "Pre-K level",
  "Kindergarten level",
  ...Array.from({ length: 12 }, (_, index) => "Grade " + (index + 1) + " level"),
  "Below grade level",
  "At grade level",
  "Above grade level",
];

export const areasOfNeed = ["Reading", "Writing", "Mathematics", "Communication", "Behavior", "Social Skills", "Motor Skills", "Functional / Self-care"];
export const developmentalLevels = ["Emerging", "Developing", "Approaching Expected Level", "At Expected Level", "Needs Intensive Support"];
export const supportIntensities = ["Minimal Support", "Moderate Support", "Extensive Support", "Intensive Support"];
export const supportIntensityOptions = supportIntensities;
export const communicationModes = ["Verbal", "Non-verbal", "Filipino Sign Language", "AAC", "Picture Exchange", "Gestures", "Written Communication"];

export const assessmentMethods = [
  "Teacher observation", "Checklist", "Quiz / worksheet score", "Rubric", "Performance task",
  "Work sample", "Behavior frequency count", "Curriculum-based assessment",
];
export const measurementMethods = [
  "Teacher observation", "Checklist", "Quiz / worksheet score", "Rubric", "Behavior frequency count",
  "Performance task", "Work sample review", "Progress monitoring probe",
];
export const progressFrequencies = ["Daily", "Weekly", "Every 2 weeks", "Monthly", "Quarterly", "Every grading period"];
export const reportingSchedules = ["Monthly", "Quarterly", "Every grading period", "End of semester", "End of school year"];

export const commonAccommodations = [
  "Extended time", "Preferential seating", "Read-aloud instructions", "Visual aids", "Simplified instructions",
  "Repeated directions", "Reduced distractions", "Small-group setting", "Use of assistive technology", "Breaks between tasks",
];
export const commonModifications = [
  "Reduced number of items", "Modified difficulty level", "Alternative assignment format", "Shortened reading passage",
  "Simplified vocabulary", "Adjusted grading criteria", "Hands-on activity instead of written output",
];
export const commonSupports = [
  "Visual prompts", "Repeated instructions", "Small-group instruction", "Extra response time", "Guided practice",
  "Simplified text", "Positive reinforcement", "Assistive technology", "Peer buddy", "Task checklist",
];

export const serviceTypes = ["SPED support", "Speech therapy", "Occupational therapy", "Physical therapy", "Behavioral support", "Reading intervention", "Math intervention", "Counseling", "Consultation"];
export const serviceProviders = ["SPED Teacher", "General Education Teacher", "Speech-Language Pathologist", "Occupational Therapist", "Physical Therapist", "Guidance Counselor", "Behavioral Specialist", "Parent / Guardian", "Teaching Assistant"];
export const serviceLocations = ["General education classroom", "SPED classroom", "Resource room", "Therapy room", "Pull-out setting", "Inclusion setting", "Home-based activity", "Online / remote session"];
export const goalStatuses = ["Not Started", "In Progress", "Needs Attention", "Completed"];
export const objectiveStatuses = ["Not Started", "In Progress", "Completed"];

export const CUSTOM_GOALS_KEY = "goal-bank:custom-goals";
export const PENDING_GOAL_KEY = "goal-bank:pending-goal";

export const seededGoals = [
  {
    id: "reading-fluency-1",
    source: "built-in",
    area: "Reading",
    category: "Learning Disability",
    gradeBand: "Grades 1-3",
    title: "Reading Fluency",
    description:
      "By the end of the IEP period, given grade-level passage practice and teacher feedback, the student will read a passage aloud with improved accuracy and fluency at 90% accuracy across 3 consecutive probes.",
    criteria: "90% accuracy across 3 consecutive probes",
    measurement: "Curriculum-based oral reading fluency probes",
  },
  {
    id: "reading-comprehension-1",
    source: "built-in",
    area: "Reading",
    category: "Learning Disability",
    gradeBand: "Grades 4-6",
    title: "Reading Comprehension",
    description:
      "Given a short instructional-level text and visual organizer, the student will identify the main idea and 3 supporting details with 80% accuracy in 4 out of 5 trials.",
    criteria: "80% accuracy in 4 out of 5 trials",
    measurement: "Teacher-made comprehension checks",
  },
  {
    id: "written-expression-1",
    source: "built-in",
    area: "Writing",
    category: "Learning Disability",
    gradeBand: "Grades 3-6",
    title: "Paragraph Writing",
    description:
      "Given a graphic organizer and writing checklist, the student will write a paragraph with a topic sentence, at least 3 details, and a closing sentence in 4 out of 5 writing samples.",
    criteria: "4 out of 5 writing samples",
    measurement: "Writing rubric and work samples",
  },
  {
    id: "math-computation-1",
    source: "built-in",
    area: "Math",
    category: "Learning Disability",
    gradeBand: "Grades 2-5",
    title: "Math Computation",
    description:
      "Given explicit instruction and guided practice, the student will solve grade-level computation problems using a taught strategy with 80% accuracy across 3 consecutive sessions.",
    criteria: "80% accuracy across 3 consecutive sessions",
    measurement: "Teacher-made computation probes",
  },
  {
    id: "communication-1",
    source: "built-in",
    area: "Communication",
    category: "Speech/Language Disorder",
    gradeBand: "All Grades",
    title: "Functional Communication",
    description:
      "Given visual or verbal prompts, the student will use an appropriate communication mode to request help, clarify needs, or answer a question in 4 out of 5 observed opportunities.",
    criteria: "4 out of 5 observed opportunities",
    measurement: "Observation checklist",
  },
  {
    id: "behavior-self-regulation-1",
    source: "built-in",
    area: "Behavior",
    category: "Emotional-Behavioral Disorder",
    gradeBand: "All Grades",
    title: "Self-Regulation",
    description:
      "When presented with a frustrating task, the student will use a taught self-regulation strategy and return to the activity within 5 minutes in 80% of observed opportunities.",
    criteria: "80% of observed opportunities",
    measurement: "Behavior frequency and duration log",
  },
  {
    id: "adaptive-routine-1",
    source: "built-in",
    area: "Adaptive",
    category: "Intellectual Disability",
    gradeBand: "All Grades",
    title: "Classroom Routine",
    description:
      "Given a visual schedule and adult prompting as needed, the student will complete a classroom routine with no more than 1 prompt in 4 out of 5 opportunities.",
    criteria: "No more than 1 prompt in 4 out of 5 opportunities",
    measurement: "Task analysis checklist",
  },
  {
    id: "social-skills-1",
    source: "built-in",
    area: "Social Skills",
    category: "Autism Spectrum Disorder",
    gradeBand: "All Grades",
    title: "Peer Interaction",
    description:
      "During structured group activities, the student will initiate or respond to a peer interaction using an appropriate phrase or communication tool in 4 out of 5 opportunities.",
    criteria: "4 out of 5 opportunities",
    measurement: "Teacher observation checklist",
  },
];

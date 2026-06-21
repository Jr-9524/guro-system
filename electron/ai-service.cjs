const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_FIELD_LENGTH = 4000;

const PLAAFP_SYSTEM_PROMPT = `You are assisting a SPED teacher in drafting an IEP section.
Write a professional Present Level of Academic and Functional Performance (PLAAFP) draft.
Do not diagnose the student.
Do not invent assessment scores, medical details, disabilities, or other facts.
Use only the information provided.
Mention strengths, needs, current performance, and classroom impact when available.
Use formal but teacher-friendly language and keep the output editable.
If information is missing, use general wording that acknowledges the missing information instead of inventing facts.
Do not include final legal or medical claims.
Do not state or imply that the AI is certain.
Output only the PLAAFP draft text, without a title, preface, bullets, or commentary.`;

const GOAL_SYSTEM_PROMPT = `You are assisting a SPED teacher in drafting measurable IEP annual goals.
Do not diagnose the student or classify a disability.
Do not invent assessment scores, medical details, disabilities, or other facts.
Use only the provided information.
Suggest goals that are measurable, observable, and teacher-editable.
Each goal must include a condition, behavior, and measurable criteria.
Include short-term objectives, a progress measurement method and frequency, a reporting schedule, and suggested supports.
Avoid duplicating the existing goals provided in the context.
If information is missing, make the suggestion general without inventing specific facts.
Return no more than 3 focused goals.
Output valid JSON only. Do not include markdown or explanations outside the JSON.
Use this exact shape:
{"goals":[{"area":"Reading","currentPerformance":"Short description based only on provided data.","annualGoal":{"timeframe":"By the end of the school year","condition":"Given appropriate supports","behavior":"complete an observable skill","criteria":"with 80% accuracy in 4 out of 5 trials"},"objectives":[{"description":"Short-term objective","criteria":"Measurable criteria"}],"measurementMethod":"Teacher observation","measurementFrequency":"Weekly","progressReportingSchedule":"Every grading period","supports":["Visual prompts","Guided practice"]}]}`;

const PROGRESS_SYSTEM_PROMPT = `You are assisting a SPED teacher in writing an IEP progress summary.
Use only the provided goals, progress notes, scores, and teacher observations.
Do not diagnose the student, classify a disability, invent progress data, or make medical or legal conclusions.
Write in professional but teacher-friendly language and keep the output editable.
Include an overall progress statement, goal progress highlights, supported areas of improvement, areas needing continued support, and a suggested next instructional focus based only on the data.
Mention progress trends only when the provided data supports them.
If data is limited or no sessions are provided, clearly state that progress data is limited and do not claim that progress occurred.
Do not state or imply that the AI is certain.
Output only the progress summary text without a title, bullets, preface, or commentary.`;

const allowedFields = [
  "studentName",
  "age",
  "gradeLevel",
  "disabilityCategory",
  "learningNeeds",
  "assessmentResults",
  "teacherObservations",
  "strengths",
  "needs",
  "classroomImpact",
  "currentPerformance",
];

const normalizePayload = (payload = {}) =>
  Object.fromEntries(
    allowedFields.map((field) => [
      field,
      String(payload[field] ?? "")
        .trim()
        .slice(0, MAX_FIELD_LENGTH),
    ]),
  );

const formatContext = (payload) =>
  Object.entries(payload)
    .filter(([, value]) => value)
    .map(([field, value]) => `${field}: ${value}`)
    .join("\n");

const normalizeGoalPayload = (payload = {}) => ({
  ...normalizePayload(payload),
  selectedArea: String(payload.selectedArea ?? "")
    .trim()
    .slice(0, 100),
  plaafpDraft: String(payload.plaafpDraft ?? "")
    .trim()
    .slice(0, MAX_FIELD_LENGTH),
  existingGoals: JSON.stringify(
    Array.isArray(payload.existingGoals)
      ? payload.existingGoals.slice(0, 12)
      : [],
  ).slice(0, MAX_FIELD_LENGTH),
});

async function requestGroq({ systemPrompt, userPrompt, maxTokens }) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Groq is not configured. Set GROQ_API_KEY before starting GURO System.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = result?.error?.message;
      throw new Error(
        detail
          ? `Groq could not complete the request: ${detail}`
          : `Groq could not complete the request (HTTP ${response.status}).`,
      );
    }

    const text = result?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Groq returned an empty response.");
    return text;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The AI request timed out. Check the connection and try again.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function generatePlaafp(payload) {
  const context = formatContext(normalizePayload(payload));
  if (!context) {
    throw new Error(
      "Add student or PLAAFP information before generating a draft.",
    );
  }

  return requestGroq({
    systemPrompt: PLAAFP_SYSTEM_PROMPT,
    userPrompt: `Draft the PLAAFP using only this teacher-provided context:\n\n${context}`,
    maxTokens: 700,
  });
}

const toString = (value, maxLength = 1000) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const normalizeSuggestion = (goal = {}) => ({
  area: toString(goal.area, 100),
  currentPerformance: toString(goal.currentPerformance),
  annualGoal: {
    timeframe: toString(goal.annualGoal?.timeframe, 250),
    condition: toString(goal.annualGoal?.condition, 500),
    behavior: toString(goal.annualGoal?.behavior, 500).replace(
      /^the student will\s+/i,
      "",
    ),
    criteria: toString(goal.annualGoal?.criteria, 500),
  },
  objectives: (Array.isArray(goal.objectives) ? goal.objectives : [])
    .slice(0, 5)
    .map((objective) => ({
      description: toString(objective?.description, 500),
      criteria: toString(objective?.criteria, 300),
    })),
  measurementMethod: toString(goal.measurementMethod, 150),
  measurementFrequency: toString(goal.measurementFrequency, 150),
  progressReportingSchedule: toString(goal.progressReportingSchedule, 150),
  supports: (Array.isArray(goal.supports) ? goal.supports : [])
    .slice(0, 8)
    .map((support) => toString(support, 150))
    .filter(Boolean),
});

async function suggestGoals(payload) {
  const context = formatContext(normalizeGoalPayload(payload));
  if (!context) {
    throw new Error(
      "Add student or PLAAFP information before suggesting goals.",
    );
  }

  const text = await requestGroq({
    systemPrompt: GOAL_SYSTEM_PROMPT,
    userPrompt: `Suggest annual goals using only this teacher-provided context:\n\n${context}`,
    maxTokens: 1800,
  });

  let parsed;
  try {
    const jsonText = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Groq returned an invalid goal format. Please try again.");
  }

  if (!Array.isArray(parsed?.goals)) {
    throw new Error(
      "Groq did not return a valid goals list. Please try again.",
    );
  }

  const goals = parsed.goals
    .slice(0, 3)
    .map(normalizeSuggestion)
    .filter((goal) => goal.annualGoal.behavior && goal.annualGoal.criteria);
  if (!goals.length)
    throw new Error("Groq did not return any goal suggestions.");
  return { goals };
}

const normalizeProgressPayload = (payload = {}) => ({
  studentName: toString(payload.studentName, 200),
  gradeLevel: toString(payload.gradeLevel, 100),
  iepTitle: toString(payload.iepTitle, 300),
  iepPeriod: toString(payload.iepPeriod, 300),
  plaafpDraft: toString(payload.plaafpDraft, MAX_FIELD_LENGTH),
  teacherObservations: toString(payload.teacherObservations, MAX_FIELD_LENGTH),
  goals: (Array.isArray(payload.goals) ? payload.goals : [])
    .slice(0, 12)
    .map((goal) => ({
      id: toString(goal?.id, 150),
      area: toString(goal?.area, 150),
      statement: toString(goal?.statement, 1200),
      status: toString(goal?.status, 100),
      progressPercentage: Number.isFinite(Number(goal?.progressPercentage))
        ? Math.min(Math.max(Number(goal.progressPercentage), 0), 100)
        : null,
      measurementMethod: toString(goal?.measurementMethod, 200),
    })),
  progressSessions: (Array.isArray(payload.progressSessions)
    ? payload.progressSessions
    : []
  )
    .slice(0, 30)
    .map((session) => ({
      goalId: toString(session?.goalId, 150),
      sessionDate: toString(session?.sessionDate, 100),
      score: Number.isFinite(Number(session?.score))
        ? Number(session.score)
        : null,
      total: Number.isFinite(Number(session?.total))
        ? Number(session.total)
        : null,
      notes: toString(session?.notes, 1500),
      teacherObservation: toString(session?.teacherObservation, 1500),
    })),
});

async function summarizeProgress(payload) {
  const context = normalizeProgressPayload(payload);
  if (!context.studentName && !context.iepTitle && !context.goals.length) {
    throw new Error(
      "Choose an IEP with goal information before generating a summary.",
    );
  }

  return requestGroq({
    systemPrompt: PROGRESS_SYSTEM_PROMPT,
    userPrompt: `Write the progress summary using only this teacher-provided JSON context:\n\n${JSON.stringify(context)}`,
    maxTokens: 1000,
  });
}

module.exports = { generatePlaafp, suggestGoals, summarizeProgress };

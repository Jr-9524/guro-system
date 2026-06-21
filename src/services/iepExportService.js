const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const listItems = (items = []) =>
  items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>None documented.</p>";

const field = (label, value) => `
  <div class="field">
    <span class="label">${escapeHtml(label)}</span>
    <span>${escapeHtml(value || "Not set")}</span>
  </div>
`;

const section = (title, body) => `
  <section>
    <h2>${escapeHtml(title)}</h2>
    ${body}
  </section>
`;

const buildIepDocumentHtml = ({
  title,
  data,
  student = {},
  progressSessions = [],
  aiProgressSummary = "",
}) => {
  const studentInfo = data.studentInfo || {};
  const plaaFP = data.plaaFP || {};
  const goals = (data.goals || []).map(normalizeGoal);
  const accommodations = data.accommodations || {};
  const services = data.services || [];
  const progressPlan = data.progressPlan || {};
  const learnerName = [
    student.firstName || studentInfo.firstName,
    student.middleName,
    student.lastName || studentInfo.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const recentProgress = [...progressSessions]
    .sort(
      (a, b) =>
        new Date(b.sessionDate || b.createdAt) -
        new Date(a.sessionDate || a.createdAt),
    )
    .slice(0, 5);
  const preparedBy = progressPlan.responsible || "Not specified";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      color: #111827;
      font-family: Arial, sans-serif;
      line-height: 1.45;
      margin: 32px;
    }
    h1 {
      border-bottom: 2px solid #111827;
      font-size: 24px;
      margin: 0 0 16px;
      padding-bottom: 8px;
    }
    .document-header { text-align: center; }
    .document-header .system { font-size: 11px; font-weight: bold; letter-spacing: .14em; }
    .document-header .school { margin: 3px 0 12px; }
    .document-header .subtitle { color: #4b5563; font-size: 12px; }
    h2 {
      font-size: 17px;
      margin: 24px 0 10px;
    }
    h3 {
      font-size: 14px;
      margin: 12px 0 4px;
    }
    p {
      margin: 6px 0;
    }
    table {
      border-collapse: collapse;
      margin-top: 8px;
      width: 100%;
    }
    th, td {
      border: 1px solid #9ca3af;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f3f4f6;
    }
    ul {
      margin: 6px 0 0 20px;
      padding: 0;
    }
    section {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .grid {
      display: grid;
      gap: 8px 16px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .field {
      border-bottom: 1px solid #e5e7eb;
      padding: 5px 0;
    }
    .label {
      color: #4b5563;
      display: block;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .signatures { display: grid; gap: 28px; grid-template-columns: repeat(3, 1fr); margin-top: 58px; text-align: center; }
    .signature { border-top: 1px solid #111827; padding-top: 5px; }
    .signature small { color: #4b5563; display: block; margin-top: 2px; }
    @media print {
      body { margin: 18mm; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="document-header">
    <div class="system">GURO SYSTEM</div>
    <div class="school">${escapeHtml(studentInfo.school || student.school || "School not specified")}</div>
    <h1>Individualized Education Program</h1>
    <div class="subtitle">${escapeHtml(title)} | Confidential educational document</div>
  </div>
  ${section(
    "Learner Information",
    `<div class="grid">
      ${field("Learner name", learnerName)}
      ${field("Learner Reference Number", student.lrn)}
      ${field("Grade level", studentInfo.gradeLevel || student.gradeLevel)}
      ${field("Section", student.section)}
      ${field("Age", studentInfo.age)}
      ${field("School", studentInfo.school || student.school)}
      ${field("Disability category", studentInfo.disabilityCategory || student.primaryDisabilityCategory)}
      ${field("Disability severity", studentInfo.disabilitySeverity || student.severityLevel)}
      ${field("IEP dates", `${studentInfo.iepStartDate || "Not specified"} to ${studentInfo.iepEndDate || "Not specified"}`)}
    </div>`,
  )}
  ${section(
    "Parent / Guardian Information",
    `<div class="grid">
      ${field("Name", student.guardianName || studentInfo.guardianName)}
      ${field("Relationship", student.guardianRelationship || studentInfo.guardianRelationship)}
      ${field("Contact number", student.guardianContact || studentInfo.guardianContact)}
      ${field("Email", student.guardianEmail || studentInfo.guardianEmail)}
    </div>`,
  )}
  ${section(
    "Present Levels (PLAAFP)",
    `<div class="grid">
      ${field("Reading level", plaaFP.readingLevel)}
      ${field("Math level", plaaFP.mathLevel)}
    </div>
    <h3>Strengths</h3><p>${escapeHtml(plaaFP.strengths || "Not documented.")}</p>
    <h3>Challenges / Areas of Need</h3><p>${escapeHtml(plaaFP.challenges || "Not documented.")}</p>
    <h3>Impact on Classroom Participation</h3><p>${escapeHtml(plaaFP.impact || "Not documented.")}</p>
    <h3>Draft PLAAFP</h3><p>${escapeHtml(plaaFP.aiDraft || "Not documented.")}</p>`,
  )}
  ${section(
    "Annual Goals",
    goals.length
      ? goals
          .map(
            (goal, index) => `
              <h3>Goal ${index + 1}: ${escapeHtml(goal.area || "Goal")}</h3>
              <p>${escapeHtml(getGoalStatement(goal))}</p>
              <h4>Current Performance</h4>
              <p>${escapeHtml(goal.currentPerformance || "Not documented.")}</p>
              <p><strong>Need:</strong> ${escapeHtml(goal.need || "Not documented.")}</p>
              <p><strong>Baseline:</strong> ${escapeHtml(goal.baselineValue || "Not set")} (${escapeHtml(goal.baselineMethod || "method not set")})</p>
              <table>
                <tr>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Frequency</th>
                  <th>Measurement</th>
                </tr>
                <tr>
                  <td>${escapeHtml(goal.status)}</td>
                  <td>${escapeHtml(`${goal.progressPercentage}%`)}</td>
                  <td>${escapeHtml(goal.measurementFrequency || "Not set")}</td>
                  <td>${escapeHtml(goal.measurementMethod || "Not set")}</td>
                </tr>
              </table>
              <p><strong>Progress reporting:</strong> ${escapeHtml(goal.progressReportingSchedule || "Not set")}</p>
              <h4>Short-Term Objectives</h4>
              ${listItems(
                goal.objectives.map(
                  (objective) =>
                    `${objective.description || "Untitled objective"} - ${objective.criteria || "criteria not set"} (${objective.status})`,
                ),
              )}
              <h4>Supports / Accommodations</h4>
              ${listItems(goal.supports)}`,
          )
          .join("")
      : "<p>No goals documented.</p>",
  )}
  ${section(
    "Accommodations & Modifications",
    `<h3>Presentation</h3>
    ${listItems(accommodations.presentation)}
    <h3>Time and Environment</h3>
    ${listItems(accommodations.timeEnvironment)}
    <h3>Response</h3>
    ${listItems(accommodations.response)}`,
  )}
  ${section(
    "Special Education Services",
    services.length
      ? `<table>
          <tr>
            <th>Service</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Setting</th>
            <th>Provider</th>
          </tr>
          ${services
            .map(
              (service) => `
                <tr>
                  <td>${escapeHtml(service.name || "Service")}</td>
                  <td>${escapeHtml(service.frequency || "Not set")}</td>
                  <td>${escapeHtml(service.duration || "Not set")}</td>
                  <td>${escapeHtml(service.setting || "Not set")}</td>
                  <td>${escapeHtml(service.provider || "Not set")}</td>
                </tr>`,
            )
            .join("")}
        </table>`
      : "<p>No services documented.</p>",
  )}
  ${section(
    "Progress Monitoring Plan",
    `<div class="grid">
      ${field("Data collection method", progressPlan.dataMethod)}
      ${field("Collection frequency", progressPlan.frequency)}
      ${field("Parent report schedule", progressPlan.parentReport)}
      ${field("Person responsible", progressPlan.responsible)}
    </div>
    <h3>Additional Notes</h3><p>${escapeHtml(progressPlan.notes || "None documented.")}</p>`,
  )}
  ${section(
    "Recent Progress Notes",
    recentProgress.length
      ? recentProgress
          .map((note) => {
            const goal = goals.find(
              (item) => String(item.id) === String(note.goalId),
            );
            const score = Number(note.total) > 0
              ? ` | Score: ${note.score}/${note.total}`
              : "";
            return `<h3>${escapeHtml(note.sessionDate || note.createdAt || "Date not specified")} - ${escapeHtml(goal?.area || "Goal")}</h3>
              <p>${escapeHtml(note.notes || "No note provided")}${escapeHtml(score)}</p>`;
          })
          .join("")
      : "<p>No progress notes provided.</p>",
  )}
  ${aiProgressSummary
    ? section(
        "Teacher-Reviewed Progress Summary",
        `<p>${escapeHtml(aiProgressSummary)}</p>`,
      )
    : ""}
  ${section(
    "Document Preparation and Signatures",
    `<div class="grid">
      ${field("Prepared by", preparedBy)}
      ${field("Date generated", new Date().toLocaleDateString())}
    </div>
    <div class="signatures">
      <div class="signature">${escapeHtml(preparedBy)}<small>Teacher / Case Manager</small></div>
      <div class="signature">${escapeHtml(student.guardianName || studentInfo.guardianName || "Parent / Guardian")}<small>Parent / Guardian</small></div>
      <div class="signature">School / IEP Coordinator<small>Signature over printed name / Date</small></div>
    </div>`,
  )}
</body>
</html>`;
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const makeFileSafe = (value) =>
  String(value || "iep-document")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export const printIepDocument = ({ title, data, student, progressSessions, aiProgressSummary }) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return false;

  printWindow.document.write(
    buildIepDocumentHtml({ title, data, student, progressSessions, aiProgressSummary }),
  );
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
};

export const downloadIepWordDocument = ({
  title,
  data,
  student,
  progressSessions,
  aiProgressSummary,
}) => {
  downloadBlob(
    buildIepDocumentHtml({ title, data, student, progressSessions, aiProgressSummary }),
    `${makeFileSafe(title)}.doc`,
    "application/msword;charset=utf-8",
  );
};
import { getGoalStatement, normalizeGoal } from "../utils/goalUtils";

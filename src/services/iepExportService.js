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

const buildIepDocumentHtml = ({ title, data }) => {
  const student = data.studentInfo || {};
  const plaaFP = data.plaaFP || {};
  const goals = data.goals || [];
  const accommodations = data.accommodations || {};
  const services = data.services || [];
  const progressPlan = data.progressPlan || {};

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
    @media print {
      body { margin: 18mm; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${section(
    "Student Information",
    `<div class="grid">
      ${field("First name", student.firstName)}
      ${field("Last name", student.lastName)}
      ${field("Grade level", student.gradeLevel)}
      ${field("Age", student.age)}
      ${field("School", student.school)}
      ${field("Disability category", student.disabilityCategory)}
      ${field("Disability severity", student.disabilitySeverity)}
      ${field("IEP dates", `${student.iepStartDate || "Not set"} to ${student.iepEndDate || "Not set"}`)}
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
              <p>${escapeHtml(goal.description || "No goal description.")}</p>
              <table>
                <tr>
                  <th>Target date</th>
                  <th>Criteria</th>
                  <th>Sessions</th>
                  <th>Measurement</th>
                </tr>
                <tr>
                  <td>${escapeHtml(goal.date || "Not set")}</td>
                  <td>${escapeHtml(goal.accuracy || "Not set")}</td>
                  <td>${escapeHtml(goal.sessions || "Not set")}</td>
                  <td>${escapeHtml(goal.measurement || "Not set")}</td>
                </tr>
              </table>`,
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

export const printIepDocument = ({ title, data }) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return false;

  printWindow.document.write(buildIepDocumentHtml({ title, data }));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
};

export const downloadIepWordDocument = ({ title, data }) => {
  downloadBlob(
    buildIepDocumentHtml({ title, data }),
    `${makeFileSafe(title)}.doc`,
    "application/msword;charset=utf-8",
  );
};

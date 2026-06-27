import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FormalIepReport from "../components/reports/FormalIepReport";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const WORD_COMPATIBILITY_STYLES = `
  :root {
    --color-base-100: #ffffff;
    --color-base-200: #f3f4f6;
    --color-base-300: #9ca3af;
    --color-base-content: #111827;
  }
  html, body { background: #ffffff; color: #111827; margin: 0; }
  body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 14mm 16mm;
  }
  .report-screen-only { display: none !important; }
  .iep-report-document {
    --iep-report-border: #6b7280;
    border: 0;
    box-shadow: none;
    margin: 0 auto;
    max-width: 210mm;
    padding: 0;
    width: 100%;
  }
  .export-grid-table,
  .export-meta-table,
  .export-signatures-table {
    border-collapse: collapse;
    display: table !important;
    table-layout: fixed;
    width: 100%;
  }
  .export-grid-table tr,
  .export-meta-table tr,
  .export-signatures-table tr { display: table-row !important; }
  .export-grid-table .iep-report-field {
    display: table-cell !important;
    height: 42px;
    vertical-align: top;
  }
  .export-meta-table td {
    border: 1px solid #6b7280;
    padding: 7px 9px;
    text-align: left;
    vertical-align: top;
  }
  .export-meta-table strong {
    color: #4b5563;
    display: block;
    font-size: 9px;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  .export-columns-table td {
    border: 1px solid #6b7280;
    padding: 9px;
    vertical-align: top;
  }
  .export-signatures-table {
    border-collapse: separate;
    border-spacing: 18px 0;
    margin-top: 58px;
    text-align: center;
  }
  .export-signatures-table td {
    border: 0;
    padding: 0;
    vertical-align: bottom;
    width: 33.333%;
  }
  .export-signatures-table span {
    display: block;
    min-height: 36px;
  }
  .export-signatures-table i {
    border-top: 1px solid #111827;
    display: block;
  }
  .export-signatures-table strong,
  .export-signatures-table small {
    display: block;
    margin-top: 4px;
  }
  @page { size: A4; margin: 14mm 16mm; }
`;

const buildIepRecord = ({ title, data, iep }) => {
  if (iep?.data) return iep;
  return {
    ...(data?.id ? data : {}),
    title: title || data?.title || "IEP Document",
    data: data?.data || data || {},
    status: data?.status || "draft",
    createdAt: data?.createdAt,
    lastModified: data?.lastModified,
    completedSections: data?.completedSections || [],
  };
};

const collectFormalReportStyles = () => {
  const collected = [];

  const collectRules = (rules, wrapper = null) => {
    const matches = [];
    Array.from(rules || []).forEach((rule) => {
      if (rule.cssRules) {
        const nested = collectRules(rule.cssRules, rule.conditionText || null);
        if (nested) matches.push(nested);
        return;
      }
      const text = rule.cssText || "";
      if (
        rule.selectorText?.includes("iep-report") ||
        rule.selectorText?.includes("report-screen-only") ||
        text.startsWith("@page")
      ) {
        matches.push(text);
      }
    });
    if (!matches.length) return "";
    const css = matches.join("\n");
    return wrapper ? `@media ${wrapper} {\n${css}\n}` : css;
  };

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      const css = collectRules(sheet.cssRules);
      if (css) collected.push(css);
    } catch {
      // Ignore stylesheets that the browser does not allow CSSOM access to.
    }
  });
  return collected.join("\n");
};

const replaceGridWithTable = (grid, columns) => {
  const table = document.createElement("table");
  table.className = `${grid.className} export-grid-table`;
  const body = table.createTBody();
  let row = null;
  let usedColumns = 0;

  Array.from(grid.children).forEach((field) => {
    const wide = field.classList.contains("iep-report-field-wide");
    if (!row || wide || usedColumns >= columns) {
      row = body.insertRow();
      usedColumns = 0;
    }
    const cell = row.insertCell();
    cell.className = field.className;
    if (wide) cell.colSpan = columns;
    while (field.firstChild) cell.appendChild(field.firstChild);
    usedColumns += wide ? columns : 1;
  });
  grid.replaceWith(table);
};

const replaceItemsWithTable = (container, columns, className) => {
  const table = document.createElement("table");
  table.className = className;
  const body = table.createTBody();
  let row;

  Array.from(container.children).forEach((item, index) => {
    if (index % columns === 0) row = body.insertRow();
    const cell = row.insertCell();
    while (item.firstChild) cell.appendChild(item.firstChild);
  });
  container.replaceWith(table);
};

const makeWordCompatible = (markup) => {
  const parsed = new DOMParser().parseFromString(markup, "text/html");
  parsed.querySelectorAll(".report-screen-only").forEach((node) => node.remove());
  parsed.querySelectorAll(".iep-report-grid").forEach((grid) =>
    replaceGridWithTable(
      grid,
      grid.classList.contains("iep-report-grid-three") ? 3 : 2,
    ),
  );
  parsed.querySelectorAll(".iep-report-meta").forEach((meta) =>
    replaceItemsWithTable(meta, 3, "iep-report-meta export-meta-table"),
  );
  parsed.querySelectorAll(".iep-report-columns").forEach((columns) =>
    replaceItemsWithTable(
      columns,
      3,
      "iep-report-columns export-grid-table export-columns-table",
    ),
  );
  parsed.querySelectorAll(".iep-report-signatures").forEach((signatures) =>
    replaceItemsWithTable(
      signatures,
      3,
      "iep-report-signatures export-signatures-table",
    ),
  );
  return parsed.body.innerHTML;
};

const buildFormalDocumentHtml = ({
  title,
  data,
  iep,
  student = {},
  progressSessions = [],
  aiProgressSummary = "",
}) => {
  const record = buildIepRecord({ title, data, iep });
  const markup = renderToStaticMarkup(
    React.createElement(FormalIepReport, {
      iep: record,
      student,
      progressSessions,
      aiProgressSummary,
    }),
  );
  const reportStyles = collectFormalReportStyles();

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title || record.title || "IEP Document")}</title>
    <style>${reportStyles}\n${WORD_COMPATIBILITY_STYLES}</style>
  </head>
  <body>${makeWordCompatible(markup)}</body>
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

export const printIepDocument = (options) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return false;
  printWindow.document.write(buildFormalDocumentHtml(options));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
};

export const downloadIepWordDocument = (options) => {
  const title = options.title || options.iep?.title || "IEP Document";
  downloadBlob(
    buildFormalDocumentHtml(options),
    `${makeFileSafe(title)}.doc`,
    "application/msword;charset=utf-8",
  );
};

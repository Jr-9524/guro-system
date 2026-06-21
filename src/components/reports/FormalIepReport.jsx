import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import { getGoalStatement, normalizeGoal } from "../../utils/goalUtils";
import { getIepStudentName } from "../../utils/studentUtils";
import { getCompletionPercent } from "../../utils/iepUtils";

const missing = "Not specified";
const valueOrMissing = (value) =>
  value === undefined || value === null || String(value).trim() === ""
    ? missing
    : value;

const formatOptionalDate = (value) =>
  value ? formatDate(value) : missing;

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") {
    return Object.values(value).flat().filter(Boolean);
  }
  return value ? [value] : [];
};

const ReportSection = ({ number, title, children, breakBefore = false }) => (
  <section
    className={`iep-report-section ${breakBefore ? "iep-report-page-break" : ""}`}
  >
    <h2>
      <span>{number}</span>
      {title}
    </h2>
    {children}
  </section>
);

const ReportField = ({ label, value, wide = false }) => (
  <div className={`iep-report-field ${wide ? "sm:col-span-2" : ""}`}>
    <dt>{label}</dt>
    <dd>{valueOrMissing(value)}</dd>
  </div>
);

const ReportList = ({ items, empty = "No data provided" }) =>
  items?.length ? (
    <ul className="iep-report-list">
      {items.map((item, index) => (
        <li key={`${String(item)}-${index}`}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className="iep-report-missing">{empty}</p>
  );

const FormalIepReport = ({ iep, student, progressSessions = [], aiProgressSummary = "" }) => {
  const [visibleNoteCount, setVisibleNoteCount] = useState(5);
  const data = iep?.data || {};
  const info = data.studentInfo || {};
  const plaafp = data.plaaFP || data.plaafp || {};
  const accommodations = data.accommodations || {};
  const services = Array.isArray(data.services) ? data.services : [];
  const progressPlan = data.progressPlan || {};
  const goals = (Array.isArray(data.goals) ? data.goals : []).map(normalizeGoal);
  const notes = [...progressSessions].sort(
    (a, b) => new Date(b.sessionDate || b.createdAt) - new Date(a.sessionDate || a.createdAt),
  );
  const learnerName = getIepStudentName(iep) ||
    [student?.firstName, student?.middleName, student?.lastName]
      .filter(Boolean)
      .join(" ") ||
    missing;
  const preparedBy =
    progressPlan.responsible || data.preparedBy || iep?.createdBy || missing;
  const disability =
    info.disabilityCategory || student?.primaryDisabilityCategory;
  const severity = info.disabilitySeverity || student?.severityLevel;

  return (
    <article className="iep-report-document" aria-label="Individualized Education Program">
      <header className="iep-report-header">
        <p className="iep-report-system">GURO SYSTEM</p>
        <p className="iep-report-school">
          {valueOrMissing(info.school || student?.school)}
        </p>
        <h1>Individualized Education Program</h1>
        <p>{valueOrMissing(iep?.title)}</p>
        <div className="iep-report-meta">
          <span><strong>Student</strong>{learnerName}</span>
          <span><strong>Status</strong>{valueOrMissing(iep?.status)}</span>
          <span><strong>Completion</strong>{getCompletionPercent(iep)}%</span>
          <span><strong>Created</strong>{formatOptionalDate(iep?.createdAt)}</span>
          <span><strong>Last modified</strong>{formatOptionalDate(iep?.lastModified)}</span>
          <span><strong>IEP period</strong>{formatOptionalDate(info.iepStartDate)} to {formatOptionalDate(info.iepEndDate)}</span>
        </div>
        <small>Confidential educational document</small>
      </header>

      <ReportSection number="I" title="Learner Information">
        <dl className="iep-report-grid">
          <ReportField label="Learner name" value={learnerName} />
          <ReportField label="Learner Reference Number" value={student?.lrn} />
          <ReportField label="Grade level" value={info.gradeLevel || student?.gradeLevel} />
          <ReportField label="Section" value={student?.section} />
          <ReportField label="Age" value={info.age} />
          <ReportField label="Communication mode" value={info.communicationMode || student?.communicationMode} />
          <ReportField label="Disability category" value={disability} />
          <ReportField label="Learning needs" value={info.learningNeeds || data.learningNeeds} />
          <ReportField label="Support intensity" value={info.supportIntensity || severity} />
          <ReportField label="Developmental level" value={info.developmentalLevel} />
          <ReportField label="Primary area of focus" value={info.primaryAreaOfFocus} />
          <ReportField label="IEP period" value={formatOptionalDate(info.iepStartDate) + " to " + formatOptionalDate(info.iepEndDate)} wide />
        </dl>
      </ReportSection>

      <ReportSection number="II" title="Parent / Guardian Information">
        <dl className="iep-report-grid">
          <ReportField label="Name" value={student?.guardianName || info.guardianName} />
          <ReportField label="Relationship" value={student?.guardianRelationship || info.guardianRelationship} />
          <ReportField label="Contact number" value={student?.guardianContact || info.guardianContact} />
          <ReportField label="Email" value={student?.guardianEmail || info.guardianEmail} />
        </dl>
      </ReportSection>

      <ReportSection number="III" title="Present Level of Academic and Functional Performance">
        <dl className="iep-report-grid">
          <ReportField label="Reading level" value={plaafp.readingLevel} />
          <ReportField label="Mathematics level" value={plaafp.mathLevel} />
        </dl>
        <ReportNarrative label="Strengths" value={plaafp.strengths} />
        <ReportNarrative label="Needs" value={plaafp.challenges || plaafp.needs} />
        <ReportNarrative label="Assessment results" value={plaafp.assessmentResults} />
        <ReportNarrative label="Teacher observations" value={plaafp.teacherObservations} />
        <ReportNarrative label="Classroom impact" value={plaafp.impact} />
        <ReportNarrative label="PLAAFP statement" value={plaafp.aiDraft || plaafp.statement} />
      </ReportSection>

      <ReportSection number="IV" title="Annual Goals and Short-Term Objectives" breakBefore>
        {goals.length ? goals.map((goal, index) => (
          <div className="iep-report-goal" key={goal.id || index}>
            <div className="iep-report-goal-heading">
              <h3>Goal {index + 1}: {goal.area || "Area not specified"}</h3>
              <span>{goal.status} / {goal.progressPercentage}%</span>
            </div>
            <p className="iep-report-goal-statement">{getGoalStatement(goal)}</p>
            <dl className="iep-report-grid">
              <ReportField label="Current performance" value={goal.currentPerformance} />
              <ReportField label="Identified need" value={goal.need} />
              <ReportField label="Baseline" value={goal.baselineValue} />
              <ReportField label="Baseline method" value={goal.baselineMethod} />
              <ReportField label="Success criteria" value={goal.annualGoal?.criteria} />
              <ReportField label="Measurement" value={goal.measurementMethod} />
              <ReportField label="Frequency" value={goal.measurementFrequency} />
              <ReportField label="Reporting schedule" value={goal.progressReportingSchedule} />
            </dl>
            <h4>Short-Term Objectives</h4>
            <ReportList
              items={goal.objectives.map((objective) =>
                `${objective.description || "Objective not specified"}${objective.criteria ? ` - ${objective.criteria}` : ""} (${objective.status})`,
              )}
            />
            <h4>Suggested Supports</h4>
            <ReportList items={goal.supports} />
          </div>
        )) : <p className="iep-report-missing">No goals provided</p>}
      </ReportSection>

      <ReportSection number="V" title="Accommodations and Modifications">
        <ReportColumns
          groups={[
            ["Presentation", toList(accommodations.presentation)],
            ["Time and Environment", toList(accommodations.timeEnvironment)],
            ["Response", toList(accommodations.response)],
            ["Behavior", toList(accommodations.behavior)],
            ["Other Supports", [
              ...toList(accommodations.other),
              ...toList(data.modifications),
            ]],
          ]}
        />
      </ReportSection>

      <ReportSection number="VI" title="Services and Supports">
        {services.length ? (
          <div className="overflow-x-auto">
            <table className="iep-report-table">
              <thead><tr><th>Service</th><th>Frequency</th><th>Duration</th><th>Setting</th><th>Provider</th><th>Notes</th></tr></thead>
              <tbody>{services.map((service, index) => (
                <tr key={service.id || index}>
                  <td>{valueOrMissing(service.name)}</td>
                  <td>{valueOrMissing(service.frequency)}</td>
                  <td>{valueOrMissing(service.duration)}</td>
                  <td>{valueOrMissing(service.setting || service.location)}</td>
                  <td>{valueOrMissing(service.provider)}</td>
                  <td>{valueOrMissing(service.notes)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="iep-report-missing">No services provided</p>}
        <h3 className="iep-report-subheading">Goal-Specific Supports</h3>
        <ReportList items={[...new Set(goals.flatMap((goal) => goal.supports || []))]} />
      </ReportSection>

      <ReportSection number="VII" title="Progress Monitoring Plan">
        <dl className="iep-report-grid">
          <ReportField label="Data collection method" value={progressPlan.dataMethod} />
          <ReportField label="Collection frequency" value={progressPlan.frequency} />
          <ReportField label="Reporting schedule" value={progressPlan.parentReport} />
          <ReportField label="Person responsible" value={progressPlan.responsible} />
        </dl>
        <ReportNarrative label="Additional monitoring notes" value={progressPlan.notes} />
      </ReportSection>

      <ReportSection number="VIII" title="Recent Progress Notes">
        {notes.length ? (
          <div className="iep-report-notes">
            {notes.slice(0, visibleNoteCount).map((note) => {
              const goal = goals.find((item) => String(item.id) === String(note.goalId));
              return (
                <div key={note.id}>
                  <div><strong>{formatDate(note.sessionDate || note.createdAt)}</strong><span>{goal?.area || "Goal"}</span></div>
                  <p>{valueOrMissing(note.notes)}</p>
                  {(note.total > 0) && <small>Recorded score: {note.score}/{note.total} ({Math.round((note.score / note.total) * 100)}%)</small>}
                </div>
              );
            })}
          </div>
        ) : <p className="iep-report-missing">No progress notes have been recorded yet.</p>}
        {visibleNoteCount < notes.length && (
          <button type="button" className="report-screen-only btn btn-ghost btn-sm mt-3" onClick={() => setVisibleNoteCount((count) => count + 5)}>
            <ChevronDown className="h-4 w-4" /> Show more notes
          </button>
        )}
      </ReportSection>

      {aiProgressSummary && (
        <ReportSection number="IX" title="Teacher-Reviewed Progress Summary">
          <div className="iep-report-narrative">
            <p>{aiProgressSummary}</p>
          </div>
        </ReportSection>
      )}

      <ReportSection number={aiProgressSummary ? "X" : "IX"} title="Document Preparation and Signatures" breakBefore>
        <dl className="iep-report-grid">
          <ReportField label="Prepared by" value={preparedBy} />
          <ReportField label="Review date" value={formatOptionalDate(info.iepEndDate || data.reviewDate)} />
          <ReportField label="Date generated" value={formatDate(new Date().toISOString())} />
        </dl>
        <div className="iep-report-signatures">
          {[
            ["Teacher / Case Manager", preparedBy],
            ["Parent / Guardian", student?.guardianName || info.guardianName],
            ["School / IEP Coordinator", ""],
          ].map(([role, name]) => (
            <div key={role}><span>{valueOrMissing(name)}</span><i /><strong>{role}</strong><small>Signature over printed name / Date</small></div>
          ))}
        </div>
      </ReportSection>

      <footer className="iep-report-footer">
        Generated by GURO System. Review all information before finalizing this document.
      </footer>
    </article>
  );
};

const ReportNarrative = ({ label, value }) => (
  <div className="iep-report-narrative"><h3>{label}</h3><p>{valueOrMissing(value)}</p></div>
);

const ReportColumns = ({ groups }) => (
  <div className="iep-report-columns">
    {groups.map(([label, items]) => <div key={label}><h3>{label}</h3><ReportList items={items} /></div>)}
  </div>
);

export default FormalIepReport;

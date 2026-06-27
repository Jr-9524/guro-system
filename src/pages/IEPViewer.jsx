import { useEffect, useState } from "react";
import { ArrowLeft, FileBarChart, Pencil, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../components/common/Button";
import ActionMenu from "../components/common/ActionMenu";
import IconButton from "../components/common/IconButton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import FormalIepReport from "../components/reports/FormalIepReport";
import iepService from "../services/iepService";
import progressService from "../services/progressService";
import studentService from "../services/studentService";

const IEPViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [iep, setIep] = useState(null);
  const [student, setStudent] = useState(null);
  const [progressSessions, setProgressSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadViewer = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const record = await iepService.getById(id);
        if (!record) {
          if (isCurrent) setIep(null);
          return;
        }

        const [sessions, students] = await Promise.all([
          progressService.getByIEP(record.id).catch(() => []),
          studentService.getAll().catch(() => []),
        ]);

        if (!isCurrent) return;
        setIep(record);
        setProgressSessions(sessions);
        setStudent(
          students.find(
            (item) => String(item.id) === String(record.studentId),
          ) || null,
        );
      } catch (error) {
        if (isCurrent) {
          setLoadError(error.message || "This IEP could not be loaded.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadViewer();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!iep || loadError) {
    return (
      <section className="mx-auto flex min-h-[28rem] max-w-2xl flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
        <h1 className="text-xl font-bold">IEP not found</h1>
        <p className="mt-2 text-sm text-base-content/60">
          {loadError ||
            "This IEP may have been archived, deleted, or is no longer available."}
        </p>
        <Button
          className="mt-5"
          icon={ArrowLeft}
          onClick={() => navigate("/iep/active")}
        >
          Back to IEPs
        </Button>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[220mm] space-y-5">
      <div className="report-screen-only sticky top-3 z-20 flex flex-col gap-3 rounded-sm border-2 border-base-content/25 bg-base-100/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Read-only IEP preview</p>
          <p className="text-xs text-base-content/60">
            Review, print, or edit this IEP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <IconButton
            icon={ArrowLeft}
            label="Back"
            onClick={() => navigate(-1)}
          />
          <ActionMenu
            label="IEP document options"
            items={[
              {
                id: "edit",
                label: "Edit IEP",
                icon: Pencil,
                to: "/iep/" + iep.id + "/edit",
              },
              {
                id: "report",
                label: "Export / Report",
                icon: FileBarChart,
                to: "/reports/iep/" + iep.id,
              },
              {
                id: "print",
                label: "Print",
                icon: Printer,
                onClick: () => window.print(),
              },
            ]}
          />
        </div>
      </div>

      <FormalIepReport
        iep={iep}
        student={student}
        progressSessions={progressSessions}
      />
    </div>
  );
};

export default IEPViewer;

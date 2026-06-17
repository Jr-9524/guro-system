// Active, Draft, Archive

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, FileText, Plus, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import SearchInput from "../components/common/SearchInput";
import iepService from "../services/iepService";
import { formatDate } from "../utils/dateUtils";
import { getStudentName } from "../utils/studentUtils";

const viewConfig = {
  active: {
    title: "Active IEPs",
    description: "Completed IEP documents ready for use.",
    status: "complete",
    empty: "No active IEPs yet",
  },
  drafts: {
    title: "Draft IEPs",
    description: "IEPs still being written.",
    status: "draft",
    empty: "No draft IEPs yet",
  },
  archive: {
    title: "Archived IEPs",
    description: "Older IEP records kept for reference.",
    status: "archived",
    empty: "No archived IEPs yet",
  },
};

const IEPList = ({ view = "drafts" }) => {
  const navigate = useNavigate();
  const config = viewConfig[view] || viewConfig.drafts;
  const [ieps, setIeps] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyIepId, setBusyIepId] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    const loadIeps = async () => {
      setIsLoading(true);
      try {
        const records = await iepService.getAll({ status: config.status });
        if (isCurrent) setIeps(records);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadIeps();

    return () => {
      isCurrent = false;
    };
  }, [config.status]);

  const filteredIeps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return ieps;

    return ieps.filter((iep) => {
      const studentName = getStudentName(iep).toLowerCase();
      return (
        iep.title.toLowerCase().includes(normalizedQuery) ||
        studentName.includes(normalizedQuery)
      );
    });
  }, [ieps, query]);

  const removeIepFromList = (id) => {
    setIeps((currentIeps) => currentIeps.filter((iep) => iep.id !== id));
  };

  const handleArchive = async (iep) => {
    setBusyIepId(iep.id);
    try {
      const archivedIep = await iepService.archive(iep.id);
      if (!archivedIep) {
        toast.error("IEP could not be found.");
        return;
      }

      removeIepFromList(iep.id);
      toast.success("IEP moved to Archive.");
    } catch (error) {
      console.error(error);
      toast.error("Could not archive this IEP.");
    } finally {
      setBusyIepId(null);
    }
  };

  const handleRestore = async (iep) => {
    setBusyIepId(iep.id);
    try {
      const restoredIep = await iepService.restore(iep.id);
      if (!restoredIep) {
        toast.error("IEP could not be found.");
        return;
      }

      removeIepFromList(iep.id);
      toast.success(
        restoredIep.status === "complete"
          ? "IEP restored to Active IEPs."
          : "IEP restored to Drafts.",
      );
    } catch (error) {
      console.error(error);
      toast.error("Could not restore this IEP.");
    } finally {
      setBusyIepId(null);
    }
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-base-content/60">{config.description}</p>
        </div>
        <Button onClick={() => navigate("/iep/new")} icon={Plus}>
          New IEP
        </Button>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search IEPs..."
      />

      <section className="overflow-hidden rounded-lg border border-gray-300 bg-base-100">
        {isLoading ? (
          <div className="flex min-h-[16rem] items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredIeps.length > 0 ? (
          <div className="divide-y divide-gray-300">
            {filteredIeps.map((iep) => (
              <div
                key={iep.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-base-200 md:flex-row md:items-center md:justify-between"
              >
                <Link
                  to={`/iep/${iep.id}/edit`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{iep.title}</p>
                    <p className="truncate text-sm text-base-content/60">
                      {getStudentName(iep) || "No student name"} - Modified{" "}
                      {formatDate(iep.lastModified)}
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                  <span className="badge badge-outline">
                    {iep.completedSections.length}/6 sections
                  </span>
                  {view === "archive" ? (
                    <Button
                      type="button"
                      icon={RotateCcw}
                      className="btn-outline btn-sm"
                      disabled={busyIepId === iep.id}
                      onClick={() => handleRestore(iep)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      icon={Archive}
                      className="btn-outline btn-sm"
                      disabled={busyIepId === iep.id}
                      onClick={() => handleArchive(iep)}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 p-8 text-center">
            <FileText className="h-9 w-9 opacity-50" />
            <div>
              <p className="font-semibold">{config.empty}</p>
              <p className="mt-1 text-sm text-base-content/60">
                Create or save an IEP to see it here.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default IEPList;

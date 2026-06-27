// Active, Draft, Archive

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, Eye, FileText, Pencil, Plus, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import ActionMenu from "../components/common/ActionMenu";
import SearchInput from "../components/common/SearchInput";
import IepTabs from "../components/common/IepTabs";
import Pagination from "../components/common/Pagination";
import PageHeader from "../components/common/PageHeader";
import usePagination from "../hooks/usePagination";
import iepService from "../services/iepService";
import { formatDate } from "../utils/dateUtils";
import { getIepStudentName } from "../utils/studentUtils";

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
      const studentName = getIepStudentName(iep).toLowerCase();
      return (
        iep.title.toLowerCase().includes(normalizedQuery) ||
        studentName.includes(normalizedQuery)
      );
    });
  }, [ieps, query]);
  const pagination = usePagination(filteredIeps, 10);

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
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button onClick={() => navigate("/iep/new")} icon={Plus}>
            New IEP
          </Button>
        }
      />

      <IepTabs activeId={view} />

      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          pagination.goToPage(1);
        }}
        placeholder="Search IEPs..."
      />

      <section className="rounded-md border border-base-300 bg-base-100 overflow-hidden">
        {isLoading ? (
          <div className="flex min-h-[16rem] items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredIeps.length > 0 ? (
          <div className="divide-y divide-gray-300">
            {pagination.currentItems.map((iep) => (
              <div
                key={iep.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-base-200 md:flex-row md:items-center md:justify-between"
              >
                <Link
                  to={`/iep/${iep.id}/view`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-base-content">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{iep.title}</p>
                    <p className="truncate text-sm text-base-content/60">
                      {getIepStudentName(iep) || "No student name"} - Modified{" "}
                      {formatDate(iep.lastModified)}
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                  <span className="badge badge-outline">
                    {iep.completedSections.length}/6 sections
                  </span>
                  <ActionMenu
                    label={`Actions for ${iep.title}`}
                    items={[
                      {
                        id: "view",
                        label: "View IEP",
                        icon: Eye,
                        to: `/iep/${iep.id}/view`,
                      },
                      {
                        id: "edit",
                        label: "Edit IEP",
                        icon: Pencil,
                        to: `/iep/${iep.id}/edit`,
                      },
                      view === "archive"
                        ? {
                            id: "restore",
                            label: "Restore IEP",
                            icon: RotateCcw,
                            disabled: busyIepId === iep.id,
                            onClick: () => handleRestore(iep),
                          }
                        : {
                            id: "archive",
                            label: "Archive IEP",
                            icon: Archive,
                            disabled: busyIepId === iep.id,
                            onClick: () => handleArchive(iep),
                          },
                    ]}
                  />
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
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={filteredIeps.length}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
          pageSizeOptions={[10, 15, 25]}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="IEPs"
        />
      </section>
    </div>
  );
};

export default IEPList;

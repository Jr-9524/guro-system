import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Archive,
  Database,
  Download,
  FileText,
  RotateCcw,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import Stat from "../components/common/Stat";
import auditService from "../services/auditService";
import Button from "../components/common/Button";
import SearchInput from "../components/common/SearchInput";
import Pagination from "../components/common/Pagination";
import PageHeader from "../components/common/PageHeader";
import usePagination from "../hooks/usePagination";
import useAuthStore from "../stores/authStore";
import { isAdmin } from "../utils/permissions";

const filters = [
  { value: "all", label: "All" },
  { value: "student", label: "Students" },
  { value: "iep", label: "IEPs" },
  { value: "progress", label: "Progress" },
  { value: "data", label: "Data" },
];

const iconByType = {
  student: UserRound,
  iep: FileText,
  progress: Activity,
  data: Database,
};

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const ActivityLog = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    let isCurrent = true;

    auditService.getAll().then((activityItems) => {
      if (isCurrent) setItems(activityItems);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.type === activeFilter;
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.description, item.entity, item.entityId]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, items, query]);

  const counts = useMemo(
    () =>
      filters.reduce((totals, filter) => {
        totals[filter.value] =
          filter.value === "all"
            ? items.length
            : items.filter((item) => item.type === filter.value).length;
        return totals;
      }, {}),
    [items],
  );
  const pagination = usePagination(filteredItems, 15);

  const clearActivity = async () => {
    await auditService.clear();
    setItems([]);
    toast.success("Activity log cleared");
  };

  const exportActivity = async () => {
    if (!items.length) {
      toast.error("No activity to export.");
      return;
    }

    await auditService.export();
    toast.success("Activity log exported");
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <PageHeader
        title="Activity Log"
        description="Review recent student, IEP, progress, and data-management activity."
        actions={
          <>
            <Button variant="secondary" onClick={exportActivity} icon={Download}>
              Export
            </Button>
            {isAdmin(user) && (
              <Button variant="danger" onClick={clearActivity} icon={Trash2}>
                Clear Activity
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total" value={items.length} icon={Activity} />
        <Stat label="Students" value={counts.student || 0} icon={Users} />
        <Stat label="IEPs" value={counts.iep || 0} icon={FileText} />
        <Stat label="Data" value={counts.data || 0} icon={Database} />
      </div>

      <section className="rounded-lg border border-gray-300 bg-base-100 p-4">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            pagination.goToPage(1);
          }}
          placeholder="Search activity..."
          autoFocus
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              className={`btn btn-sm px-3 py-2 ${
                activeFilter === filter.value
                  ? "btn-active bg-gray-100"
                  : "btn-outline"
              }`}
              onClick={() => {
                setActiveFilter(filter.value);
                pagination.goToPage(1);
              }}
            >
              {filter.label}
              <span>{counts[filter.value] || 0}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-300 bg-base-100">
        {filteredItems.length ? (
          <div className="divide-y divide-gray-300">
            {pagination.currentItems.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 p-8 text-center">
            <RotateCcw className="h-9 w-9 opacity-50" />
            <div>
              <p className="font-semibold">No activity found</p>
              <p className="mt-1 text-sm text-base-content/60">
                Activity appears here after records are created, updated, or
                restored.
              </p>
            </div>
          </div>
        )}
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={filteredItems.length}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
          pageSizeOptions={[15, 20, 50]}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="records"
        />
      </section>
    </div>
  );
};

const ActivityRow = ({ item }) => {
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-base-content">
        <ActivityTypeIcon type={item.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{item.title}</p>
          <span className="badge badge-outline badge-sm">{item.type}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-base-content/60">
          {item.description || "No details recorded"}
        </p>
      </div>
      <span className="shrink-0 text-xs text-base-content/50">
        {formatDateTime(item.createdAt)}
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link
        to={item.href}
        className="flex flex-col gap-3 p-4 transition-colors hover:bg-base-200 md:flex-row md:items-center"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
      {content}
    </div>
  );
};

const ActivityTypeIcon = ({ type }) => {
  const Icon = iconByType[type] || Archive;
  return <Icon className="h-5 w-5" />;
};

export default ActivityLog;

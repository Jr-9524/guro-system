import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Search,
  X,
} from "lucide-react";
import {
  filterSearchResults,
  loadSearchResults,
} from "../../services/searchIndex";

const resultLimit = 8;

const QuickSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    setTimeout(() => inputRef.current?.focus(), 50);

    const loadIndex = async () => {
      setIsLoading(true);
      try {
        const records = await loadSearchResults();
        if (isCurrent) setAllResults(records);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadIndex();

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  const results = useMemo(() => {
    const filteredResults = filterSearchResults(allResults, query);
    const prioritizedResults = query.trim()
      ? filteredResults
      : filteredResults.filter((result) =>
          ["actions", "pages"].includes(result.category),
        );

    return prioritizedResults.slice(0, resultLimit);
  }, [allResults, query]);

  const selectedResultIndex = results.length
    ? Math.min(selectedIndex, results.length - 1)
    : 0;

  const closeAndNavigate = (to) => {
    navigate(to);
    onClose();
  };

  const openSearchPage = () => {
    const params = query.trim()
      ? `?q=${encodeURIComponent(query.trim())}`
      : "";
    closeAndNavigate(`/search${params}`);
  };

  const openSelectedResult = () => {
    const selectedResult = results[selectedResultIndex];
    if (selectedResult) {
      closeAndNavigate(selectedResult.to);
      return;
    }

    openSearchPage();
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!results.length) return;
      setSelectedIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      setSelectedIndex(
        (index) => (index - 1 + results.length) % results.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      openSelectedResult();
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const grouped = results.reduce((groups, result) => {
    const label = result.label === "Page" ? "Pages" : `${result.label}s`;
    groups[label] = [...(groups[label] || []), result];
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close search"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-gray-300 bg-base-100 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-300 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search students, IEPs, goals, notes, or pages..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <span className="loading loading-spinner"></span>
            </div>
          ) : results.length ? (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="mt-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide opacity-50">
                  {category}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const globalIndex = results.indexOf(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => closeAndNavigate(item.to)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        globalIndex === selectedResultIndex
                          ? "bg-base-200"
                          : "hover:bg-base-200"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {Icon && <Icon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs opacity-60">
                          {item.subtitle}
                        </span>
                      </span>
                      {globalIndex === selectedResultIndex && (
                        <CornerDownLeft className="h-4 w-4 shrink-0 opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center opacity-50">
              <Search className="h-8 w-8" />
              <p className="text-sm">No quick results</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-300 px-4 py-2 text-xs opacity-60">
          <button
            type="button"
            className="font-medium text-primary"
            onClick={openSearchPage}
          >
            View all results
          </button>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Open
            </span>
            <span className="flex items-center gap-1">
              <X className="h-3 w-3" />
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSearch;

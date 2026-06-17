import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import {
  filterSearchResults,
  getSearchCounts,
  loadSearchResults,
  searchCategories,
} from "../services/searchIndex";
import SearchInput from "../components/common/SearchInput";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allResults, setAllResults] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("type") || "all",
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const loadSearchData = async () => {
      setIsLoading(true);
      try {
        const records = await loadSearchResults();

        if (!isCurrent) return;
        setAllResults(records);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadSearchData();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query);
    if (activeCategory !== "all") nextParams.set("type", activeCategory);
    setSearchParams(nextParams, { replace: true });
  }, [activeCategory, query, setSearchParams]);

  const results = useMemo(() => {
    return filterSearchResults(allResults, query, activeCategory);
  }, [activeCategory, allResults, query]);

  const counts = useMemo(() => getSearchCounts(allResults), [allResults]);

  return (
    <div className="min-h-full w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-base-content/60">
          Find students, IEPs, custom goals, progress notes, and app pages.
        </p>
      </div>

      <section className="rounded-lg border border-gray-300 bg-base-100 p-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by name, LRN, IEP title, goal text, note, or page..."
          autoFocus
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {searchCategories.map((category) => (
            <button
              key={category.value}
              className={`btn btn-sm px-3 py-2 ${
                activeCategory === category.value
                  ? "btn-active bg-gray-100"
                  : "btn-outline"
              }`}
              onClick={() => setActiveCategory(category.value)}
            >
              {category.label}
              <span>{counts[category.value] || 0}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-300 bg-base-100">
        {isLoading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : results.length ? (
          <div className="divide-y divide-gray-300">
            {results.map((result) => (
              <SearchResultRow key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 p-8 text-center">
            <Search className="h-9 w-9 opacity-50" />
            <div>
              <p className="font-semibold">No matching results</p>
              <p className="mt-1 text-sm text-base-content/60">
                Try a student name, LRN, IEP title, or goal keyword.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const SearchResultRow = ({ result }) => {
  const Icon = result.icon || BookOpen;

  return (
    <Link
      to={result.to}
      className="flex flex-col gap-3 p-4 transition-colors hover:bg-base-200 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{result.title}</p>
            <span className="badge badge-outline badge-sm">{result.label}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-base-content/60">
            {result.subtitle}
          </p>
        </div>
      </div>
      <span className="badge badge-ghost shrink-0">{result.meta}</span>
    </Link>
  );
};

export default SearchPage;

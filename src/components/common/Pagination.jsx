const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const sorted = [...pages]
    .filter((page) => page > 0 && page <= totalPages)
    .sort((a, b) => a - b);
  const result = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(`gap-${page}`);
    result.push(page);
  });

  return result;
};

const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  itemLabel = "items",
}) => {
  if (!totalItems) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const buttonClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-base-300 bg-base-100 px-3 text-sm font-semibold transition-colors hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3 border-t border-base-300 bg-base-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
        <span>
          Showing {start}-{end} of {totalItems} {itemLabel}
        </span>
        {pageSizeOptions && onPageSizeChange && (
          <label className="flex items-center gap-1.5 whitespace-nowrap">
            <span>Per page:</span>
            <select
              className="h-9 min-h-0 w-16 cursor-pointer rounded-sm border border-base-300 bg-base-100 px-2 py-0 text-sm font-semibold text-base-content outline-none transition-colors hover:border-primary/40 focus:border-primary focus:ring-0"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              aria-label={`${itemLabel} per page`}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav
        className="flex flex-wrap items-center gap-1"
        aria-label={`${itemLabel} pagination`}
      >
        <button
          type="button"
          className={buttonClass}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {getPageNumbers(currentPage, totalPages).map((page) =>
          typeof page === "string" ? (
            <span
              key={page}
              className="px-1 text-base-content/40"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`${buttonClass} ${
                page === currentPage
                  ? "border-primary bg-primary text-primary-content hover:bg-primary"
                  : ""
              }`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          className={buttonClass}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </nav>
    </div>
  );
};

export default Pagination;

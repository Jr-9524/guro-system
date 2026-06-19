import { useMemo, useState } from "react";

const usePagination = (items, initialPageSize = 10) => {
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
    setRequestedPage(nextPage);
  };

  const setPageSize = (size) => {
    setPageSizeState(Number(size));
    setRequestedPage(1);
  };

  return {
    currentItems,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1),
  };
};

export default usePagination;

import { useState, useMemo, useCallback } from 'react';

/**
 * Client-side pagination for arrays. Returns a sliced page of items
 * plus props compatible with DataTable's pagination footer.
 */
export function useClientPagination<T>(items: T[], pageSize = 25) {
  const [page, setPage] = useState(0);

  // Reset to page 0 if the data changes and current page is out of range
  const safePage = useMemo(() => {
    const maxPage = Math.max(0, Math.ceil(items.length / pageSize) - 1);
    return Math.min(page, maxPage);
  }, [items.length, pageSize, page]);

  const paged = useMemo(
    () => items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [items, safePage, pageSize],
  );

  const hasNextPage = (safePage + 1) * pageSize < items.length;

  const onPrevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const onNextPage = useCallback(() => setPage((p) => p + 1), []);
  const resetPage = useCallback(() => setPage(0), []);

  return {
    paged,
    page: safePage,
    totalCount: items.length,
    shownCount: paged.length,
    hasNextPage,
    onPrevPage,
    onNextPage,
    resetPage,
  };
}

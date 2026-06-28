import { useState, useCallback } from 'react';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseServerPaginationOptions {
  /** Items per page (default 25) */
  pageSize?: number;
  /** Fetch function — receives { page, limit } and should call the API */
  fetchFn: (params: { page: number; limit: number }) => Promise<{
    data: any[];
    pagination: PaginationMeta;
  }>;
}

/**
 * Server-side pagination hook. Manages page state and provides
 * props compatible with DataTable's pagination footer.
 *
 * Usage:
 *   const { items, loading, pagination, load, onPrevPage, onNextPage } = useServerPagination({
 *     fetchFn: ({ page, limit }) => api.get(`/endpoint?page=${page}&limit=${limit}`),
 *   });
 */
export function useServerPagination({ pageSize = 25, fetchFn }: UseServerPaginationOptions) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: pageSize, total: 0, pages: 0 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await fetchFn({ page, limit: pageSize });
      setItems(result.data);
      setMeta(result.pagination);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pageSize]);

  const onPrevPage = useCallback(() => {
    if (meta.page > 1) load(meta.page - 1);
  }, [meta.page, load]);

  const onNextPage = useCallback(() => {
    if (meta.page < meta.pages) load(meta.page + 1);
  }, [meta.page, meta.pages, load]);

  return {
    items,
    loading,
    /** Current 0-based page index for DataTable compatibility */
    page: meta.page - 1,
    totalCount: meta.total,
    shownCount: items.length,
    hasNextPage: meta.page < meta.pages,
    onPrevPage,
    onNextPage,
    /** Load a specific 1-based page (defaults to page 1) */
    load,
  };
}

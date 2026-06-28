import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClientPagination } from '../useClientPagination';

const items = [1, 2, 3, 4, 5, 6, 7];

describe('useClientPagination', () => {
  it('returns first page of items', () => {
    const { result } = renderHook(() => useClientPagination(items, 3));
    expect(result.current.paged).toEqual([1, 2, 3]);
    expect(result.current.page).toBe(0);
    expect(result.current.shownCount).toBe(3);
    expect(result.current.totalCount).toBe(7);
  });

  it('hasNextPage is true when more items exist', () => {
    const { result } = renderHook(() => useClientPagination(items, 3));
    expect(result.current.hasNextPage).toBe(true);
  });

  it('hasNextPage is false on last page', () => {
    const { result } = renderHook(() => useClientPagination(items, 3));
    act(() => result.current.onNextPage());
    act(() => result.current.onNextPage());
    // page 2: items [7], no more pages
    expect(result.current.paged).toEqual([7]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('onNextPage advances to next page', () => {
    const { result } = renderHook(() => useClientPagination(items, 3));
    act(() => result.current.onNextPage());
    expect(result.current.paged).toEqual([4, 5, 6]);
    expect(result.current.page).toBe(1);
  });

  it('onPrevPage goes back', () => {
    const { result } = renderHook(() => useClientPagination(items, 3));
    act(() => result.current.onNextPage());
    act(() => result.current.onPrevPage());
    expect(result.current.paged).toEqual([1, 2, 3]);
    expect(result.current.page).toBe(0);
  });

  it('onPrevPage does not go below 0', () => {
    const { result } = renderHook(() => useClientPagination(items, 3));
    act(() => result.current.onPrevPage());
    expect(result.current.page).toBe(0);
    expect(result.current.paged).toEqual([1, 2, 3]);
  });

  it('resetPage goes back to page 0', () => {
    const { result } = renderHook(() => useClientPagination(items, 3));
    act(() => result.current.onNextPage());
    act(() => result.current.onNextPage());
    expect(result.current.page).toBe(2);
    act(() => result.current.resetPage());
    expect(result.current.page).toBe(0);
    expect(result.current.paged).toEqual([1, 2, 3]);
  });

  it('handles empty array', () => {
    const { result } = renderHook(() => useClientPagination([], 3));
    expect(result.current.paged).toEqual([]);
    expect(result.current.page).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.shownCount).toBe(0);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('resets to last valid page when items shrink', () => {
    let currentItems = items;
    const { result, rerender } = renderHook(() => useClientPagination(currentItems, 3));

    // Go to page 2 (last page with 7 items)
    act(() => result.current.onNextPage());
    act(() => result.current.onNextPage());
    expect(result.current.page).toBe(2);

    // Shrink items so page 2 is out of range
    currentItems = [1, 2, 3, 4];
    rerender();
    // Max valid page is 1 (items 4,5 would be on page 1)
    expect(result.current.page).toBe(1);
    expect(result.current.paged).toEqual([4]);
  });

  it('custom pageSize works', () => {
    const { result } = renderHook(() => useClientPagination(items, 5));
    expect(result.current.paged).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.shownCount).toBe(5);
    expect(result.current.hasNextPage).toBe(true);
    act(() => result.current.onNextPage());
    expect(result.current.paged).toEqual([6, 7]);
    expect(result.current.hasNextPage).toBe(false);
  });
});

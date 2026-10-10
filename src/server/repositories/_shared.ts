/**
 * Shared helpers for repositories.
 */

/** Standard pagination envelope builder. */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

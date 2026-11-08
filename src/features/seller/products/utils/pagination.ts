/**
 * Calculates a sliding window of visible page numbers for pagination.
 * Bounded dynamically between 1 and totalPages, displaying up to 5 adjacent pages.
 *
 * Examples:
 * - totalPages <= 5: returns [1..totalPages]
 * - currentPage <= 3: returns [1, 2, 3, 4, 5]
 * - currentPage >= totalPages - 2: returns [totalPages - 4 .. totalPages]
 * - Otherwise: returns [currentPage - 2 .. currentPage + 2]
 */
export function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: Math.max(1, totalPages) }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }
  if (currentPage >= totalPages - 2) {
    return [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
}

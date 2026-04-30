const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'end-ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'start-ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages];
};

const buttonClassName =
  'px-4 py-2 rounded-full text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 aria-current:font-semibold aria-current:underline';

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const paginationItems = getPaginationItems(safeCurrentPage, safeTotalPages);
  const isPreviousDisabled = safeCurrentPage === 1;
  const isNextDisabled = safeCurrentPage === safeTotalPages;

  const handlePageChange = (page) => {
    if (page === safeCurrentPage || page < 1 || page > safeTotalPages) {
      return;
    }

    onPageChange?.(page);
  };

  if (safeTotalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => handlePageChange(safeCurrentPage - 1)}
        disabled={isPreviousDisabled}
        aria-disabled={isPreviousDisabled}
        className={buttonClassName}
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {paginationItems.map((item) => {
          if (typeof item === 'string') {
            return (
              <span key={item} aria-hidden="true" className="px-2 text-sm">
                ...
              </span>
            );
          }

          const page = item;
          const isCurrentPage = page === safeCurrentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              aria-current={isCurrentPage ? 'page' : undefined}
              aria-label={isCurrentPage ? `Page ${page}, current page` : `Go to page ${page}`}
              className={`${buttonClassName} min-w-10`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => handlePageChange(safeCurrentPage + 1)}
        disabled={isNextDisabled}
        aria-disabled={isNextDisabled}
        className={buttonClassName}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;

type PaginationProps = {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, loading = false, onPageChange }: PaginationProps) {
  if (totalPages <= 1 && page <= 1) return null;
  const buttonClass = "px-4 py-2 rounded-lg border border-slate-200 text-brand-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-4 py-4">
      <button type="button" className={buttonClass} disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
      <span className="text-sm text-slate-500" aria-live="polite">Page {page} of {totalPages}</span>
      <button type="button" className={buttonClass} disabled={loading || page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </nav>
  );
}

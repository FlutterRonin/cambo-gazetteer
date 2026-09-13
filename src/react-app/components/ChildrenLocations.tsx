import { useState } from "react";
import { Link } from "react-router-dom";
import { Pagination } from "@/components/Pagination";
import { fetchChildPage } from "@/libs/apiClient";
import { getEnglishName, getKhmerName } from "@/libs/name";
import type { ResponseByCode } from "@/types";

export function ChildrenLocations({ location }: { location: ResponseByCode }) {
  const [children, setChildren] = useState(location.children);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = location.childrenCount.reduce((sum, item) => sum + item.count, 0);

  const loadPage = async (nextPage: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchChildPage(location.code, location.type, nextPage);
      setChildren(result.data);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sub-locations.");
    } finally {
      setLoading(false);
    }
  };

  if (total === 0) return null;
  return (
    <section className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 mb-6" aria-busy={loading}>
      <h3 className="text-xl font-bold text-slate-900 mb-6">Sub-locations ({total})</h3>
      {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children.map((child) => (
          <Link key={child.code} to={`/location/${child.code}`}
            className="p-4 border border-slate-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all">
            <div className="font-bold text-slate-900 font-khmer truncate">{getKhmerName(child)}</div>
            <div className="text-sm text-slate-600 truncate">{getEnglishName(child)}</div>
          </Link>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.ceil(total / 20)} loading={loading} onPageChange={(nextPage) => void loadPage(nextPage)} />
    </section>
  );
}

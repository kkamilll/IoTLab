import React from "react";

/**
 * Standardowa paginacja. Używaj wszędzie.
 */
const Pagination = ({ currentPage, totalPages, onPrev, onNext, onPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 py-4 border-t border-slate-100 bg-slate-50/20">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
      >
        Prev
      </button>

      {onPage &&
        Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => onPage(i + 1)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
              currentPage === i + 1
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {i + 1}
          </button>
        ))}

      {!onPage && (
        <span className="text-slate-500 text-xs font-semibold">
          Page {currentPage} / {totalPages}
        </span>
      )}

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

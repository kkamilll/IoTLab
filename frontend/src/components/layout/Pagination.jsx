import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import Btn from "./Btn";

/**
 * Standardowa paginacja. Używaj wszędzie.
 */
const Pagination = ({ currentPage, totalPages, onPrev, onNext, onPage }) => {
  const { t } = useLanguage();

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 py-4 border-t border-slate-100 bg-slate-50/20">
      <Btn
        onClick={onPrev}
        disabled={currentPage === 1}
        variant="secondary"
        size="sm"
      >
        {t("common.prev")}
      </Btn>

      {onPage &&
        Array.from({ length: totalPages }, (_, i) => (
          <Btn
            key={i}
            onClick={() => onPage(i + 1)}
            variant={currentPage === i + 1 ? "primary" : "secondary"}
            size="sm"
          >
            {i + 1}
          </Btn>
        ))}

      {!onPage && (
        <span className="text-slate-500 text-xs font-semibold">
          {t("common.page")} {currentPage} / {totalPages}
        </span>
      )}

      <Btn
        onClick={onNext}
        disabled={currentPage === totalPages}
        variant="secondary"
        size="sm"
      >
        {t("common.next")}
      </Btn>
    </div>
  );
};

export default Pagination;

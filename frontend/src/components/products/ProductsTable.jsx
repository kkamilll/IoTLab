import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Eye, Trash2, User, Package, Plus, Minus, ShoppingCart } from "lucide-react";

const ProductsTable = ({
  paginatedProducts,
  allColumns,
  hiddenColumns,
  sortConfig,
  handleSort,
  isAdmin,
  user,
  extraColumns,
  removeExtraField,
  handlePreview,
  handleEdit,
  handleDelete,
  handleQuantityChange,
  cartQuantities,
  getAvailableStockForProduct,
  selectedProductIds = [],
  handleToggleSelect,
  handleToggleSelectAll,
}) => {
  const { t, language } = useLanguage();
  const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ArrowUpDown className="inline-block text-slate-300 dark:text-slate-600 w-3 h-3 transition-colors group-hover:text-slate-400" />;
    return sortConfig.direction === "asc" 
      ? <ArrowUp className="inline-block text-indigo-500 dark:text-indigo-400 w-3 h-3 font-bold" />
      : <ArrowDown className="inline-block text-indigo-500 dark:text-indigo-400 w-3 h-3 font-bold" />;
  };

  return (
    <div className="hidden md:block overflow-x-auto w-full bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-200 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] transition overflow-hidden">
      <table className="table-auto w-full min-w-max divide-y divide-slate-100 dark:divide-slate-850">
        <thead className="bg-slate-50/65 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-850/80">
          <tr>
            {/* Select All Checkbox */}
            <th 
              className="px-4 py-3.5 text-center w-10 select-none cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-850/30 transition-colors rounded-tl-[1.25rem]"
              onClick={() => handleToggleSelectAll(paginatedProducts)}
            >
              <input
                type="checkbox"
                checked={
                  paginatedProducts.length > 0 &&
                  paginatedProducts.every((p) => selectedProductIds.includes(p._id))
                }
                onChange={() => {}} // handled by th onClick
                className="w-4 h-4 rounded accent-indigo-650 cursor-pointer pointer-events-none"
              />
            </th>

            {/* Thumbnail col */}
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-12 select-none">
              {t("products.columns.image") || "Img"}
            </th>

            {allColumns
              .filter((col) => !hiddenColumns.includes(col))
              .map((col, idx) => {
                const colTrans = t(`products.columns.${col}`);
                const displayName = colTrans.startsWith("products.columns.") ? col : colTrans;
                return (
                  <th
                    key={idx}
                    className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => handleSort(col)}
                        className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition flex items-center gap-1 group/header"
                      >
                        {displayName}
                        <span className="transition-transform duration-200 group-hover/header:scale-110">
                          <SortIcon col={col} />
                        </span>
                      </span>
                      {extraColumns.includes(col) && (
                        <button
                          onClick={() => removeExtraField(col)}
                          className="ml-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-[10px] font-bold transition cursor-pointer"
                          title={`Remove column "${col}"`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}

            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap select-none">{t("products.actions")}</th>
            <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap select-none">{t("products.status")}</th>
          </tr>
        </thead>

        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-850">
          {paginatedProducts.map((p) => (
            <tr
              key={p._id}
              className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 cursor-pointer transition-colors duration-100 group"
              onClick={(e) => {
                if (e.target.closest("button, select, input, option, a, td.select-cell")) return;
                handlePreview(p._id);
              }}
            >
              {/* Checkbox Select Cell */}
              <td 
                className="px-4 py-3.5 text-center cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors select-cell"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSelect(p._id);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(p._id)}
                  onChange={() => {}} // handled by td onClick
                  className="w-4 h-4 rounded accent-indigo-650 cursor-pointer pointer-events-none"
                />
              </td>

              {/* Thumbnail */}
              <td className="px-5 py-3.5">
                {p.images?.length ? (
                  <img
                    src={`${API_BASE}/uploads/products/${p.images.find(i => i.isVisible)?.filename || p.images[0].filename}`}
                    alt={p.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-xs group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-850 border border-slate-200/50 dark:border-slate-800/60 flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105">
                    <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                )}
              </td>

              {allColumns
                .filter((col) => !hiddenColumns.includes(col))
                .map((col, idx) => {
                  let value;
                  switch (col) {
                    case "total":
                      value = (
                        <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 tabular-nums shadow-xs">
                          {p.stockTotal ?? 0}
                        </span>
                      );
                      break;

                    case "for rent":
                      value = (
                        <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-350 border border-indigo-100/50 dark:border-indigo-900/30 tabular-nums shadow-xs">
                          {p.stockForRent ?? 0}
                        </span>
                      );
                      break;

                    case "categories":
                      value = p.categories?.length ? (
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {p.categories.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30 shadow-xs transition hover:scale-102 hover:border-indigo-200/50 dark:hover:border-indigo-850/40"
                            >
                              {c?.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      );
                      break;

                    case "owner":
                      value = (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-55 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center">
                            <User className="w-3 h-3 text-slate-450 dark:text-slate-400" />
                          </div>
                          <span className="text-xs font-medium text-slate-650 dark:text-slate-350">{p.owner?.name ?? p.owner}</span>
                        </div>
                      );
                      break;

                    case "name":
                      value = (
                        <span className="font-semibold text-slate-850 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-155 max-w-[180px] block truncate" title={p.name}>
                          {p.name}
                        </span>
                      );
                      break;

                    case "description":
                      value = p.description ? (
                        <span className="text-xs text-slate-500 dark:text-slate-405 max-w-[200px] block truncate italic font-light" title={p.description}>
                          {p.description}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      );
                      break;

                    default: {
                      const raw = p[col] ?? p.extraFields?.[col] ?? "";
                      const str = typeof raw === "string" ? raw : String(raw);
                      value = str.length > 25 ? (
                        <span title={str} className="text-xs font-medium text-slate-600 dark:text-slate-350">{str.slice(0, 25)}…</span>
                      ) : str ? (
                        <span className="text-xs font-medium text-slate-650 dark:text-slate-300">{str}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      );
                    }
                  }

                  return (
                    <td key={idx} className="px-5 py-3.5 text-sm text-slate-650 dark:text-slate-300 whitespace-nowrap">
                      {value}
                    </td>
                  );
                })}

              {/* Actions */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    disabled={user.id !== p.owner._id && !isAdmin}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-650 disabled:border-transparent disabled:cursor-not-allowed cursor-pointer shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t("common.edit")}
                  </button>
                  <button
                    onClick={() => handlePreview(p._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("products.preview")}
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={user.id !== p.owner._id && !isAdmin}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/15 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-105 dark:border-red-900/25 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("common.delete")}
                  </button>

                  {/* Quantity stepper */}
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-full overflow-hidden h-9 bg-slate-50/80 dark:bg-slate-950/80 ml-1 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xs">
                    <button
                      onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) - 1, p)}
                      className="px-3.5 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-450 h-full transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                      disabled={(cartQuantities[p._id] || 0) <= 0}
                      title={t("cart.remove") || "Remove"}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative flex items-center h-full bg-transparent border-x border-slate-200 dark:border-slate-800">
                      <ShoppingCart className="absolute left-2.5 text-indigo-550/40 dark:text-indigo-400/30 w-3.5 h-3.5 pointer-events-none" />
                      <input
                        type="number"
                        min="0"
                        max={getAvailableStockForProduct(p)}
                        value={cartQuantities[p._id] || 0}
                        onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                        className="w-14 text-center bg-transparent border-0 outline-none focus:ring-0 text-xs font-bold text-slate-850 dark:text-slate-100 pl-7 pr-1.5 h-full p-0 shadow-inner"
                      />
                    </div>
                    <button
                      onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) + 1, p)}
                      className="px-3.5 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-450 h-full transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                      disabled={(cartQuantities[p._id] || 0) >= getAvailableStockForProduct(p)}
                      title={t("common.add") || "Add"}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {getAvailableStockForProduct(p) === 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/25 text-red-650 dark:text-red-400 border border-red-100/60 dark:border-red-900/30 shadow-xs">
                      {t("products.statusUnavailable") || "Niedostępne"}
                    </span>
                  ) : getAvailableStockForProduct(p) <= 2 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50/80 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/30 shadow-xs">
                      {(t("products.statusLowStock") || "Niski zapas") + `: ${getAvailableStockForProduct(p)}`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30 shadow-xs">
                      {t("products.available")}: {getAvailableStockForProduct(p)}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;

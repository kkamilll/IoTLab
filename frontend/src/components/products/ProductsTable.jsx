import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Eye, Trash2, User, Package, Plus, Minus, Globe, Lock } from "lucide-react";

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
  columnConfigs = {},
  toggleColumnGuestVisibility,
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
  const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) {
      return <ArrowUpDown className="inline-block text-slate-300 dark:text-slate-600 w-3 h-3 transition-colors group-hover/header:text-slate-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="inline-block text-indigo-500 dark:text-indigo-400 w-3 h-3 font-bold" />
    ) : (
      <ArrowDown className="inline-block text-indigo-500 dark:text-indigo-400 w-3 h-3 font-bold" />
    );
  };

  return (
    <div className="hidden md:block overflow-x-auto w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] transition">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/80 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-850/80 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
          <tr>
            {/* Select All Checkbox */}
            <th 
              className="px-4 py-3.5 text-center w-12 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
              onClick={() => handleToggleSelectAll(paginatedProducts)}
              title={language === "pl" ? "Zaznacz / odznacz wszystkie" : "Select / Deselect all"}
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

            {/* Thumbnail */}
            <th className="px-3 py-3.5 text-center w-16">
              {t("products.columns.image") || "Zdjęcie"}
            </th>

            {/* Dynamic Columns from allColumns */}
            {allColumns
              .filter((col) => !hiddenColumns.includes(col))
              .map((col, idx) => {
                const colTrans = t(`products.columns.${col}`);
                const displayName = colTrans.startsWith("products.columns.") ? col : colTrans;
                const isNumeric = col === "total" || col === "for rent";

                return (
                  <th
                    key={idx}
                    className={`px-4 py-3.5 whitespace-nowrap ${
                      isNumeric ? "text-center w-28" : col === "name" ? "min-w-[200px] max-w-[340px]" : ""
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 ${isNumeric ? "justify-center" : "justify-start"}`}>
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
                        <div className="flex items-center gap-1 ml-1.5">
                          {toggleColumnGuestVisibility && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleColumnGuestVisibility(col);
                              }}
                              title={
                                columnConfigs?.[col.toLowerCase()]
                                  ? (language === "pl" ? "Widoczna dla gości. Kliknij, aby ukryć przed gośćmi (tylko admin)." : "Visible to guests. Click to make admin only.")
                                  : (language === "pl" ? "Tylko dla admina. Kliknij, aby udostępnić gościom." : "Admin only. Click to make visible to guests.")
                              }
                              className={`p-1 rounded-md transition cursor-pointer select-none border flex items-center justify-center ${
                                columnConfigs?.[col.toLowerCase()]
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                                  : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                              }`}
                            >
                              {columnConfigs?.[col.toLowerCase()] ? (
                                <Globe className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExtraField(col);
                            }}
                            className="px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-[10px] font-bold transition cursor-pointer"
                            title={language === "pl" ? `Usuń kolumnę "${col}"` : `Remove column "${col}"`}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}

            {/* Status Column */}
            <th className="px-4 py-3.5 text-left whitespace-nowrap w-36">
              {t("products.status") || "Status"}
            </th>

            {/* Add to Cart Column */}
            <th className="px-4 py-3.5 text-center whitespace-nowrap w-36">
              {t("products.columns.cart") || "Do koszyka"}
            </th>

            {/* Actions Column */}
            <th className="px-6 py-3.5 text-right whitespace-nowrap w-56">
              {t("products.actions") || "Akcje"}
            </th>
          </tr>
        </thead>

        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-850/80">
          {paginatedProducts.map((p) => {
            const availableQty = getAvailableStockForProduct(p);
            const inCartQty = cartQuantities[p._id] || 0;
            const isOwnerOrAdmin = isAdmin || (user && (user.id === (p.owner?._id || p.owner) || user._id === (p.owner?._id || p.owner)));

            return (
              <tr
                key={p._id}
                className="hover:bg-slate-50/75 dark:hover:bg-slate-850/40 transition-colors duration-150 group"
              >
                {/* Checkbox Select Cell */}
                <td 
                  className="px-4 py-3 text-center cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors select-cell"
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
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => handlePreview(p._id)}
                    title={`${p.name} (${t("products.preview") || "Podgląd"})`}
                    className="cursor-pointer inline-block rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    {p.images?.length ? (
                      <img
                        src={`${API_BASE}/uploads/products/${p.images.find(i => i.isVisible)?.filename || p.images[0].filename}`}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-2xs"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/70 dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-2xs">
                        <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                  </button>
                </td>

                {/* Dynamic Columns */}
                {allColumns
                  .filter((col) => !hiddenColumns.includes(col))
                  .map((col, idx) => {
                    let value;
                    switch (col) {
                      case "name":
                        value = (
                          <div className="min-w-0 pr-2 max-w-[280px]">
                            <button
                              type="button"
                              onClick={() => handlePreview(p._id)}
                              className="font-bold text-sm text-slate-850 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors duration-150 text-left truncate block w-full focus:outline-none hover:underline"
                              title={`${p.name} (${t("products.preview") || "Podgląd"})`}
                            >
                              {p.name}
                            </button>
                          </div>
                        );
                        break;

                      case "categories": {
                        if (!p.categories?.length) {
                          value = <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>;
                          break;
                        }
                        const maxVisible = 2;
                        const visibleCats = p.categories.slice(0, maxVisible);
                        const remainingCount = p.categories.length - maxVisible;
                        const allCatNames = p.categories.map((c) => c?.name).filter(Boolean).join(", ");

                        value = (
                          <div className="flex flex-wrap items-center gap-1 max-w-[260px]" title={allCatNames}>
                            {visibleCats.map((c, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/60 dark:border-indigo-900/30 shadow-2xs max-w-[180px] truncate"
                                title={c?.name}
                              >
                                {c?.name}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs cursor-help"
                                title={p.categories.slice(maxVisible).map((c) => c?.name).join(", ")}
                              >
                                +{remainingCount}
                              </span>
                            )}
                          </div>
                        );
                        break;
                      }

                      case "total":
                        value = (
                          <div className="text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 tabular-nums shadow-2xs">
                              {p.stockTotal ?? 0}
                            </span>
                          </div>
                        );
                        break;

                      case "for rent":
                        value = (
                          <div className="text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/70 dark:border-indigo-900/40 tabular-nums shadow-2xs">
                              {p.stockForRent ?? 0}
                            </span>
                          </div>
                        );
                        break;

                      case "owner":
                        value = (
                          <div className="flex items-center gap-2">
                            <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                              {p.owner?.profileImage ? (
                                <img
                                  src={`${API_BASE}/uploads/users/${p.owner.profileImage}`}
                                  alt={p.owner?.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextElementSibling) {
                                      e.currentTarget.nextElementSibling.classList.remove('hidden');
                                    }
                                  }}
                                />
                              ) : null}
                              <User className={`w-3 h-3 text-slate-400 ${p.owner?.profileImage ? 'hidden' : ''}`} />
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]" title={p.owner?.name ?? p.owner}>
                              {p.owner?.name ?? p.owner}
                            </span>
                          </div>
                        );
                        break;

                      case "description":
                        value = p.description ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] block truncate italic font-light" title={p.description}>
                            {p.description}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                        );
                        break;

                      default: {
                        const raw = p[col] ?? p.extraFields?.[col] ?? "";
                        const str = typeof raw === "string" ? raw : String(raw);
                        value = str.length > 25 ? (
                          <span title={str} className="text-xs font-medium text-slate-650 dark:text-slate-300">{str.slice(0, 25)}…</span>
                        ) : str ? (
                          <span className="text-xs font-medium text-slate-650 dark:text-slate-300">{str}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                        );
                      }
                    }

                    return (
                      <td key={idx} className="px-4 py-3 text-sm text-slate-650 dark:text-slate-300 whitespace-nowrap">
                        {value}
                      </td>
                    );
                  })}

                {/* Status Column */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {availableQty === 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 shrink-0 animate-pulse" />
                      {t("products.statusUnavailable") || "Niedostępne"}
                    </span>
                  ) : availableQty <= 2 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shrink-0" />
                      {(t("products.statusLowStock") || "Niski zapas")}: {availableQty}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
                      {t("products.available")}: {availableQty}
                    </span>
                  )}
                </td>

                {/* Add to Cart Stepper Column */}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className={`inline-flex items-center border rounded-full overflow-hidden h-8.5 transition-all shadow-2xs ${
                    inCartQty > 0
                      ? "border-emerald-400/80 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80"
                  }`}>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(p._id, inCartQty - 1, p)}
                      className="qty-stepper-btn !w-7 !h-full"
                      disabled={inCartQty <= 0}
                      title={t("cart.remove") || "Remove"}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <div className="flex items-center justify-center min-w-[2.25rem] px-1 border-x border-slate-200/70 dark:border-slate-800">
                      <input
                        type="number"
                        min="0"
                        max={availableQty}
                        value={inCartQty}
                        onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                        className="w-8 text-center bg-transparent border-0 outline-none focus:ring-0 text-xs font-bold text-slate-800 dark:text-slate-100 p-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(p._id, inCartQty + 1, p)}
                      className="qty-stepper-btn !w-7 !h-full"
                      disabled={inCartQty >= availableQty}
                      title={t("common.add") || "Add"}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </td>

                {/* Actions Column */}
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePreview(p._id)}
                      title={t("products.preview") || "Podgląd"}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/60 transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>{t("products.preview")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(p)}
                      disabled={!isOwnerOrAdmin}
                      title={t("common.edit") || "Edytuj"}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-100/70 dark:border-indigo-900/40 transition cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>{t("common.edit")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      disabled={!isOwnerOrAdmin}
                      title={t("common.delete") || "Usuń"}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-red-650 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50/70 hover:bg-red-100/80 dark:bg-red-950/25 dark:hover:bg-red-900/40 border border-red-100/70 dark:border-red-900/30 transition cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                      <span>{t("common.delete")}</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;

import React from "react";
import { useLanguage } from "../../context/LanguageContext";

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
}) => {
  const { t } = useLanguage();
  const API_BASE = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`;

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <span className="text-slate-300 text-xs">⇅</span>;
    return <span className="text-indigo-500 text-xs">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="hidden md:block overflow-x-auto w-full bg-white rounded-2xl border border-slate-200 shadow-sm">
      <table className="table-auto w-full min-w-max divide-y divide-slate-100">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            {/* Thumbnail col */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-12">
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
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => handleSort(col)}
                        className="cursor-pointer hover:text-slate-800 transition flex items-center gap-1"
                      >
                        {displayName} <SortIcon col={col} />
                      </span>
                      {extraColumns.includes(col) && (
                        <button
                          onClick={() => removeExtraField(col)}
                          className="ml-1 px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded hover:bg-red-100 text-[10px] font-bold transition"
                          title={`Remove column "${col}"`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}

            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t("products.actions")}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t("products.status")}</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-slate-100">
          {paginatedProducts.map((p) => (
            <tr
              key={p._id}
              className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
              onClick={(e) => {
                if (e.target.closest("button, select, input, option, a")) return;
                handlePreview(p._id);
              }}
            >
              {/* Thumbnail */}
              <td className="px-4 py-2.5">
                {p.images?.length ? (
                  <img
                    src={`${API_BASE}/uploads/products/${p.images.find(i => i.isVisible)?.filename || p.images[0].filename}`}
                    alt={p.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center text-base">
                    📦
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
                        <span className="font-semibold text-slate-800 tabular-nums">{p.stockTotal ?? 0}</span>
                      );
                      break;

                    case "for rent":
                      value = (
                        <span className="font-semibold text-slate-800 tabular-nums">{p.stockForRent ?? 0}</span>
                      );
                      break;

                    case "categories":
                      value = p.categories?.length ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {p.categories.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              {c?.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      );
                      break;

                    case "owner":
                      value = (
                        <span className="text-slate-600">{p.owner?.name ?? p.owner}</span>
                      );
                      break;

                    case "name":
                      value = (
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition max-w-[180px] block truncate" title={p.name}>
                          {p.name}
                        </span>
                      );
                      break;

                    case "description":
                      value = (
                        <span className="text-slate-500 max-w-[200px] block truncate" title={p.description}>
                          {p.description || "—"}
                        </span>
                      );
                      break;

                    default: {
                      const raw = p[col] ?? p.extraFields?.[col] ?? "";
                      const str = typeof raw === "string" ? raw : String(raw);
                      value = str.length > 25 ? (
                        <span title={str}>{str.slice(0, 25)}…</span>
                      ) : str || <span className="text-slate-300">—</span>;
                    }
                  }

                  return (
                    <td key={idx} className="px-4 py-2.5 text-sm text-slate-600 whitespace-nowrap">
                      {value}
                    </td>
                  );
                })}

              {/* Actions */}
              <td className="px-4 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    disabled={user.id !== p.owner._id && !isAdmin}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    onClick={() => handlePreview(p._id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                  >
                    {t("products.preview")}
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={user.id !== p.owner._id && !isAdmin}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
                  >
                    {t("common.delete")}
                  </button>

                  {/* Quantity stepper */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-7 bg-slate-50 ml-1">
                    <button
                      onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) - 1, p)}
                      className="px-2 hover:bg-slate-200 text-slate-500 h-full transition disabled:opacity-40 disabled:pointer-events-none text-sm"
                      disabled={(cartQuantities[p._id] || 0) <= 0}
                    >−</button>
                    <input
                      type="number"
                      min="0"
                      max={getAvailableStockForProduct(p)}
                      value={cartQuantities[p._id] || 0}
                      onChange={(e) => handleQuantityChange(p._id, e.target.value, p)}
                      className="w-9 text-center bg-transparent border-0 outline-none focus:ring-0 text-xs font-bold text-slate-800"
                    />
                    <button
                      onClick={() => handleQuantityChange(p._id, (cartQuantities[p._id] || 0) + 1, p)}
                      className="px-2 hover:bg-slate-200 text-slate-500 h-full transition disabled:opacity-40 disabled:pointer-events-none text-sm"
                      disabled={(cartQuantities[p._id] || 0) >= getAvailableStockForProduct(p)}
                    >+</button>
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-100">
                    {t("products.available")}: {getAvailableStockForProduct(p)}
                  </span>
                  {(cartQuantities[p._id] || 0) > 0 && (
                    <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
                      🛒 {cartQuantities[p._id]}
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

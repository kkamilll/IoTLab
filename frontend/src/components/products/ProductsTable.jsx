import React from "react";

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
  return (
    <div className="hidden md:block overflow-x-auto w-full bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="table-auto w-full min-w-max divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            {allColumns
              .filter((col) => !hiddenColumns.includes(col))
              .map((col, idx) => (
                <th
                  key={idx}
                  className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => handleSort(col)}
                      className="truncate cursor-pointer select-none hover:text-slate-800 transition"
                    >
                      {col}{" "}
                      {sortConfig.key === col
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : sortConfig.direction === "desc"
                            ? "↓"
                            : ""
                        : ""}
                    </span>

                    {extraColumns.includes(col) && (
                      <button
                        onClick={() => removeExtraField(col)}
                        className="ml-2 px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 text-[10px] font-bold transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </th>
              ))}
            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Status
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-slate-100">
          {paginatedProducts.map((p) => (
            <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
              {allColumns
                .filter((col) => !hiddenColumns.includes(col))
                .map((col, idx) => {
                  let value;
                  switch (col) {
                    case "total":
                      value = (
                        <p className="min-w-20 font-medium text-slate-900">
                          {p.stockTotal ?? 0}
                        </p>
                      );
                      break;

                    case "for rent":
                      value = (
                        <p className="min-w-20 font-medium text-slate-900">
                          {p.stockForRent ?? 0}
                        </p>
                      );
                      break;

                    case "categories":
                      value = (
                        <div className="relative inline-block w-40">
                          <select
                            className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                            value={
                              p.categories.length === 1
                                ? (p.categories[0]?.name ?? "")
                                : ""
                            }
                            onChange={(e) => e.preventDefault()}
                            disabled={p.categories.length <= 1}
                          >
                            {p.categories.length === 0 && (
                              <option value="" disabled>
                                -
                              </option>
                            )}
                            {p.categories.length === 1 && (
                              <option value={p.categories[0]?.name ?? ""}>
                                {p.categories[0]?.name ?? "-"}
                              </option>
                            )}
                            {p.categories.length > 1 && (
                              <>
                                <option value="" disabled hidden>
                                  Check Categories
                                </option>
                                {p.categories.map((c, i) => (
                                  <option key={i} value={c?.name ?? ""}>
                                    {c?.name}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>

                          {p.categories.length > 1 && (
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs select-none">
                              ▼
                            </span>
                          )}
                        </div>
                      );
                      break;

                    case "owner":
                      value = p.owner?.name ?? p.owner;
                      break;

                    case "description":
                    case "name":
                      value = p[col];
                      break;

                    default:
                      value = p[col] ?? p.extraFields?.[col] ?? "";
                  }

                  const isString = typeof value === "string";
                  const maxLength = 25;
                  const truncated =
                    isString && value.length > maxLength
                      ? value.slice(0, maxLength) + "…"
                      : value;

                  return (
                    <td
                      key={idx}
                      className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap"
                    >
                      {col === "categories" ? (
                        value
                      ) : isString ? (
                        <span
                          className={`truncate cursor-pointer ${col === "name" ? "font-semibold text-slate-800 hover:text-indigo-600 transition" : ""}`}
                          title={value}
                          onClick={
                            col === "name" || col === "description"
                              ? () => handlePreview(p._id)
                              : undefined
                          }
                        >
                          {truncated}
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}

              <td className="px-5 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    disabled={user.id !== p.owner._id && !isAdmin}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handlePreview(p._id)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={user.id !== p.owner._id && !isAdmin}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>

                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8 bg-slate-50 ml-1">
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          p._id,
                          (cartQuantities[p._id] || 0) - 1,
                          p,
                        )
                      }
                      className="px-2.5 hover:bg-slate-200 text-slate-500 h-full transition disabled:opacity-40 disabled:pointer-events-none"
                      disabled={(cartQuantities[p._id] || 0) <= 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={getAvailableStockForProduct(p)}
                      value={cartQuantities[p._id] || 0}
                      onChange={(e) =>
                        handleQuantityChange(p._id, e.target.value, p)
                      }
                      className="w-10 text-center bg-transparent border-0 outline-none focus:ring-0 text-xs font-bold text-slate-800"
                    />
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          p._id,
                          (cartQuantities[p._id] || 0) + 1,
                          p,
                        )
                      }
                      className="px-2.5 hover:bg-slate-200 text-slate-500 h-full transition disabled:opacity-40 disabled:pointer-events-none"
                      disabled={
                        (cartQuantities[p._id] || 0) >=
                        getAvailableStockForProduct(p)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </td>

              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-100 text-center">
                    Available: {getAvailableStockForProduct(p)}
                  </span>
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100 text-center">
                    In cart: {cartQuantities[p._id] || 0}
                  </span>
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

import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Edit2, Eye, Trash2, Plus, Minus, User, Package, ShoppingCart } from "lucide-react";

const ProductsMobileCards = ({
  paginatedProducts,
  cartQuantities,
  handleQuantityChange,
  getAvailableStockForProduct,
  handleEdit,
  handlePreview,
  handleDelete,
  user,
  isAdmin,
  selectedProductIds = [],
  handleToggleSelect,
}) => {
  const { t } = useLanguage();

  return (
    <div className="md:hidden flex flex-col gap-4">
      {paginatedProducts.map(product => (
        <div
          key={product._id}
          className="border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xs p-5 bg-white dark:bg-slate-900 flex flex-col gap-3.5 hover:shadow-sm cursor-pointer transition-all duration-200"
          onClick={(e) => {
            if (e.target.closest("button, select, input, option, a")) {
              return;
            }
            handlePreview(product._id);
          }}
        >
          {/* Name */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 min-w-0">
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">{t("products.columns.name")}:</span>
            <label 
              className="flex items-center gap-2 max-w-[65%] min-w-0 justify-end cursor-pointer select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selectedProductIds.includes(product._id)}
                onChange={() => handleToggleSelect(product._id)}
                className="w-3.5 h-3.5 rounded accent-indigo-650 cursor-pointer"
              />
              <span className="text-indigo-650 dark:text-indigo-400 font-bold truncate text-sm text-right" title={product.name}>
                {product.name}
              </span>
            </label>
          </div>

          {/* Description */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 min-w-0">
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">{t("products.columns.description")}:</span>
            <span className="text-slate-600 dark:text-slate-400 font-medium truncate text-xs max-w-[65%] text-right italic font-light" title={product.description}>
              {product.description || "—"}
            </span>
          </div>

          {/* Stock Total */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">{t("products.columns.total")}:</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 tabular-nums shadow-xs">
              {product.stockTotal ?? 0}
            </span>
          </div>

          {/* Stock For Rent */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">{t("products.columns.for rent")}:</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 tabular-nums shadow-xs">
              {product.stockForRent ?? 0}
            </span>
          </div>

          {/* Categories */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 min-w-0">
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">{t("products.columns.categories")}:</span>
            <div className="relative inline-block w-40 max-w-[60%]">
              <select
                className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                value={product.categories.length === 1 ? product.categories[0]?.name ?? "" : ""}
                onChange={(e) => e.preventDefault()}
                disabled={product.categories.length <= 1}
              >
                {product.categories.length === 0 && (
                  <option value="" disabled>-</option>
                )}
                {product.categories.length > 1 && (
                  <>
                    <option value="" disabled hidden>{t("products.columns.categories")}</option>
                    {product.categories.map((c, i) => (
                      <option key={i} value={c?.name ?? ""}>{c?.name}</option>
                    ))}
                  </>
                )}
                {product.categories.length === 1 && (
                  <option value={product.categories[0]?.name ?? ""}>{product.categories[0]?.name ?? "-"}</option>
                )}
              </select>

              {product.categories.length > 1 && (
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-[9px] select-none">
                  ▼
                </span>
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 min-w-0">
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">{t("products.columns.owner")}:</span>
            <div className="flex items-center gap-1.5 max-w-[65%] truncate">
              <div className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-2.5 h-2.5 text-slate-450 dark:text-slate-400" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{product.owner?.name ?? product.owner}</span>
            </div>
          </div>

          {/* Quantity controls */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-650 dark:text-indigo-400" />
              <span>{t("products.toCart") || "Do koszyka:"}</span>
            </div>
            <div className="flex border border-slate-200 dark:border-slate-800 rounded-full overflow-hidden h-10 w-full bg-slate-50/80 dark:bg-slate-950/80 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
              <button
                onClick={() =>
                  handleQuantityChange(product._id, (cartQuantities[product._id] || 0) - 1, product)
                }
                className="w-1/4 h-full bg-transparent hover:bg-slate-200 dark:hover:bg-slate-850 transition text-slate-500 dark:text-slate-400 text-base font-bold cursor-pointer flex items-center justify-center"
                disabled={(cartQuantities[product._id] || 0) <= 0}
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="0"
                max={getAvailableStockForProduct(product)}
                value={cartQuantities[product._id] || 0}
                onChange={(e) =>
                  handleQuantityChange(product._id, e.target.value, product)
                }
                className="min-w-20 flex-1 h-full text-center text-xs font-bold outline-none border-x border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 p-0"
              />

              <button
                onClick={() =>
                  handleQuantityChange(product._id, (cartQuantities[product._id] || 0) + 1, product)
                }
                className="w-1/4 h-full bg-transparent hover:bg-slate-200 dark:hover:bg-slate-850 transition text-slate-500 dark:text-slate-450 text-base font-bold cursor-pointer flex items-center justify-center"
                disabled={
                  (cartQuantities[product._id] || 0) >= getAvailableStockForProduct(product)
                }
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In cart / Available */}
          <div className="flex justify-between items-center mt-1">
            <span className="bg-slate-50 dark:bg-slate-850/40 text-slate-700 dark:text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800/60 shadow-xs">
              {t("products.available")}: {getAvailableStockForProduct(product)}
            </span>
            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-100/40 dark:border-emerald-900/20 shadow-xs">
              {t("cart.inCart")}: {cartQuantities[product._id] || 0}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => handleEdit(product)}
              disabled={user.id !== product.owner._id && !isAdmin}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35 rounded-xl text-xs font-semibold transition disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-650 disabled:border-transparent disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3 h-3" />
              {t("common.edit")}
            </button>
            <button
              onClick={() => handlePreview(product._id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700/60 text-slate-705 dark:text-slate-350 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Eye className="w-3 h-3" />
              {t("products.preview")}
            </button>
            <button
              onClick={() => handleDelete(product._id)}
              disabled={user.id !== product.owner._id && !isAdmin}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/15 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-105 dark:border-red-900/25 rounded-xl text-xs font-semibold transition disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              {t("common.delete")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsMobileCards;

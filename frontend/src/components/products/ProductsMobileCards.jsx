import React from "react";

const ProductsMobileCards = ({
  paginatedProducts,
  cartQuantities,
  handleQuantityChange,
  getAvailableStockForProduct,
  handleEdit,
  handlePreview,
  handleDelete,
  user,
  isAdmin
}) => {
  return (
    <div className="md:hidden flex flex-col gap-4">
      {paginatedProducts.map(product => (
        <div key={product._id} className="border border-slate-100 rounded-2xl shadow-sm p-5 bg-white flex flex-col gap-3 hover:shadow-md transition">
          {/* Name */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Name:</span>
            <span
              className="text-indigo-600 font-semibold truncate cursor-pointer hover:text-indigo-700 transition text-sm"
              onClick={() => handlePreview(product._id)}
            >
              {product.name}
            </span>
          </div>

          {/* Description */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Description:</span>
            <span
              className="text-slate-600 truncate cursor-pointer hover:text-slate-800 transition text-sm"
              onClick={() => handlePreview(product._id)}
              title={product.description}
            >
              {product.description?.length > 50 ? product.description.slice(0, 30) + "…" : product.description}
            </span>
          </div>

          {/* Stock Total */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Total:</span>
            <span className="text-slate-800 font-medium text-sm">{product.stockTotal ?? 0}</span>
          </div>

          {/* Stock For Rent */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">For rent:</span>
            <span className="text-slate-800 font-medium text-sm">{product.stockForRent ?? 0}</span>
          </div>

          {/* Categories */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Categories:</span>
            <div className="relative inline-block w-40">
              <select
                className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                value={product.categories.length === 1 ? product.categories[0]?.name ?? "" : ""}
                onChange={(e) => e.preventDefault()}
                disabled={product.categories.length <= 1}
              >
                {product.categories.length === 0 && (
                  <option value="" disabled>-</option>
                )}
                {product.categories.length > 1 && (
                  <>
                    <option value="" disabled hidden>Check Categories</option>
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
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] select-none">
                  ▼
                </span>
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Owner:</span>
            <span className="text-slate-800 font-medium text-sm">{product.owner?.name ?? product.owner}</span>
          </div>

          {/* Quantity controls */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden h-10 w-full bg-slate-50 mt-1">
            <button
              onClick={() =>
                handleQuantityChange(product._id, (cartQuantities[product._id] || 0) - 1, product)
              }
              className="w-1/4 h-full bg-transparent hover:bg-slate-200/50 transition text-slate-500 text-lg font-semibold disabled:opacity-40 disabled:pointer-events-none"
              disabled={(cartQuantities[product._id] || 0) <= 0}
            >
              −
            </button>

            <input
              type="number"
              min="0"
              max={getAvailableStockForProduct(product)}
              value={cartQuantities[product._id] || 0}
              onChange={(e) =>
                handleQuantityChange(product._id, e.target.value, product)
              }
              className="min-w-20 flex-1 h-full text-center text-sm font-bold outline-none border-x border-slate-200/60 bg-transparent text-slate-800"
            />

            <button
              onClick={() =>
                handleQuantityChange(product._id, (cartQuantities[product._id] || 0) + 1, product)
              }
              className="w-1/4 h-full bg-transparent hover:bg-slate-200/50 transition text-slate-500 text-lg font-semibold disabled:opacity-40 disabled:pointer-events-none"
              disabled={
                (cartQuantities[product._id] || 0) >= getAvailableStockForProduct(product)
              }
            >
              +
            </button>
          </div>

          {/* In cart / Available */}
          <div className="flex justify-between items-center mt-1">
            <span className="bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-100">
              Available: {getAvailableStockForProduct(product)}
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
              In cart: {cartQuantities[product._id] || 0}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => handleEdit(product)}
              disabled={user.id !== product.owner._id && !isAdmin}
              className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-center"
            >
              Edit
            </button>
            <button
              onClick={() => handlePreview(product._id)}
              className="flex-1 px-3 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-200 transition text-center"
            >
              Preview
            </button>
            <button
              onClick={() => handleDelete(product._id)}
              disabled={user.id !== product.owner._id && !isAdmin}
              className="flex-1 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold hover:bg-red-100 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed text-center"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsMobileCards;

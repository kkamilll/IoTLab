import React from "react";

const STATUS_COLORS = {
  changed:  "text-red-800 bg-red-50 border-red-200/50",
  pending:  "text-yellow-600 bg-yellow-50 border-yellow-200/50",
  approved: "text-lime-600 bg-lime-50 border-lime-200/50",
  prepared: "text-indigo-600 bg-indigo-50 border-indigo-200/50",
  rented:   "text-green-600 bg-green-50 border-green-200/50",
  returned: "text-blue-600 bg-blue-50 border-blue-200/50",
  rejected: "text-gray-600 bg-gray-50 border-gray-200/50",
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status] ?? "text-slate-700 bg-slate-50 border-slate-200"}`}>
    {status ?? "—"}
  </span>
);

const OrderItemDetails = ({ item, getStatusColor, expanded, setExpanded, orderId }) => {
  const toggleKey = `${orderId}-${item._id}`;
  return (
    <li className="text-gray-700 flex flex-col gap-1 pb-6 border-dashed border-b border-gray-200 last:border-0">
      <div className="flex items-center gap-2 flex-wrap text-slate-800 text-sm">
        <span className="text-slate-500">Name:</span>
        <span className="font-semibold">{item?.product?.name || "Deleted Product"}</span>
        {item?.product?.tags?.length > 0 && (
          <>
            <span className="text-slate-500">Tags:</span>
            <span>{item.product.tags.join(", ")}</span>
          </>
        )}
      </div>

      <button
        onClick={() => setExpanded((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
        className="inline-block mt-1 px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition w-fit"
      >
        {expanded[toggleKey] ? "Hide details" : "Show details"}
      </button>

      {expanded[toggleKey] && (
        <div className="space-y-3 mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500">Requested</p>
                <p className="text-slate-800 font-bold text-lg">{item?.requestedQuantity ?? "—"}</p>
              </div>
              {item?.assignedQuantity && item.status !== "pending" && (
                <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-500">Assigned</p>
                  <p className="text-indigo-800 font-bold text-lg">{item.assignedQuantity}</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
            <StatusBadge status={item?.status} />
          </div>
        </div>
      )}
    </li>
  );
};

const OrderGroupCard = ({
  order,
  group,
  expanded,
  setExpanded,
  canProcessOrder,
  canRejectOrder,
  canPrepareOrder,
  canRentOrder,
  canReturnOrder,
  canPrintOrder,
  handleOpenModal,
  handleRejectOrder,
  handlePrepareOrder,
  handleRentOrder,
  handleReturnOrder,
  downloadRentalAgreement,
}) => {
  const hasActions =
    !!group.status &&
    (canProcessOrder(group.status) ||
      canRejectOrder(group.status) ||
      canPrepareOrder(group.status) ||
      canRentOrder(group.status) ||
      canReturnOrder(group.status) ||
      canPrintOrder(group.status));

  return (
    <div className="mb-4 last:mb-0 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
      <div className="flex flex-col gap-1 mb-4">
        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
          Owner: {group.owner?.name || "Unknown"}
        </h4>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          <StatusBadge status={group.status} />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested</p>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            📅 {new Date(group.dates?.requestedStartDate).toLocaleDateString("pl-PL")} →{" "}
            {new Date(group.dates?.requestedEndDate).toLocaleDateString("pl-PL")}
          </p>
        </div>
        {group.hasAssignedDates && (
          <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-3 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Assigned</p>
            <p className="text-xs font-semibold text-indigo-700 mt-1">
              📅 {new Date(group.dates?.assignedStartDate).toLocaleDateString("pl-PL")} →{" "}
              {new Date(group.dates?.assignedEndDate).toLocaleDateString("pl-PL")}
            </p>
          </div>
        )}
      </div>

      {group.ownerData?.customerApproval != null && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${group.ownerData.customerApproval ? "bg-green-50 text-green-700 border-green-200/50" : "bg-red-50 text-red-700 border-red-200/50"}`}>
            {group.ownerData.customerApproval ? "Customer Approved changes" : "Customer Rejected changes"}
          </span>
        </div>
      )}

      {/* Items */}
      {group.items.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="font-bold text-xs text-slate-400 uppercase tracking-wider">Items:</p>
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <ul className="space-y-4">
              {group.items.map((item, i) => (
                <OrderItemDetails
                  key={i}
                  item={item}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  orderId={order._id}
                />
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      {hasActions && (
        <div className="border-t border-slate-100 pt-3">
          <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Actions:</p>
          <div className="flex flex-wrap gap-2">
            {canProcessOrder(group.status) && (
              <button onClick={() => handleOpenModal(group)} className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition">
                Process
              </button>
            )}
            {canRejectOrder(group.status) && (
              <button onClick={() => handleRejectOrder(group)} className="px-4 py-2 text-xs font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl transition">
                Reject
              </button>
            )}
            {canPrepareOrder(group.status) && (
              <button onClick={() => handlePrepareOrder(group)} className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition">
                Prepare
              </button>
            )}
            {canRentOrder(group.status) && (
              <button onClick={() => handleRentOrder(group)} className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition">
                Rent
              </button>
            )}
            {canReturnOrder(group.status) && (
              <button onClick={() => handleReturnOrder(group)} className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition">
                Return
              </button>
            )}
            {canPrintOrder(group.status) && (
              <button onClick={() => downloadRentalAgreement(group)} className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm transition">
                PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderGroupCard;

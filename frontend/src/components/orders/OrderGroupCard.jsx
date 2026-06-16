import React, { useState } from "react";
import Btn from "../layout/Btn";

const STATUS_COLORS = {
  changed:  "text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200/50 dark:border-red-900/30",
  pending:  "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200/50 dark:border-yellow-900/30",
  approved: "text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/40 border-lime-200/50 dark:border-lime-900/30",
  prepared: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/50 dark:border-indigo-900/30",
  rented:   "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border-green-200/50 dark:border-green-900/30",
  returned: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-900/30",
  rejected: "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50",
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status] ?? "text-slate-700 bg-slate-50 border-slate-200"}`}>
    {status ?? "—"}
  </span>
);

const OrderItemDetails = ({ item, expanded, setExpanded, orderId }) => {
  const toggleKey = `${orderId}-${item._id}`;
  return (
    <li className="flex flex-col gap-1 py-3 border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {item?.product?.name || "Deleted Product"}
          </span>
          {item?.product?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.product.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={item?.status} />
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition cursor-pointer"
          >
            {expanded[toggleKey] ? "▲ Less" : "▼ More"}
          </button>
        </div>
      </div>

      {expanded[toggleKey] && (
        <div className="mt-2 bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Requested</p>
              <p className="text-slate-800 dark:text-slate-200 font-bold text-lg">{item?.requestedQuantity ?? "—"}</p>
            </div>
            {item?.assignedQuantity && item.status !== "pending" && (
              <div className="flex-1 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-3 text-center">
                <p className="text-xs text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">Assigned</p>
                <p className="text-indigo-800 dark:text-indigo-200 font-bold text-lg">{item.assignedQuantity}</p>
              </div>
            )}
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
  const [isCollapsed, setIsCollapsed] = useState(true);

  const hasActions =
    !!group.status &&
    (canProcessOrder(group.status) ||
      canRejectOrder(group.status) ||
      canPrepareOrder(group.status) ||
      canRentOrder(group.status) ||
      canReturnOrder(group.status) ||
      canPrintOrder(group.status));

  return (
    <div className="mb-3 last:mb-0 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/30">
      {/* Compact header – always visible */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition cursor-pointer text-left"
        onClick={() => setIsCollapsed((v) => !v)}
        aria-expanded={!isCollapsed}
      >
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
            {group.owner?.name || "Unknown"}
          </span>
          <StatusBadge status={group.status} />
          {group.ownerData?.customerApproval != null && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
              group.ownerData.customerApproval
                ? "bg-green-50 dark:bg-green-950/25 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30"
                : "bg-red-50 dark:bg-red-950/25 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30"
            }`}>
              {group.ownerData.customerApproval ? "✓ Approved" : "✗ Rejected"}
            </span>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto shrink-0">
            {group.items.length} item{group.items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span className={`text-slate-400 dark:text-slate-500 text-xs transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}>▼</span>
      </button>

      {/* Expanded body */}
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 mb-3">
            <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Requested</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-1">
                📅 {new Date(group.dates?.requestedStartDate).toLocaleDateString("pl-PL")} →{" "}
                {new Date(group.dates?.requestedEndDate).toLocaleDateString("pl-PL")}
              </p>
            </div>
            {group.hasAssignedDates && (
              <div className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Assigned</p>
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mt-1">
                  📅 {new Date(group.dates?.assignedStartDate).toLocaleDateString("pl-PL")} →{" "}
                  {new Date(group.dates?.assignedEndDate).toLocaleDateString("pl-PL")}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          {group.items.length > 0 && (
            <div className="mb-3">
              <p className="font-bold text-xs text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2">Items</p>
              <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 shadow-sm">
                <ul>
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
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex flex-wrap gap-2">
                {canProcessOrder(group.status) && (
                  <Btn onClick={() => handleOpenModal(group)} variant="warning" size="sm">
                    Process
                  </Btn>
                )}
                {canRejectOrder(group.status) && (
                  <Btn onClick={() => handleRejectOrder(group)} variant="danger-outline" size="sm">
                    Reject
                  </Btn>
                )}
                {canPrepareOrder(group.status) && (
                  <Btn onClick={() => handlePrepareOrder(group)} variant="primary" size="sm">
                    Prepare
                  </Btn>
                )}
                {canRentOrder(group.status) && (
                  <Btn onClick={() => handleRentOrder(group)} variant="success" size="sm">
                    Rent
                  </Btn>
                )}
                {canReturnOrder(group.status) && (
                  <Btn onClick={() => handleReturnOrder(group)} variant="sky" size="sm">
                    Return
                  </Btn>
                )}
                {canPrintOrder(group.status) && (
                  <Btn onClick={() => downloadRentalAgreement(group)} variant="dark" size="sm">
                    PDF
                  </Btn>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderGroupCard;

import React, { useState } from "react";
import Btn from "../layout/Btn";
import ConfirmDialog from "../layout/ConfirmDialog";
import { useLanguage } from "../../context/LanguageContext";
import {
  User,
  Calendar,
  ChevronDown,
  Info,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Package,
  Settings,
} from "lucide-react";

const STATUS_COLORS = {
  changed:  "text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200/50 dark:border-red-900/30",
  pending:  "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/50 dark:border-yellow-900/25",
  approved: "text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/20 border-lime-200/50 dark:border-lime-900/25",
  prepared: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/50 dark:border-indigo-900/30",
  rented:   "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 border-green-200/50 dark:border-green-900/25",
  returned: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/25",
  rejected: "text-gray-705 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50",
};

export const StatusBadge = ({ status }) => {
  const { t } = useLanguage();
  const getStatusIcon = (s) => {
    switch (s) {
      case "pending":
        return <Clock className="w-3.5 h-3.5 flex-shrink-0" />;
      case "approved":
      case "rented":
      case "returned":
        return <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />;
      case "rejected":
        return <XCircle className="w-3.5 h-3.5 flex-shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 flex-shrink-0" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[status] ?? "text-slate-700 bg-slate-50 border-slate-200"}`}>
      {getStatusIcon(status)}
      <span>{t(`statuses.${status}`) || status}</span>
    </span>
  );
};

const OrderItemDetails = ({ item, expanded, setExpanded, orderId }) => {
  const { language } = useLanguage();
  const toggleKey = `${orderId}-${item._id}`;
  const isItemExpanded = expanded[toggleKey];

  return (
    <li 
      onClick={(e) => {
        // Prevent toggle if they clicked on the status badge or other buttons
        if (e.target.closest("button, select, input, a, span.inline-flex")) return;
        setExpanded((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }));
      }}
      className="flex flex-col gap-1 py-3.5 border-b border-dashed border-slate-200/50 dark:border-slate-800/65 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/35 transition-colors px-2 -mx-2 rounded-xl cursor-pointer select-none"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap w-full">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[150px]">
          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm break-words">
            {item?.product?.name || "Deleted Product"}
          </span>
          {item?.product?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.product.tags.map((tag, i) => (
                <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200/30">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={item?.status} />
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }))}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer shadow-xs border-solid ${
              isItemExpanded
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/25"
                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {isItemExpanded ? (
              <>
                <span>{language === "pl" ? "Zwiń" : "Less"}</span>
                <ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform duration-200" />
              </>
            ) : (
              <>
                <span>{language === "pl" ? "Rozwiń" : "More"}</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
              </>
            )}
          </button>
        </div>
      </div>

      {isItemExpanded && (
        <div className="mt-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-850 flex gap-3.5">
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">{language === "pl" ? "Wnioskowane" : "Requested"}</p>
            <p className="text-slate-850 dark:text-slate-100 font-black text-xl mt-1">{item?.requestedQuantity ?? "—"}</p>
          </div>
          {item?.assignedQuantity && item.status !== "pending" && (
            <div className="flex-1 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/20 rounded-xl p-3 text-center shadow-xs">
              <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{language === "pl" ? "Przydzielone" : "Assigned"}</p>
              <p className="text-indigo-700 dark:text-indigo-300 font-black text-xl mt-1">{item.assignedQuantity}</p>
            </div>
          )}
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
  isCollapsed: propCollapsed,
  onToggleCollapse,
}) => {
  const [localCollapsed, setLocalCollapsed] = useState(true);
  const isCollapsed = propCollapsed !== undefined ? propCollapsed : localCollapsed;
  const handleToggle = onToggleCollapse || (() => setLocalCollapsed(!localCollapsed));
  const { t, language } = useLanguage();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "danger",
    onConfirm: null,
  });

  const openConfirm = ({ title, message, variant = "danger", onConfirm }) => {
    setConfirmDialog({ open: true, title, message, variant, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const hasActions =
    !!group.status &&
    (canProcessOrder(group.status) ||
      canRejectOrder(group.status) ||
      canPrepareOrder(group.status) ||
      canRentOrder(group.status) ||
      canReturnOrder(group.status) ||
      canPrintOrder(group.status));

  return (
    <div className="mb-4 last:mb-0 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/45 dark:bg-slate-950/30 hover:border-slate-300/80 dark:hover:border-slate-700/60 transition-all duration-200">
      {/* Compact header – always visible */}
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left border-0 bg-transparent rounded-t-2xl"
        onClick={handleToggle}
        aria-expanded={!isCollapsed}
      >
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2.5 shrink-0">
            <User className="w-4 h-4 text-indigo-500/80 dark:text-indigo-400" />
            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35">
              {language === "pl" ? "Opiekun" : "Supervisor"}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-850 dark:text-slate-200 tracking-wide">
              {group.owner?.name || "Unknown"}
            </span>
          </div>

          <StatusBadge status={group.status} />

          {group.ownerData?.customerApproval != null && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border border-solid ${
              group.ownerData.customerApproval
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-200/40 dark:border-emerald-900/20 shadow-xs"
                : "bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-200/40 dark:border-rose-900/20 shadow-xs"
            }`}>
              {group.ownerData.customerApproval ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === "pl" ? "Zatwierdzone" : "Approved"}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{language === "pl" ? "Odrzucone" : "Rejected"}</span>
                </>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-sans">
            {group.items.length} {language === "pl" ? (group.items.length === 1 ? "przedmiot" : "przedmioty/ów") : `item${group.items.length !== 1 ? "s" : ""}`}
          </span>
          <ChevronDown className={`text-slate-400 dark:text-slate-555 w-4 h-4 transition-transform duration-250 ${isCollapsed ? "" : "rotate-180"}`} />
        </div>
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-850/80 bg-slate-100/10 dark:bg-slate-950/10">
          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 mb-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/85 rounded-xl p-3.5 shadow-xs flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-550">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">{language === "pl" ? "Wnioskowane daty" : "Requested Dates"}</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-305 mt-1">
                  {new Date(group.dates?.requestedStartDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} →{" "}
                  {new Date(group.dates?.requestedEndDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>
            {group.hasAssignedDates && (
              <div className="bg-indigo-50/20 dark:bg-indigo-950/15 border border-indigo-100/40 dark:border-indigo-900/20 rounded-xl p-3.5 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100/40 dark:bg-indigo-950 text-indigo-500 dark:text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{language === "pl" ? "Przydzielone daty" : "Assigned Dates"}</p>
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-305 mt-1">
                    {new Date(group.dates?.assignedStartDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} →{" "}
                    {new Date(group.dates?.assignedEndDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          {group.items.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                  <Package className="w-3.5 h-3.5" />
                </span>
                <p className="font-extrabold text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                  {language === "pl" ? "Przedmioty" : "Items"}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 shadow-xs">
                <ul className="list-none p-0 m-0">
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
            <div className="border-t border-slate-100/80 dark:border-slate-850/80 pt-3.5 mt-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                  <Settings className="w-3.5 h-3.5" />
                </span>
                <p className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {language === "pl" ? "Dostępne akcje" : "Actions"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 w-full">
                {canProcessOrder(group.status) && (
                  <Btn onClick={() => handleOpenModal(group)} variant="warning" className="flex-1 min-w-[120px] sm:flex-initial">
                    {language === "pl" ? "Procesuj" : "Process"}
                  </Btn>
                )}
                {canRejectOrder(group.status) && (
                  <Btn
                    onClick={() =>
                      openConfirm({
                        title: language === "pl" ? "Odrzuć zamówienie?" : "Reject order?",
                        message: language === "pl"
                          ? "Czy na pewno chcesz odrzucić to zamówienie? Tej operacji nie można cofnąć."
                          : "Are you sure you want to reject this order? This action cannot be undone.",
                        variant: "danger",
                        onConfirm: () => { closeConfirm(); handleRejectOrder(group); },
                      })
                    }
                    variant="danger-outline"
                    className="flex-1 min-w-[120px] sm:flex-initial"
                  >
                    {language === "pl" ? "Odrzuć" : "Reject"}
                  </Btn>
                )}
                {canPrepareOrder(group.status) && (
                  <Btn
                    onClick={() =>
                      openConfirm({
                        title: language === "pl" ? "Przygotuj zamówienie?" : "Prepare order?",
                        message: language === "pl"
                          ? "Czy na pewno chcesz oznaczyć to zamówienie jako przygotowane?"
                          : "Are you sure you want to mark this order as prepared?",
                        variant: "info",
                        onConfirm: () => { closeConfirm(); handlePrepareOrder(group); },
                      })
                    }
                    variant="primary"
                    className="flex-1 min-w-[120px] sm:flex-initial"
                  >
                    {language === "pl" ? "Przygotuj" : "Prepare"}
                  </Btn>
                )}
                {canRentOrder(group.status) && (
                  <Btn
                    onClick={() =>
                      openConfirm({
                        title: language === "pl" ? "Wypożycz sprzęt?" : "Rent equipment?",
                        message: language === "pl"
                          ? "Czy na pewno chcesz wydać sprzęt i zmienić status na 'Wypożyczone'?"
                          : "Are you sure you want to hand out the equipment and set status to 'Rented'?",
                        variant: "warning",
                        onConfirm: () => { closeConfirm(); handleRentOrder(group); },
                      })
                    }
                    variant="success"
                    className="flex-1 min-w-[120px] sm:flex-initial"
                  >
                    {language === "pl" ? "Wypożycz" : "Rent"}
                  </Btn>
                )}
                {canReturnOrder(group.status) && (
                  <Btn
                    onClick={() =>
                      openConfirm({
                        title: language === "pl" ? "Potwierdź zwrot?" : "Confirm return?",
                        message: language === "pl"
                          ? "Czy na pewno chcesz potwierdzić zwrot sprzętu?"
                          : "Are you sure you want to confirm the equipment return?",
                        variant: "info",
                        onConfirm: () => { closeConfirm(); handleReturnOrder(group); },
                      })
                    }
                    variant="sky"
                    className="flex-1 min-w-[120px] sm:flex-initial"
                  >
                    {language === "pl" ? "Zwróć" : "Return"}
                  </Btn>
                )}
                {canPrintOrder(group.status) && (
                  <Btn onClick={() => downloadRentalAgreement(group)} variant="dark" className="flex-1 min-w-[120px] sm:flex-initial flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </Btn>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default OrderGroupCard;

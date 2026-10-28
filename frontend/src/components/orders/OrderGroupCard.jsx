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
  AlertCircle,
  Check,
  X,
  Sliders,
  RotateCcw,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

const STATUS_COLORS = {
  changed:  "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/30",
  late:     "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200/50 dark:border-red-900/30",
  pending:  "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/50 dark:border-yellow-900/25",
  approved: "text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/20 border-lime-200/50 dark:border-lime-900/25",
  prepared: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/50 dark:border-indigo-900/30",
  rented:   "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 border-green-200/50 dark:border-green-900/25",
  returned: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/25",
  rejected: "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50",
};

export const StatusBadge = ({ status }) => {
  const { t } = useLanguage();
  const getStatusIcon = (s) => {
    switch (s) {
      case "late":
        return <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />;
      case "pending":
        return <Clock className="w-3.5 h-3.5 flex-shrink-0" />;
      case "prepared":
        return <Package className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />;
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

const OrderGroupCard = ({
  group,
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
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isCollapsed = propCollapsed !== undefined ? propCollapsed : localCollapsed;
  const handleToggle = onToggleCollapse || (() => setLocalCollapsed(!localCollapsed));
  const { language } = useLanguage();

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

  const assignStart = group.dates?.assignedStartDate ? new Date(group.dates.assignedStartDate).toLocaleDateString("pl-PL") : null;
  const assignEnd = group.dates?.assignedEndDate ? new Date(group.dates.assignedEndDate).toLocaleDateString("pl-PL") : null;

  return (
    <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/90 shadow-2xs mb-3 last:mb-0">
      {/* Supervisor Header Strip */}
      <div
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2.5">
          {/* Supervisor Avatar & Name */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
              {group.owner?.profileImage ? (
                <img
                  src={`${API_BASE}/uploads/users/${group.owner.profileImage}`}
                  alt={group.owner?.name || "Supervisor"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35">
              {language === "pl" ? "Opiekun" : "Supervisor"}
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-850 dark:text-slate-100 truncate">
              {group.owner?.name || "Unknown"}
            </span>
          </div>

          <StatusBadge status={group.status} />

          {/* Assigned dates indicator if different */}
          {group.hasAssignedDates && assignStart && assignEnd && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-900/30">
              <Calendar className="w-3 h-3 text-indigo-500" />
              <span>{assignStart} → {assignEnd}</span>
            </span>
          )}

          {group.ownerData?.customerApproval != null && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
              group.ownerData.customerApproval
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50"
                : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/50"
            }`}>
              {group.ownerData.customerApproval ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>{language === "pl" ? "Student zatwierdził" : "Student approved"}</span>
                </>
              ) : (
                <>
                  <X className="w-3 h-3 text-rose-500" />
                  <span>{language === "pl" ? "Student odrzucił" : "Student rejected"}</span>
                </>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {group.items.length} {language === "pl" ? (group.items.length === 1 ? "przedmiot" : "przedmioty") : "items"}
          </span>
          <ChevronDown className={`text-slate-400 w-4 h-4 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`} />
        </div>
      </div>

      {/* Expanded Content: Items Table + Action Buttons */}
      {!isCollapsed && (
        <div className="p-4 flex flex-col gap-3.5 bg-white dark:bg-slate-900">
          {/* Mobile Items View (sm:hidden) */}
          {group.items.length > 0 && (
            <div className="flex flex-col gap-2.5 sm:hidden">
              {group.items.map((item, i) => {
                const imgSrc = item?.product?.image
                  ? (item.product.image.startsWith("http")
                      ? item.product.image
                      : `${API_BASE}/uploads/products/${item.product.image}`)
                  : null;

                return (
                  <div
                    key={item._id || i}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={item?.product?.name || "Product"}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
                          {item?.product?.name || (language === "pl" ? "Usunięty produkt" : "Deleted product")}
                        </p>
                        {item?.product?.category?.name && (
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                            {item.product.category.name}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>{language === "pl" ? "Wnioskowane:" : "Req:"}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800">
                          {item.requestedQuantity ?? 1} {language === "pl" ? "szt." : "pcs"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>{language === "pl" ? "Przydzielone:" : "Assigned:"}</span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                          (item.assignedQuantity ?? item.requestedQuantity ?? 1) > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30"
                            : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {item.assignedQuantity ?? item.requestedQuantity ?? 1} {language === "pl" ? "szt." : "pcs"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop Items Table (hidden sm:block) */}
          {group.items.length > 0 && (
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/70 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4 w-5/12">{language === "pl" ? "Sprzęt / Przedmiot" : "Equipment / Item"}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">{language === "pl" ? "Wnioskowane" : "Requested"}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">{language === "pl" ? "Przydzielone" : "Assigned"}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {group.items.map((item, i) => {
                    const imgSrc = item?.product?.image
                      ? (item.product.image.startsWith("http")
                          ? item.product.image
                          : `${API_BASE}/uploads/products/${item.product.image}`)
                      : null;

                    return (
                      <tr key={item._id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-2.5 px-4 w-5/12">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
                              {imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={item?.product?.name || "Product"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                                {item?.product?.name || (language === "pl" ? "Usunięty produkt" : "Deleted product")}
                              </p>
                              {item?.product?.category?.name && (
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                                  {item.product.category.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                            {item.requestedQuantity ?? 1} {language === "pl" ? "szt." : "pcs"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs ${
                            (item.assignedQuantity ?? item.requestedQuantity ?? 1) > 0
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {item.assignedQuantity ?? item.requestedQuantity ?? 1} {language === "pl" ? "szt." : "pcs"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions Bar */}
          {hasActions && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === "pl" ? "Dostępne akcje:" : "Actions:"}</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {canProcessOrder(group.status) && (
                  <Btn onClick={() => handleOpenModal(group)} variant="warning" className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{language === "pl" ? "Procesuj" : "Process"}</span>
                  </Btn>
                )}
                {canPrepareOrder(group.status) && (
                  <Btn
                    onClick={() =>
                      openConfirm({
                        title: language === "pl" ? "Przygotuj zamówienie?" : "Prepare order?",
                        message: language === "pl"
                          ? "Czy na pewno chcesz oznaczyć to zamówienie jako przygotowane do odbioru?"
                          : "Are you sure you want to mark this order as prepared for pickup?",
                        variant: "info",
                        onConfirm: () => { closeConfirm(); handlePrepareOrder(group); },
                      })
                    }
                    variant="primary"
                    className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{language === "pl" ? "Przygotuj" : "Prepare"}</span>
                  </Btn>
                )}
                {canRentOrder(group.status) && (
                  <Btn
                    onClick={() =>
                      openConfirm({
                        title: language === "pl" ? "Wydaj sprzęt (Wypożycz)?" : "Rent equipment?",
                        message: language === "pl"
                          ? "Czy na pewno chcesz wydać sprzęt i zmienić status na 'Wypożyczone'?"
                          : "Are you sure you want to hand out the equipment and set status to 'Rented'?",
                        variant: "warning",
                        onConfirm: () => { closeConfirm(); handleRentOrder(group); },
                      })
                    }
                    variant="success"
                    className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{language === "pl" ? "Wypożycz" : "Rent"}</span>
                  </Btn>
                )}
                {canReturnOrder(group.status) && (
                  <Btn
                    onClick={() =>
                      openConfirm({
                        title: language === "pl" ? "Potwierdź zwrot?" : "Confirm return?",
                        message: language === "pl"
                          ? "Czy na pewno chcesz potwierdzić zwrot sprzętu do magazynu?"
                          : "Are you sure you want to confirm equipment return to stock?",
                        variant: "info",
                        onConfirm: () => { closeConfirm(); handleReturnOrder(group); },
                      })
                    }
                    variant="sky"
                    className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === "pl" ? "Zwróć" : "Return"}</span>
                  </Btn>
                )}
                {canPrintOrder(group.status) && (
                  <Btn onClick={() => downloadRentalAgreement(group)} variant="dark" className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
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
                    className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{language === "pl" ? "Odrzuć" : "Reject"}</span>
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

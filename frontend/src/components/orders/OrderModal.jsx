import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { StatusBadge } from "./OrderGroupCard";
import {
  X,
  Calendar,
  Layers,
  AlertTriangle,
  User,
  Package,
  Sliders,
  Check,
  Clock,
  Archive,
  ChevronDown,
  Key,
  Copy,
} from "lucide-react";

const toDateInputString = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const OrderModal = ({
  handleCloseModal,
  editGroup,
  datesUpdateData,
  setDatesUpdateData,
  processableStatuses,
  currentItemId,
  setCurrentItemId,
  itemsUpdateData,
  handleSubmit,
  handleEditChange,
  handleStatusChange,
  stockStatus,
  highestPriorityGroupStatus,
  getAllowedStatusChanges,
  validationError,
  setValidationError,
}) => {
  const { t, language } = useLanguage();

  const handleStartDateChange = (e) => {
    if (setValidationError) setValidationError("");
    const val = e.target.value;
    if (!val) {
      setDatesUpdateData((prev) => ({ ...prev, assignedStartDate: null }));
      return;
    }
    const d = new Date(val);
    d.setHours(0, 0, 0, 0);
    setDatesUpdateData((prev) => ({
      ...prev,
      assignedStartDate: d.toISOString(),
    }));
  };

  const handleEndDateChange = (e) => {
    if (setValidationError) setValidationError("");
    const val = e.target.value;
    if (!val) {
      setDatesUpdateData((prev) => ({ ...prev, assignedEndDate: null }));
      return;
    }
    const d = new Date(val);
    d.setHours(23, 59, 59, 999);
    setDatesUpdateData((prev) => ({
      ...prev,
      assignedEndDate: d.toISOString(),
    }));
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const isProcessable = processableStatuses.includes(editGroup?.status);
  const reqStart = datesUpdateData?.requestedStartDate
    ? new Date(datesUpdateData.requestedStartDate).toLocaleDateString("pl-PL")
    : "—";
  const reqEnd = datesUpdateData?.requestedEndDate
    ? new Date(datesUpdateData.requestedEndDate).toLocaleDateString("pl-PL")
    : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl lg:max-w-2xl mx-auto max-h-[92vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 flex-shrink-0 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-900/40">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === "pl" ? "Procesowanie grupy" : "Process Group"}</span>
              </span>
              <StatusBadge status={editGroup?.status} />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === "pl" ? "Aktualizuj zamówienie" : "Update Order"}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="opacity-70">{language === "pl" ? "Opiekun:" : "Owner:"}</span>
                <span className="font-bold">{editGroup?.owner?.name || "—"}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-900/30">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span className="opacity-70">{language === "pl" ? "Student:" : "Student:"}</span>
                <span className="font-bold">
                  {editGroup?.customerInfo?.firstName && editGroup?.customerInfo?.lastName
                    ? `${editGroup.customerInfo.firstName} ${editGroup.customerInfo.lastName}`
                    : editGroup?.customerInfo?.email || "—"}
                </span>
              </span>

              {editGroup?.accessCode && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60 dark:border-amber-900/40 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
                  onClick={() => navigator.clipboard.writeText(editGroup.accessCode)}
                  title={language === "pl" ? "Kliknij, aby skopiować kod studenta" : "Click to copy student code"}
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span className="opacity-70">{language === "pl" ? "Kod studenta:" : "Access Code:"}</span>
                  <span className="font-mono font-extrabold">{editGroup.accessCode}</span>
                  <Copy className="w-3 h-3 opacity-60 ml-0.5" />
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title={language === "pl" ? "Zamknij" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Validation Error Banner */}
          {validationError && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-2xl p-4 text-xs font-bold shadow-xs flex items-center gap-3 animate-in shake duration-200">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Dates Card */}
          <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/80">
              <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{language === "pl" ? "Termin wypożyczenia" : "Rental Period"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-800">
                <span className="opacity-70">{language === "pl" ? "Wnioskowano:" : "Requested:"}</span>
                <span className="font-bold">{reqStart} → {reqEnd}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                  {language === "pl" ? "Data rozpoczęcia:" : "Start Date:"}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDateInputString(datesUpdateData.assignedStartDate)}
                    onChange={handleStartDateChange}
                    min={todayStr}
                    max={toDateInputString(datesUpdateData.assignedEndDate)}
                    disabled={!isProcessable}
                    className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                  {language === "pl" ? "Data zakończenia:" : "End Date:"}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDateInputString(datesUpdateData.assignedEndDate)}
                    onChange={handleEndDateChange}
                    min={toDateInputString(datesUpdateData.assignedStartDate) || todayStr}
                    disabled={!isProcessable}
                    className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Item Selector Tabs (if multiple items in group) */}
          {editGroup.items.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                {language === "pl" ? "Wybierz pozycję do edycji:" : "Select item to edit:"}
              </span>
              <div className="flex flex-wrap gap-2 pb-1">
                {editGroup.items.map((item) => {
                  const isSelected = currentItemId === item._id;
                  const itemUpdate = itemsUpdateData[item._id];
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        if (setValidationError) setValidationError("");
                        setCurrentItemId(item._id);
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-2xs ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-600 text-white shadow-indigo-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">
                        {item.product?.name || (language === "pl" ? "Usunięty produkt" : "Deleted")}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {itemUpdate?.assignedQuantity ?? item.requestedQuantity} szt.
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current item edit form */}
          {currentItemId && itemsUpdateData[currentItemId] && (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {(() => {
                const itemData = itemsUpdateData[currentItemId];

                return (
                  <>
                    {/* Item Heading Card */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          {language === "pl" ? "Edytowany przedmiot" : "Selected Product"}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                          {itemData?.product?.name || (language === "pl" ? "Usunięty produkt" : "Deleted product")}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="opacity-70">{language === "pl" ? "Wnioskowano:" : "Requested:"}</span>
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                            {itemData.requestedQuantity} {language === "pl" ? "szt." : "pcs"}
                          </span>
                        </span>
                        <StatusBadge status={itemData.prevStatus} />
                      </div>
                    </div>

                    {/* Stock & Demand Overview (when loaded) */}
                    {stockStatus && processableStatuses.includes(itemData.prevStatus) && stockStatus[currentItemId] && (
                      <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
                        <p className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/80">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span>{language === "pl" ? "Stany magazynowe i dostępność" : "Stock & Availability"}</span>
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Available to Assign */}
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-3 shadow-2xs">
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                              {language === "pl" ? "Dostępne do przydziału" : "Available to Assign"}
                            </span>
                            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 block mt-1">
                              {stockStatus[currentItemId].availableToAssign}
                            </span>
                          </div>

                          {/* Total Available Stock */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              {language === "pl" ? "Łącznie na stanie" : "Total Stock"}
                            </span>
                            <span className="text-2xl font-black text-slate-850 dark:text-slate-100 block mt-1">
                              {stockStatus[currentItemId].availableTotal}
                            </span>
                          </div>

                          {/* Rented Out */}
                          <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-950/30 dark:to-amber-900/10 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-3 shadow-2xs">
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                              {language === "pl" ? "Wypożyczone" : "Rented Out"}
                            </span>
                            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 block mt-1">
                              {stockStatus[currentItemId].rentedQuantity}
                            </span>
                          </div>

                          {/* Demand Overview */}
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 dark:from-indigo-950/30 dark:to-indigo-900/10 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl p-3 shadow-2xs">
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                              {language === "pl" ? "Zapotrzebowanie" : "In Demand"}
                            </span>
                            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 block mt-1">
                              {stockStatus[currentItemId].inDemand}{" "}
                              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                ({stockStatus[currentItemId].requestsQuantity} {language === "pl" ? "wn." : "req."})
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantity & Status Form Inputs Card */}
                    <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Assigned Quantity Input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                            {language === "pl" ? "Przydzielana ilość:" : "Assigned Quantity:"}
                          </label>
                          <input
                            type="number"
                            name="assignedQuantity"
                            value={itemData.assignedQuantity ?? 0}
                            min={1}
                            onChange={(e) => handleEditChange(currentItemId, e)}
                            disabled={
                              !processableStatuses.includes(itemData.prevStatus) ||
                              itemData.prevStatus !== highestPriorityGroupStatus ||
                              itemData.newStatus === "rejected" ||
                              !itemData?.product
                            }
                            className="w-full text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
                          />
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 pl-1">
                            {language === "pl" ? "Wnioskowano:" : "Requested:"} {itemData.requestedQuantity} {language === "pl" ? "szt." : "pcs"}
                          </span>
                        </div>

                        {/* Status Select */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                            {language === "pl" ? "Nowy status pozycji:" : "New Item Status:"}
                          </label>
                          <div className="relative">
                            <select
                              name="newStatus"
                              value={itemData.newStatus}
                              onChange={(e) => handleStatusChange(currentItemId, e)}
                              disabled={
                                !processableStatuses.includes(itemData.prevStatus) ||
                                itemData.prevStatus !== highestPriorityGroupStatus ||
                                !itemData?.product
                              }
                              className="w-full appearance-none text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                            >
                              <option value={itemData.prevStatus}>
                                {t(`statuses.${itemData.prevStatus}`) || itemData.prevStatus}
                              </option>
                              {getAllowedStatusChanges(itemData.prevStatus).map((status) => (
                                <option key={status} value={status}>
                                  {t(`statuses.${status}`) || status}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 pl-1">
                            {language === "pl" ? "Aktualny status:" : "Current status:"} {t(`statuses.${itemData.prevStatus}`) || itemData.prevStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Form actions footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  {language === "pl" ? "Anuluj" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-sm hover:shadow-indigo-500/25 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === "pl" ? "Zapisz zmiany" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;

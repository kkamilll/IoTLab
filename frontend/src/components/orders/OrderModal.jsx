import React from "react";
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { CheckCircle, AlertTriangle, Layers, Users, Calendar, Info, X } from "lucide-react";

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
  setValidationError
}) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-solid border-transparent dark:border-slate-800 shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto my-8 max-h-[90vh] flex flex-col overflow-hidden relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-6 pb-4 border-b border-solid border-slate-100 dark:border-slate-800 relative flex-shrink-0">
          <button 
            type="button"
            onClick={handleCloseModal}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={language === "pl" ? "Zamknij" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {language === "pl" ? "Aktualizuj zamówienie" : "Update Order"}
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {language === "pl" ? "Opiekun:" : "Owner:"}{" "}
            <span className="font-extrabold text-slate-850 dark:text-slate-200">{editGroup.owner?.name}</span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
            {language === "pl" ? "Student:" : "Student:"}{" "}
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
              {editGroup.customerInfo?.firstName && editGroup.customerInfo?.lastName 
                ? `${editGroup.customerInfo.firstName} ${editGroup.customerInfo.lastName}` 
                : editGroup.customerInfo?.email}
            </span>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 pt-4 overflow-y-auto flex-1">
          {/* Dates */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl mb-4">
            <p className="font-extrabold text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3">
              {language === "pl" ? "Daty zamówienia" : "Order Dates"}
            </p>
            <div className="flex flex-col gap-3">
              {/* Date Handler */}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                {/* Start Date */}
                <DateTimePicker
                  label={language === "pl" ? "Data rozpoczęcia" : "Start Date"}
                  value={datesUpdateData.assignedStartDate ? new Date(datesUpdateData.assignedStartDate) : null}
                  onChange={(newValue) => {
                    if (setValidationError) setValidationError("");
                    const isValid = newValue instanceof Date && !isNaN(newValue.getTime());
                    setDatesUpdateData(prev => ({
                      ...prev,
                      assignedStartDate: newValue && isValid ? newValue.toISOString() : null
                    }));
                  }}
                  ampm={false}
                  minDateTime={new Date()}
                  maxDateTime={datesUpdateData.assignedEndDate ? new Date(datesUpdateData.assignedEndDate) : null}
                  format="dd/MM/yyyy HH:mm"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className="w-full"
                      disabled={!processableStatuses.includes(editGroup.status)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "1rem",
                          backgroundColor: theme === "dark" ? "#090d16" : "#f8fafc",
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                          "& fieldset": {
                            borderColor: theme === "dark" ? "#1e293b" : "#cbd5e1",
                          },
                          "&:hover fieldset": {
                            borderColor: theme === "dark" ? "#6366f1" : "#3b82f6",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: theme === "dark" ? "#6366f1" : "#3b82f6",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                        },
                        "& .MuiSvgIcon-root": {
                          color: theme === "dark" ? "#94a3b8" : "#64748b",
                        }
                      }}
                    />
                  )}
                />

                {/* End Date */}
                <DateTimePicker
                  label={language === "pl" ? "Data zakończenia" : "End Date"}
                  value={datesUpdateData.assignedEndDate ? new Date(datesUpdateData.assignedEndDate) : null}
                  onChange={(newValue) => {
                    if (setValidationError) setValidationError("");
                    const isValid = newValue instanceof Date && !isNaN(newValue.getTime());
                    setDatesUpdateData(prev => ({
                      ...prev,
                      assignedEndDate: newValue && isValid ? newValue.toISOString() : null
                    }));
                  }}
                  ampm={false}
                  minDateTime={datesUpdateData.assignedStartDate ? new Date(datesUpdateData.assignedStartDate) : new Date()}
                  format="dd/MM/yyyy HH:mm"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className="w-full"
                      disabled={!processableStatuses.includes(editGroup.status)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "1rem",
                          backgroundColor: theme === "dark" ? "#090d16" : "#f8fafc",
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                          "& fieldset": {
                            borderColor: theme === "dark" ? "#1e293b" : "#cbd5e1",
                          },
                          "&:hover fieldset": {
                            borderColor: theme === "dark" ? "#6366f1" : "#3b82f6",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: theme === "dark" ? "#6366f1" : "#3b82f6",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: theme === "dark" ? "#f8fafc" : "#0f172a",
                        },
                        "& .MuiSvgIcon-root": {
                          color: theme === "dark" ? "#94a3b8" : "#64748b",
                        }
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </div>
          </div>

          {/* Item Selector Tabs (wrapping instead of scrollbar) */}
          <div className="flex flex-wrap gap-2 mb-5 pb-3 border-b border-solid border-slate-100 dark:border-slate-800">
            {editGroup.items.map((item) => {
              const isSelected = currentItemId === item._id;
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => {
                    if (setValidationError) setValidationError("");
                    setCurrentItemId(item._id);
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-xs border-solid ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-extrabold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.product?.name || "Deleted Product"}
                </button>
              );
            })}
          </div>

          {/* Current item form */}
          {currentItemId && itemsUpdateData[currentItemId] && (
            <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
              {validationError && (
                <div className="bg-red-50 dark:bg-red-950/15 border border-solid border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl p-4 text-xs font-bold shadow-xs flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
              {(() => {
                const itemData = itemsUpdateData[currentItemId];

                return (
                  <>
                    <div className="flex flex-col gap-2 p-1">
                      {/* Product Name */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
                          {language === "pl" ? "Nazwa produktu:" : "Product Name:"}
                        </span>
                        <span className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">{itemData?.product?.name || "Deleted Product"}</span>
                      </div>

                      {/* Tags */}
                      {itemData?.product?.tags?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            {language === "pl" ? "Tagi:" : "Tags:"}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {itemData.product.tags.map((tag, i) => (
                              <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Requested info summary */}
                    <div className="p-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl mb-1">
                      <p className="font-extrabold text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{language === "pl" ? "Informacje o rezerwacji" : "Requested Info"}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <p className="text-slate-400 dark:text-slate-550">{language === "pl" ? "Ilość" : "Quantity"}</p>
                        <p className="text-slate-800 dark:text-slate-200 font-extrabold">{itemData.requestedQuantity}</p>

                        <p className="text-slate-400 dark:text-slate-550">{language === "pl" ? "Data rozpoczęcia" : "Start Date"}</p>
                        <p className="text-slate-800 dark:text-slate-200 font-extrabold">
                          {new Date(datesUpdateData.requestedStartDate).toLocaleString("pl-PL")}
                        </p>

                        <p className="text-slate-400 dark:text-slate-550">{language === "pl" ? "Data zakończenia" : "End Date"}</p>
                        <p className="text-slate-800 dark:text-slate-200 font-extrabold">
                          {new Date(datesUpdateData.requestedEndDate).toLocaleString("pl-PL")}
                        </p>
                      </div>
                    </div>

                    {/* Stock Overview Cards Grid */}
                    {stockStatus && processableStatuses.includes(itemData.prevStatus) && stockStatus[currentItemId] && (
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl mb-1">
                        <p className="font-extrabold text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === "pl" ? "Status zapasów i zapotrzebowania" : "Stock & Demand Status"}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Available to Assign */}
                          <div className="bg-white dark:bg-slate-900 border border-solid border-emerald-250 dark:border-emerald-950 rounded-xl p-3 shadow-xs">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {language === "pl" ? "Dostępne do przypisania" : "Available to Assign"}
                            </p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1">
                              {stockStatus[currentItemId].availableToAssign}
                            </p>
                          </div>

                          {/* Total Available Stock */}
                          <div className="bg-white dark:bg-slate-900 border border-solid border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {language === "pl" ? "Łącznie dostępne" : "Total Available"}
                            </p>
                            <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                              {stockStatus[currentItemId].availableTotal}
                            </p>
                          </div>

                          {/* Rented Out */}
                          <div className="bg-white dark:bg-slate-900 border border-solid border-amber-200 dark:border-amber-950/20 rounded-xl p-3 shadow-xs">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">
                              {language === "pl" ? "Aktualnie wypożyczone" : "Currently Rented"}
                            </p>
                            <p className="text-xl font-black text-amber-600 dark:text-amber-450 mt-1">
                              {stockStatus[currentItemId].rentedQuantity}
                            </p>
                          </div>

                          {/* Demand Overview */}
                          <div className="bg-white dark:bg-slate-900 border border-solid border-indigo-100 dark:border-indigo-950 rounded-xl p-3 shadow-xs">
                            <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">
                              {language === "pl" ? "Zapotrzebowanie / Wnioski" : "Demand / Requesters"}
                            </p>
                            <p className="text-xl font-black text-indigo-650 dark:text-indigo-400 mt-1">
                              {stockStatus[currentItemId].inDemand}{" "}
                              <span className="text-xs font-normal text-slate-400 dark:text-slate-550">
                                ({stockStatus[currentItemId].requestsQuantity} {language === "pl" ? "wniosków" : "reqs"})
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantity Input */}
                    <div>
                      <label className="font-extrabold text-slate-400 dark:text-slate-500 block mb-1 text-[10px] uppercase tracking-wider">
                        {language === "pl" ? "Ilość" : "Quantity"}
                      </label>
                      <input
                        type="number" name="assignedQuantity"
                        value={itemData.assignedQuantity || 0}
                        min={1}
                        onChange={(e) => handleEditChange(currentItemId, e)}
                        className="border border-solid border-slate-200 dark:border-slate-800 p-2.5 rounded-lg w-full disabled:bg-slate-100 dark:disabled:bg-slate-950 disabled:text-slate-450 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-slate-700 dark:text-slate-202 shadow-sm transition-shadow"
                        disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || itemData.newStatus === "rejected" || !itemData?.product}
                      />
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <label className="font-extrabold text-slate-400 dark:text-slate-555 block mb-1 text-[10px] uppercase tracking-wider">Status</label>
                      <select
                        name="newStatus"
                        value={itemData.newStatus}
                        onChange={(e) => handleStatusChange(currentItemId, e)}
                        className="border border-solid border-slate-200 dark:border-slate-800 py-2.5 rounded-lg w-full disabled:bg-slate-100 dark:disabled:bg-slate-950 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-slate-700 dark:text-slate-202 shadow-sm transition-shadow cursor-pointer"
                        disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || !itemData?.product}
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
                    </div>
                  </>
                );
              })()}

              {/* Form actions */}
              <div className="flex justify-end gap-3 mt-5 border-t border-solid border-slate-100 dark:border-slate-850 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs transition cursor-pointer border border-solid border-slate-202 dark:border-slate-700/60 shadow-xs"
                >
                  {language === "pl" ? "Anuluj" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm hover:shadow"
                >
                  {language === "pl" ? "Zapisz zmiany" : "Save Changes"}
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

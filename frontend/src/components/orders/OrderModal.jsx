import React from "react";
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';
import { useTheme } from "../../context/ThemeContext";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-transparent dark:border-slate-800 shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto my-8 max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Update Order</h2>
        <p className="text-lg font-semibold text-gray-700 dark:text-slate-350 mb-4">
          Owner: <span className="font-normal text-gray-800 dark:text-slate-200">{editGroup.owner?.name}</span>
        </p>

        {/* Dates */}
        <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg mb-4">
          <p className="font-semibold text-gray-700 dark:text-slate-300 mb-3">Order Dates</p>
          <div className="flex flex-col gap-3">

            {/* Date Handler */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* Start Date */}
              <DateTimePicker
                label="Start Date"
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
                        backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                        color: theme === "dark" ? "#f8fafc" : "#0f172a",
                        "& fieldset": {
                          borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
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
                label="End Date"
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
                        backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                        color: theme === "dark" ? "#f8fafc" : "#0f172a",
                        "& fieldset": {
                          borderColor: theme === "dark" ? "#334155" : "#cbd5e1",
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

        {/* Item selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {editGroup.items.map((item) => (
            <button
              key={item._id}
              onClick={() => {
                if (setValidationError) setValidationError("");
                setCurrentItemId(item._id);
              }}
              className={`px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors cursor-pointer
                ${currentItemId === item._id
                  ? "border-blue-500 dark:border-indigo-500 bg-blue-50 dark:bg-indigo-950/45 text-blue-700 dark:text-indigo-300 font-medium"
                  : "border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"}`}
            >
              {item.product?.name || "Deleted Product"}
            </button>
          ))}
        </div>

        {/* Current item form */}
        {currentItemId && itemsUpdateData[currentItemId] && (
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {validationError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 rounded-xl p-4 text-sm font-semibold shadow-sm mb-2">
                {validationError}
              </div>
            )}
            {(() => {
              const itemData = itemsUpdateData[currentItemId];

              return (
                <>
                  <div className="flex flex-col gap-1">
                    {/* Product Name */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-500 dark:text-slate-500 text-sm font-medium">Name:</span>
                      <span className="font-medium text-gray-800 dark:text-slate-200">{itemData?.product?.name || "Deleted Product"}</span>
                    </div>

                    {/* Tags */}
                    {itemData?.product?.tags?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-gray-500 dark:text-slate-500 text-sm font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {itemData.product.tags.map((tag, i) => (
                            <span key={i} className="bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-350 text-xs px-2 py-0.5 rounded-full border border-slate-300/30">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 rounded-lg mb-4">
                    <p className="font-semibold text-gray-700 dark:text-slate-300 mb-3">Requested Info</p>
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-650 dark:text-slate-400">
                      <p className="text-gray-500 dark:text-slate-500">Quantity</p>
                      <p className="text-gray-800 dark:text-slate-200 font-medium">{itemData.requestedQuantity}</p>

                      <p className="text-gray-500 dark:text-slate-500">Start</p>
                      <p className="text-gray-800 dark:text-slate-200 font-medium">
                        {new Date(datesUpdateData.requestedStartDate).toLocaleString("pl-PL")}
                      </p>

                      <p className="text-gray-500 dark:text-slate-500">End</p>
                      <p className="text-gray-800 dark:text-slate-200 font-medium">
                        {new Date(datesUpdateData.requestedEndDate).toLocaleString("pl-PL")}
                      </p>
                    </div>
                  </div>

                  {stockStatus && processableStatuses.includes(itemData.prevStatus) && stockStatus[currentItemId] && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg mb-4">
                      <p className="font-semibold text-yellow-850 dark:text-yellow-400 mb-3">Stock Overview</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-650 dark:text-slate-400">
                        <p className="text-gray-600 dark:text-slate-450">Available to Assign</p>
                        <p className="text-gray-900 dark:text-slate-200 font-medium">{stockStatus[currentItemId].availableToAssign}</p>

                        <p className="text-gray-600 dark:text-slate-450">Total Available Stock</p>
                        <p className="text-gray-900 dark:text-slate-200 font-medium">{stockStatus[currentItemId].availableTotal}</p>

                        <p className="text-gray-600 dark:text-slate-450">Currently Rented Out</p>
                        <p className="text-gray-900 dark:text-slate-200 font-medium">{stockStatus[currentItemId].rentedQuantity}</p>

                        <p className="text-gray-600 dark:text-slate-450">Total Requested Quantity</p>
                        <p className="text-gray-900 dark:text-slate-200 font-medium">{stockStatus[currentItemId].inDemand}</p>

                        <p className="text-gray-600 dark:text-slate-450">Number of Requesters</p>
                        <p className="text-gray-900 dark:text-slate-200 font-medium">{stockStatus[currentItemId].requestsQuantity}</p>
                      </div>
                    </div>
                  )}


                  {/* Quantity */}
                  <div>
                    <label className="font-semibold text-gray-700 dark:text-slate-350 block mb-1 text-xs uppercase tracking-wider">Quantity</label>
                    <input
                      type="number" name="assignedQuantity"
                      value={itemData.assignedQuantity || 0}
                      min={1}
                      onChange={(e) => handleEditChange(currentItemId, e)}
                      className="border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg w-full disabled:bg-gray-100 dark:disabled:bg-slate-950 disabled:text-slate-450 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-shadow"
                      disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || itemData.newStatus === "rejected" || !itemData?.product}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="font-semibold text-gray-700 dark:text-slate-350 block mb-1 text-xs uppercase tracking-wider">Status</label>
                    <select
                      name="newStatus"
                      value={itemData.newStatus}
                      onChange={(e) => handleStatusChange(currentItemId, e)}
                      style={{ textIndent: "8px", paddingLeft: "0px" }}
                      className="border border-slate-200 dark:border-slate-800 py-2.5 rounded-lg w-full disabled:bg-gray-100 dark:disabled:bg-slate-950 disabled:text-slate-450 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-shadow"
                      disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || !itemData?.product}
                    >
                      <option key={itemData.prevStatus} disabled={true}>{itemData.prevStatus}</option>
                      {getAllowedStatusChanges(itemData.prevStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              );
            })()}

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs transition cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderModal;

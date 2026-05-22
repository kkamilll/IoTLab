import React from "react";
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';

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
  getAllowedStatusChanges
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={handleCloseModal}>
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto my-8 max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Update Order</h2>
        <p className="text-lg font-semibold text-gray-700 mb-4">
          Owner: <span className="font-normal text-gray-800">{editGroup.owner?.name}</span>
        </p>

        {/* Dates */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
          <p className="font-semibold text-gray-700 mb-3">Order Dates</p>
          <div className="flex flex-col gap-3">

            {/* Date Handler */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* Start Date */}
              <DateTimePicker
                label="Start Date"
                value={datesUpdateData.assignedStartDate ? new Date(datesUpdateData.assignedStartDate) : null}
                onChange={(newValue) => {
                  setDatesUpdateData(prev => ({
                    ...prev,
                    assignedStartDate: newValue ? newValue.toISOString() : null
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
                  />
                )}
              />

              {/* End Date */}
              <DateTimePicker
                label="End Date"
                value={datesUpdateData.assignedEndDate ? new Date(datesUpdateData.assignedEndDate) : null}
                onChange={(newValue) => {
                  setDatesUpdateData(prev => ({
                    ...prev,
                    assignedEndDate: newValue ? newValue.toISOString() : null
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
              onClick={() => setCurrentItemId(item._id)}
              className={`px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors
                ${currentItemId === item._id
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-300 bg-white hover:bg-gray-50"}`}
            >
              {item.product?.name || "Deleted Product"}
            </button>
          ))}
        </div>

        {/* Current item form */}
        {currentItemId && itemsUpdateData[currentItemId] && (
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {(() => {
              const itemData = itemsUpdateData[currentItemId];

              return (
                <>
                  <div className="flex flex-col gap-1">
                    {/* Product Name */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-500 text-sm font-medium">Name:</span>
                      <span className="font-medium text-gray-800">{itemData?.product?.name || "Deleted Product"}</span>
                    </div>

                    {/* Tags */}
                    {itemData?.product?.tags?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-gray-500 text-sm font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {itemData.product.tags.map((tag, i) => (
                            <span key={i} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                    <p className="font-semibold text-gray-700 mb-3">Requested Info</p>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <p className="text-gray-500">Quantity</p>
                      <p className="text-gray-800 font-medium">{itemData.requestedQuantity}</p>

                      <p className="text-gray-500">Start</p>
                      <p className="text-gray-800 font-medium">
                        {new Date(datesUpdateData.requestedStartDate).toLocaleString("pl-PL")}
                      </p>

                      <p className="text-gray-500">End</p>
                      <p className="text-gray-800 font-medium">
                        {new Date(datesUpdateData.requestedEndDate).toLocaleString("pl-PL")}
                      </p>
                    </div>
                  </div>

                  {stockStatus && processableStatuses.includes(itemData.prevStatus) && stockStatus[currentItemId] && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <p className="font-semibold text-yellow-800 mb-3">Stock Overview</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <p className="text-gray-600">Available to Assign</p>
                        <p className="text-gray-900 font-medium">{stockStatus[currentItemId].availableToAssign}</p>

                        <p className="text-gray-600">Total Available Stock</p>
                        <p className="text-gray-900 font-medium">{stockStatus[currentItemId].availableTotal}</p>

                        <p className="text-gray-600">Currently Rented Out</p>
                        <p className="text-gray-900 font-medium">{stockStatus[currentItemId].rentedQuantity}</p>

                        <p className="text-gray-600">Total Requested Quantity</p>
                        <p className="text-gray-900 font-medium">{stockStatus[currentItemId].inDemand}</p>

                        <p className="text-gray-600">Number of Requesters</p>
                        <p className="text-gray-900 font-medium">{stockStatus[currentItemId].requestsQuantity}</p>
                      </div>
                    </div>
                  )}


                  {/* Quantity */}
                  <div>
                    <label className="font-medium text-gray-700">Quantity</label>
                    <input
                      type="number" name="assignedQuantity"
                      value={itemData.assignedQuantity || 0}
                      min={1}
                      onChange={(e) => handleEditChange(currentItemId, e)}
                      className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || itemData.newStatus === "rejected" || !itemData?.product}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="font-medium text-gray-700">Status</label>
                    <select
                      name="newStatus"
                      value={itemData.newStatus}
                      onChange={(e) => handleStatusChange(currentItemId, e)}
                      className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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

            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderModal;

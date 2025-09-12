import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Orders = () => {
  const { user, token } = useAuth();
  // const isAdmin = user?.role === "admin";

  const [orders, setOrders] = useState([]);

  const [orderStatuses, setOrderStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const [expanded, setExpanded] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editGroup, setEditGroup] = useState(null); // currently editing order's owner part
  const [currentItemId, setCurrentItemId] = useState(null);
  const [itemsUpdateData, setItemsUpdateData] = useState({}); // edited items keyed by item._id
  const [datesUpdateData, setDatesUpdateData] = useState({}); // edited dates

  const [stockStatus, setStockStatus] = useState(null); // inDemand, requestsQuantity, available

  const [openModal, setOpenModal] = useState(false);


  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/statuses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setOrderStatuses(res.data.statuses);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async (page = 1, limit = 20, emailFilter = "", statusFilter = "") => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        email: emailFilter,
        status: statusFilter,
      });

      const res = await axios.get(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.page);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchProductStockStatus = async (productId, startDate, endDate) => {
    try {
      if (!productId || !startDate || !endDate) return null;

      const res = await axios.post(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/products/stockStatus`,
        { productId, startDate, endDate },
        { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        return {
          available: res.data.available ?? 0,
          inDemand: res.data.inDemand ?? 0,
          requestsQuantity: res.data.requestsQuantity ?? 0,
        };
      }
      return null;
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || error.message || "Unknown error");
    }
  }

  useEffect(() => {
    fetchOrders(1);
    fetchStatuses();
  }, []);

  useEffect(() => { fetchOrders(1, 20, emailFilter, statusFilter); }, [statusFilter, emailFilter]);

  useEffect(() => {
    if (!editGroup || !itemsUpdateData || Object.keys(itemsUpdateData).length === 0) return;

    const fetchStockForItem = (item) => {
      const currentItem = itemsUpdateData[item._id];
      if (!currentItem) return;

      const { assignedStartDate, assignedEndDate } = datesUpdateData || {};
      if (!assignedStartDate || !assignedEndDate) return;

      fetchProductStockStatus(currentItem.product._id, assignedStartDate, assignedEndDate)
        .then(data => {
          setStockStatus(prev => ({
            ...prev,
            [currentItem.itemId]: data
          }));
        });
    };

    if (currentItemId && itemsUpdateData[currentItemId] && processableStatuses.includes(itemsUpdateData[currentItemId].status)) {
      fetchStockForItem({ _id: currentItemId });
      return;
    }

    editGroup.items
      .filter(item => processableStatuses.includes(item.status))
      .forEach(fetchStockForItem);

  }, [editGroup, currentItemId, datesUpdateData?.assignedStartDate, datesUpdateData?.assignedEndDate]);

  const processableStatuses = ["pending", "approved", "prepared"];
  const rejectableStatuses = ["pending", "approved", "prepared"];
  const nonRejectableStatuses = ["rented", "late", "returned"];
  const returnableStatuses = ["rented", "late"];

  const hasStatus = (items, statuses) => items.some(item => statuses.includes(item.status));

  const canProcessOrder = (order) => hasStatus(order.items, processableStatuses); // window
  const canRejectOrder = (order) => hasStatus(order.items, rejectableStatuses) && !hasStatus(order.items, nonRejectableStatuses); // automatic
  const canPrepareOrder = (order) => hasStatus(order.items, ["approved"]) && !hasStatus(order.items, ["pending"]);
  const canRentOrder = (order) => hasStatus(order.items, ["prepared"]) && !hasStatus(order.items, ["pending"]); // automatic + pdf
  const canReturnOrder = (order) => hasStatus(order.items, returnableStatuses) && !hasStatus(order.items, ["pending"]); // window

  const prevPage = () => {
    if (currentPage > 1) fetchOrders(currentPage - 1);
  };
  const nextPage = () => {
    if (currentPage < totalPages) fetchOrders(currentPage + 1);
  };

  const getStatusColor = (groupStatus) => {
    switch (groupStatus) {
      case "changed":
        return "text-red-800"; // really noticeable
      case "pending":
      case "approved":
      case "prepared":
        return "text-yellow-600";
      case "rented":
        return "text-green-600";
      case "returned":
        return "text-blue-600";
      case "rejected":
        return "text-gray-500";
      default:
        return "text-red-700"; // fallback for unexpected statuses
    }
  };

  const getAllowedStatusChanges = (status) => {
    if (status === "pending") return ["approved", "rejected"];
    if (status === "approved") return ["prepared", "rejected"];
    if (status === "prepared") return ["rented", "rejected"];
    return [];
  };

  const highestPriorityGroupStatus = useMemo(() => {
    if (!editGroup) return null;

    const processableItems = editGroup.items.filter(item =>
      processableStatuses.includes(item.status)
    );

    if (processableItems.length === 0) return null;

    const statusIndexes = processableItems.map(item =>
      processableStatuses.indexOf(item.status)
    );

    const minIndex = Math.min(...statusIndexes);
    return processableStatuses[minIndex];
  }, [editGroup]);

  const today = new Date().toISOString().split("T")[0];

  const formatDateTimeLocal = (dateInput) => {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleUpdateOrderItems = async (group, statusFilter, newStatus) => {
    try {
      const orderId = group?.orderId;
      if (!orderId) {
        console.error("Missing orderId for group:", group);
        alert("Missing Order ID.");
        return;
      }

      const itemsToUpdate = group.items
        .filter(statusFilter)
        .map(item => ({
          itemId: item._id,
          newStatus
        }));

      if (!itemsToUpdate.length) return; // nothing to update

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/updateOrder/${orderId}`,
        itemsToUpdate,
        config
      );

      if (res.data.success) fetchOrders(1);
      else alert(res.data.message || "Operation failed");

    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || error.message || "Unknown error");
    }
  };

  const handleRejectOrder = (group) => handleUpdateOrderItems(group, item => rejectableStatuses.includes(item.status), "rejected");
  const handlePrepareOrder = (group) => handleUpdateOrderItems(group, item => item.status === "approved", "prepared");
  const handleRentOrder = (group) => handleUpdateOrderItems(group, item => item.status === "prepared", "rented");
  const handleReturnOrder = (group) => handleUpdateOrderItems(group, item => returnableStatuses.includes(item.status), "returned");

  const handleOpenModal = (group) => {
    setEditGroup(group); // store the owner group being edited

    // Initialize formData for this owner's items
    setItemsUpdateData(
      group.items.reduce((acc, item) => {
        acc[item._id] = {
          itemId: item._id,
          product: item.product,

          requestedQuantity: item?.requestedQuantity,
          assignedQuantity: item?.assignedQuantity ?? item?.requestedQuantity,

          prevStatus: item.status,
          newStatus: item.status
        };
        return acc;
      }, {})
    );

    setDatesUpdateData({
      requestedStartDate: group.dates.requestedStartDate,
      requestedEndDate: group.dates.requestedEndDate,

      assignedStartDate: group.dates.assignedStartDate || group.dates.requestedStartDate,
      assignedEndDate: group.dates.assignedEndDate || group.dates.requestedEndDate,
    });
    if (group.items.length > 0) setCurrentItemId(group.items[0]._id);

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditGroup(null);
    setItemsUpdateData({});
    setDatesUpdateData({});
  }


  const handleEditChange = (itemId, e) => {
    const { name, value } = e.target;

    setItemsUpdateData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [name]: value
      }
    }));
  };

  const handleEditChangeDate = (e) => {
    const { name, value } = e.target;
    const date = new Date(value);
    const isoString = date.toISOString();
    console.log(`Date change ${name}: field value ${value}, save as ${isoString}`)

    setDatesUpdateData(prev => ({
      ...prev,
      [name]: isoString
    }));
  };

  const handleStatusChange = (itemId, e) => {
    const { name, value } = e.target;

    setItemsUpdateData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderId = editGroup?.orderId?.toString();
      if (!orderId) {
        console.error("Missing orderId for group:", editGroup);
        alert("Missing Order ID.");
        return;
      }

      // validation
      for (const item of Object.values(itemsUpdateData)) {
        const quantity = item?.assignedQuantity;

        const prevStatus = item?.prevStatus;
        const newStatus = item?.newStatus;

        const productName = item?.product?.name || "Unknown product";
        const productTag = item?.product?.tag || "Unknown tag";

        const isProcessable = processableStatuses.includes(item.newStatus);

        if (isProcessable) {
          if (!quantity || quantity < 1) {
            alert(`${productName} (${productTag}): Item quantity must be >= 1`);
            return;
          }

          if (quantity > stockStatus[item.itemId].available) {
            alert(`${productName} (${productTag}): Item quantity must be within available range`);
            return;
          }

          if (prevStatus !== newStatus) {
            continue;
          }

          if (highestPriorityGroupStatus === "pending") {
            if (newStatus === highestPriorityGroupStatus) {
              alert(`${productName} (${productTag}): Status has to be changed.`);
              return;
            }
          }
        }
      }

      const startDate = datesUpdateData?.assignedStartDate;
      const endDate = datesUpdateData?.assignedEndDate;

      if (!startDate || !endDate) {
        alert(`Order ${orderId} require: Both start and end dates are required`);
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert(`Order ${orderId} require: Start date cannot be after end date`);
        return;
      }

      const itemUpdates = Object.values(itemsUpdateData).map(item => ({
        itemId: item.itemId,
        assignedQuantity: item.assignedQuantity,
        newStatus: item.newStatus,
      }));

      const dateUpdates = Object.fromEntries(Object.entries(datesUpdateData || {}).filter(([key]) => key === "assignedStartDate" || key === "assignedEndDate").map(([key, value]) => [key, new Date(value)]));


      const payload = { itemUpdates, ...dateUpdates };
      console.log(payload, itemUpdates, dateUpdates);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await axios.put(`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/updateOrder/${orderId}`, payload, config);

      if (res.data.success) {
        fetchOrders(1);
        handleCloseModal();

      } else {
        alert(res.data.message || "Operation failed");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center">Zarządzanie Wypożyczeniami</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <input
            type="text"
            placeholder="Szukaj po e-mailu"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/3"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/4"
          >
            <option value="">Wszystkie statusy</option>
            {orderStatuses.map((status, idx) => (
              <option key={idx} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {orders.length === 0 ? (
          <div className="text-center p-6 text-gray-500">Brak wypożyczeń</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((order) => {
                  const itemsByOwner = order.items.reduce((acc, item) => {
                    const ownerId = item?.responsibleOwner?._id?.toString() || "unknown";
                    const ownerData = order.ownersData.find(ownerData => ownerData.owner?.toString() === ownerId);

                    if (!acc[ownerId]) {
                      acc[ownerId] = {
                        orderId: order._id,
                        items: [],

                        owner: item?.responsibleOwner || { name: "Nieznany właściciel" },
                        ownerData: ownerData,
                        status: ownerData?.status,

                        dates: {
                          requestedStartDate: order.requestedStartDate,
                          requestedEndDate: order.requestedEndDate,

                          assignedStartDate: ownerData?.assignedStartDate,
                          assignedEndDate: ownerData?.assignedEndDate,
                        },
                      };
                    }

                    acc[ownerId].items.push(item);
                    return acc;
                  }, {});

                  return (
                    <div key={order._id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 hover:shadow-md transition relative">
                      {order.isReturned && (
                        <span className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs font-bold">ZWROCONO</span>
                      )}

                      <h2 className="text-lg font-semibold text-gray-700">{order?.customer?.email || "Brak maila"}</h2>

                      <div className="border-t border-gray-200 pt-2">

                        {Object.values(itemsByOwner).map((group, idx) => {
                          return (
                            <div key={idx} className="mb-8 last:mb-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex flex-col gap-1 mb-5">
                                <h4 className="font-semibold text-gray-700">
                                  Owner: {group.owner?.name || "Nieznany"}
                                </h4>

                                <p className="text-sm text-gray-500">
                                  Status: <span className={`font-medium ${getStatusColor(group.status)}`}>
                                    {group.status}
                                  </span>
                                </p>
                              </div>

                              <ul className="list-disc list-inside space-y-2">
                                {group.items.map((item, i) => {
                                  const toggleKey = `${order._id}-${item._id}`;

                                  return (
                                    <li key={i} className="text-gray-700 flex flex-col gap-1">
                                      <div className={`flex items-center gap-2 ${getStatusColor(item.status)}`}>
                                        {`${item?.product?.name || "Produkt usunięty"} (${item?.product?.tag})`}
                                      </div>


                                      <button
                                        onClick={() =>
                                          setExpanded((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }))
                                        }
                                        className="text-blue-600 hover:underline text-sm self-start"
                                      >
                                        {expanded[toggleKey] ? "Hide details" : "Show details"}
                                      </button>

                                      {/* Collapsible details */}
                                      {expanded[toggleKey] && (
                                        <div className="mt-2 space-y-2 p-2 border rounded-lg border-gray-300 bg-gray-50">

                                          {/* Quantity */}
                                          <div>
                                            <p>
                                              Requested: {item?.requestedQuantity ?? "-"}
                                            </p>
                                            {item?.assignedQuantity && item.status !== "pending" && (
                                              <p>
                                                Assigned: {item?.assignedQuantity}
                                              </p>
                                            )}
                                          </div>

                                          {/* Dates */}
                                          {/* <div>
                                            <p className="font-medium text-gray-700">Period:</p>
                                            <p>
                                              Requested: 📅 Start: {new Date(item.requested?.startDate).toLocaleDateString("pl-PL")} - End: {new Date(item?.requested?.endDate).toLocaleDateString("pl-PL")}
                                            </p>
                                            {item?.assigned?.startDate && item?.assigned?.endDate && item.status !== "pending" && (
                                              <p>
                                                Assigned: 📅 Start: {new Date(item?.assigned?.startDate).toLocaleDateString("pl-PL")} - End: {new Date(item?.assigned?.endDate).toLocaleDateString("pl-PL")}
                                              </p>
                                            )}
                                          </div> */}

                                          {/* Status */}
                                          <div>
                                            <p className="font-medium text-gray-700">
                                              Status: {item?.status || "unknown"}
                                            </p>
                                          </div>

                                        </div>
                                      )}

                                    </li>
                                  )
                                })}
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {canProcessOrder(group) && (
                                    <button
                                      onClick={() => handleOpenModal(group)}
                                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
                                    >
                                      Process
                                    </button>
                                  )}
                                  {canRejectOrder(group) && (
                                    <button
                                      onClick={() => handleRejectOrder(group)}
                                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
                                    >
                                      Reject
                                    </button>
                                  )}
                                  {canPrepareOrder(group) && (
                                    <button
                                      onClick={() => handlePrepareOrder(group)}
                                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
                                    >
                                      Prepare
                                    </button>
                                  )}
                                  {canRentOrder(group) && (
                                    <button
                                      onClick={() => handleRentOrder(group)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
                                    >
                                      Rent
                                    </button>
                                  )}
                                  {canReturnOrder(group) && (
                                    <button
                                      onClick={() => handleReturnOrder(group)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
                                    >
                                      Return
                                    </button>
                                  )}
                                </div>

                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button onClick={prevPage} disabled={currentPage === 1} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded disabled:opacity-50">Poprzednia</button>
              <span className="text-gray-700">Strona {currentPage} z {totalPages}</span>
              <button onClick={nextPage} disabled={currentPage === totalPages} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded disabled:opacity-50">Następna</button>
            </div>
          </>
        )}
      </div>

      {openModal && editGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
            <h2 className="text-2xl font-bold mb-4">Edit Items - {editGroup.owner?.name}</h2>

            {/* Item selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {editGroup.items.map((item) => (
                <button
                  key={item._id}
                  onClick={() => setCurrentItemId(item._id)}
                  className={`px-3 py-1 rounded border ${currentItemId === item._id ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                >
                  {item.product?.name || "Produkt usunięty"}
                </button>
              ))}
            </div>

            {/* Current item form */}
            {currentItemId && itemsUpdateData[currentItemId] && (
              <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                {(() => {
                  const itemData = itemsUpdateData[currentItemId];
                  // const requested = itemData?.requested;
                  // const assigned = itemData?.assigned;

                  return (
                    <>
                      <h2>{itemData.product?.tag}</h2>
                      <div className="p-2 bg-gray-100 rounded mb-2">
                        <p className="font-medium text-gray-700">Requested Info</p>
                        <p>Quantity: {itemData.requestedQuantity}</p>
                        <p>Start: {new Date(datesUpdateData.requestedStartDate).toLocaleString("pl-PL")}</p>
                        <p>End: {new Date(datesUpdateData.requestedEndDate).toLocaleString("pl-PL")}</p>
                      </div>
                      {/* Quantity */}
                      <div>
                        <label className="font-medium text-gray-700">Quantity</label>
                        <input
                          type="number" name="assignedQuantity"
                          value={itemData.assignedQuantity || 0}
                          min={1}
                          onChange={(e) => handleEditChange(currentItemId, e)}
                          className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || itemData.newStatus === "rejected"}
                        />
                      </div>

                      {/* Dates */}
                      <div>
                        <label className="font-medium text-gray-700">Start Date</label>
                        <input
                          type="datetime-local" name="assignedStartDate"
                          value={formatDateTimeLocal(datesUpdateData.assignedStartDate)}
                          min={today}
                          onChange={(e) => handleEditChangeDate(e)}
                          className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || itemData.newStatus === "rejected"}
                        />
                      </div>

                      <div>
                        <label className="font-medium text-gray-700">End Date</label>
                        <input
                          type="datetime-local" name="assignedEndDate"
                          value={formatDateTimeLocal(datesUpdateData.assignedEndDate)}
                          min={datesUpdateData.assignedStartDate || today}
                          onChange={(e) => handleEditChangeDate(e)}
                          className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus) || itemData.newStatus === "rejected"}
                        />
                      </div>

                      {stockStatus && processableStatuses.includes(itemData.prevStatus) && stockStatus[currentItemId] && (
                        <div className="p-2 bg-gray-100 rounded mb-3">
                          <p>Available: {stockStatus[currentItemId].available}</p>
                          <p>Total requested: {stockStatus[currentItemId].inDemand}</p>
                          <p>Number of requesters: {stockStatus[currentItemId].requestsQuantity}</p>
                        </div>
                      )}

                      {/* Status */}
                      <div>
                        <label className="font-medium text-gray-700">Status</label>
                        <select
                          name="newStatus"
                          value={itemData.newStatus}
                          onChange={(e) => handleStatusChange(currentItemId, e)}
                          className="border p-2 rounded w-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={!processableStatuses.includes(itemData.prevStatus) || (itemData.prevStatus !== highestPriorityGroupStatus)}
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

                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default Orders;
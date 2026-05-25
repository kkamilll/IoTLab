import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import OrderModal from "../components/orders/OrderModal";

import { rentalAgreementTemplate } from "../templates/rentalAgreementTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


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
      const res = await apiClient.get('/orders/statuses');
      if (res.data.success) setOrderStatuses(res.data.statuses);
    } catch (error) {
      console.error(error);
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

      const res = await apiClient.get(`/orders?${queryParams.toString()}`);
      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.page);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchProductStockStatus = async (productId, startDate, endDate) => {
    try {
      if (!productId || !startDate || !endDate) return null;

      const res = await apiClient.post('/products/stockStatus',
        { productId, startDate, endDate, orderId: editGroup.orderId });

      if (res.data.success) {
        return {
          availableToAssign: res.data.availableToAssign ?? 0,
          inDemand: res.data.inDemand ?? 0,
          requestsQuantity: res.data.requestsQuantity ?? 0,
          availableTotal: res.data.availableTotal ?? 0,
          rentedQuantity: res.data.rentedQuantity ?? 0,
        };
      }
      return null;
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || error.message || "Unknown error");
    }
  };

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

      fetchProductStockStatus(currentItem?.product?._id, assignedStartDate, assignedEndDate)
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

  }, [editGroup, datesUpdateData?.assignedStartDate, datesUpdateData?.assignedEndDate]);

  const processableStatuses = ["pending", "approved", "prepared"];
  const rejectableStatuses = ["pending", "approved", "prepared"];
  const nonRejectableStatuses = ["rented", "late", "returned"];
  const returnableStatuses = ["rented", "late"];
  const printableStatuses = ["prepared", "rented"];

  const hasStatus = (status, statuses) => statuses.includes(status);

  const canProcessOrder = (status) => hasStatus(status, processableStatuses); // window
  const canRejectOrder = (status) => hasStatus(status, rejectableStatuses) && !hasStatus(status, nonRejectableStatuses); // automatic
  const canPrepareOrder = (status) => hasStatus(status, ["approved"]) && !hasStatus(status, ["pending"]);
  const canRentOrder = (status) => hasStatus(status, ["prepared"]) && !hasStatus(status, ["pending"]); // automatic + pdf
  const canReturnOrder = (status) => hasStatus(status, returnableStatuses) && !hasStatus(status, ["pending"]); // window
  const canPrintOrder = (status) => hasStatus(status, printableStatuses);

  const getStatusColor = (groupStatus) => {
    switch (groupStatus) {
      case "changed":
        return "text-red-800 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "approved":
        return "text-lime-600 bg-lime-50";
      case "prepared":
        return "text-indigo-600 bg-indigo-50";
      case "rented":
        return "text-green-600 bg-green-50";
      case "returned":
        return "text-blue-600 bg-blue-50";
      case "rejected":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-red-700 bg-red-50";
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

  // const formatDateTimeLocal = (dateInput) => {
  //   if (!dateInput) return "";

  //   const date = new Date(dateInput);
  //   if (isNaN(date.getTime())) return "";

  //   const year = date.getFullYear();
  //   const month = String(date.getMonth() + 1).padStart(2, "0");
  //   const day = String(date.getDate()).padStart(2, "0");
  //   const hours = String(date.getHours()).padStart(2, "0");
  //   const minutes = String(date.getMinutes()).padStart(2, "0");

  //   return `${year}-${month}-${day}T${hours}:${minutes}`;
  // };

  const handleUpdateOrderItems = async (group, statusFilter, newStatus) => {
    try {
      const orderId = group?.orderId;
      if (!orderId) {
        console.error("Missing orderId for group:", group);
        alert("Missing Order ID.");
        return;
      }

      const itemUpdates = group.items
        .filter(statusFilter)
        .map(item => ({
          ...item,
          itemId: item._id,
          newStatus
        }));

      if (!itemUpdates.length) return; // nothing to update

      const res = await apiClient.put(`/orders/updateOrder/${orderId}`, { itemUpdates });

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

  const downloadRentalAgreement = async (orderGroup) => {
    const { customerInfo, owner, items, dates } = orderGroup;

    const content = rentalAgreementTemplate({
      customerInfo: customerInfo ?? "Unknown",
      items: items
      .filter(item => printableStatuses.includes(item.status))
      .map(i => ({
        productName: i.product?.name ?? "Deleted Product",
        quantity: i.assignedQuantity ?? "-"
      })),
      startDate: new Date(dates.assignedStartDate).toLocaleDateString("en-GB"),
      endDate: new Date(dates.assignedEndDate).toLocaleDateString("en-GB"),
      today
    });

    // Create a hidden container for rendering HTML
    const container = document.createElement("div");
    container.innerHTML = content;
    container.style.width = "800px";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    // Render HTML to canvas
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    // Add to PDF
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save(`RentalAgreement_${owner?.name ?? "Unknown"}.pdf`);

    // Cleanup
    document.body.removeChild(container);
  };

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

  // const handleEditChangeDate = (e) => {
  //   const { name, value } = e.target;
  //   const date = new Date(value);
  //   const isoString = date.toISOString();
  //   console.log(`Date change ${name}: field value ${value}, save as ${isoString}`)

  //   setDatesUpdateData(prev => ({
  //     ...prev,
  //     [name]: isoString
  //   }));
  // };

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
        const productTags = item?.product?.tags ? item?.product?.tags[0] : "Unknown tag";

        const isProcessable = processableStatuses.includes(item.newStatus);

        if (isProcessable) {
          if (!quantity || quantity < 1) {
            alert(`${productName} (${productTags}): Item quantity must be >= 1`);
            return;
          }

          if (quantity > stockStatus[item.itemId].availableToAssign) {
            alert(`${productName} (${productTags}): Item quantity must be within available range`);
            return;
          }

          if (prevStatus !== newStatus) {
            continue;
          }

          if (highestPriorityGroupStatus === "pending") {
            if (newStatus === highestPriorityGroupStatus) {
              alert(`${productName} (${productTags}): Status has to be changed.`);
              return;
            }
          }
        }
      }

      const startDate = datesUpdateData?.assignedStartDate;
      const endDate = datesUpdateData?.assignedEndDate;

      if (!startDate || !endDate) {
        alert(`Both start and end dates are required`);
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert(`Start date cannot be after end date`);
        return;
      }

      const itemUpdates = Object.values(itemsUpdateData).map(item => ({
        itemId: item.itemId,
        assignedQuantity: item.assignedQuantity,
        newStatus: item.newStatus,
      }));

      const dateUpdates = Object.fromEntries(Object.entries(datesUpdateData || {}).filter(([key]) => key === "assignedStartDate" || key === "assignedEndDate").map(([key, value]) => [key, new Date(value)]));

      const payload = { itemUpdates, ...dateUpdates };

      const res = await apiClient.put(`/orders/updateOrder/${orderId}`, payload);

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
    <div className="min-h-screen bg-slate-50/30 flex flex-col items-center p-6 md:p-8">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4 w-full">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Order Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track, review, approve, and finalize equipment rentals</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
          <input
            type="text"
            placeholder="Filter by customer email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[120px]"
            >
              <option value="">All</option>
              {orderStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl text-slate-400 font-medium shadow-sm">No orders found</div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        customerInfo: order.customer,
                        owner: item?.responsibleOwner || { name: "Nieznany właściciel" },
                        ownerData: ownerData,
                        status: ownerData?.status,

                        dates: {
                          requestedStartDate: order.requestedStartDate,
                          requestedEndDate: order.requestedEndDate,

                          assignedStartDate: ownerData?.assignedStartDate,
                          assignedEndDate: ownerData?.assignedEndDate,
                        },

                        hasAssignedDates: !!(ownerData?.assignedStartDate && ownerData?.assignedEndDate),
                      };
                    }

                    acc[ownerId].items.push(item);
                    return acc;
                  }, {});

                  return (
                    <div key={order._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition">
                      <h2 className="text-base font-bold text-slate-800">{order?.customer?.email || "Brak maila"}</h2>
                      <div className="border-t border-slate-100 pt-4">

                        {Object.values(itemsByOwner).map((group, idx) => {
                          const hasActions = !!group.status &&
                            (
                              canProcessOrder(group.status) ||
                              canRejectOrder(group.status) ||
                              canPrepareOrder(group.status) ||
                              canRentOrder(group.status) ||
                              canReturnOrder(group.status) ||
                              canPrintOrder(group.status)
                            );

                          return (
                            <div key={idx} className="mb-6 last:mb-0 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                              <div className="flex flex-col gap-1 mb-4">
                                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                                  Owner: {group.owner?.name || "Nieznany"}
                                </h4>

                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-xs text-slate-500 font-semibold">Status:</span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(group.status)} border-current/10`}>
                                    {group.status}
                                  </span>
                                </div>
                              </div>

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

                                {group.ownerData?.customerApproval != null && (
                                  <div className="mt-2">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${group.ownerData.customerApproval
                                          ? "bg-green-50 text-green-700 border-green-200/50"
                                          : "bg-red-50 text-red-700 border-red-200/50"
                                        }`}
                                    >
                                      {group.ownerData.customerApproval ? "Customer Approved changes" : "Customer Rejected changes"}
                                    </span>
                                  </div>
                                )}

                                {/* Dates */}
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested</p>
                                    <p className="text-xs font-semibold text-slate-700 mt-1">
                                      📅 {new Date(group.dates?.requestedStartDate).toLocaleDateString("pl-PL")} → {new Date(group.dates?.requestedEndDate).toLocaleDateString("pl-PL")}
                                    </p>
                                  </div>

                                  {group.hasAssignedDates && (
                                    <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-3 shadow-sm">
                                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Assigned</p>
                                      <p className="text-xs font-semibold text-indigo-700 mt-1">
                                        📅 {new Date(group.dates?.assignedStartDate).toLocaleDateString("pl-PL")} → {new Date(group.dates?.assignedEndDate).toLocaleDateString("pl-PL")}
                                      </p>
                                    </div>
                                  )}
                                </div>

                              <div className="space-y-3">
                                {group.items.length > 0 && (
                                  <>
                                    <p className="font-bold text-slate-850 text-xs uppercase tracking-wider mt-4 mb-1 text-slate-400">Items:</p>

                                    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm">
                                      <ul className="list-disc list-inside space-y-8">
                                        {group.items.map((item, i) => {
                                          const toggleKey = `${order._id}-${item._id}`;

                                          return (
                                            <li key={i} className="text-gray-700 flex flex-col gap-1 pb-6 border-dashed border-b border-gray-700 last:border-0">
                                              <div className="flex items-center gap-2 flex-wrap text-gray-800 text-sm">
                                                <span className="text-gray-500">Name:</span>
                                                <span>{item?.product?.name || "Deleted Product"}</span>
                                                <span className="text-gray-500">Tags:</span>
                                                <span>{item?.product?.tags?.join(", ") || "—"}</span>
                                              </div>

                                              <button
                                                onClick={() =>
                                                  setExpanded((prev) => ({ ...prev, [toggleKey]: !prev[toggleKey] }))
                                                }
                                                className="inline-block mt-1 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                                              >
                                                {expanded[toggleKey] ? "Hide details" : "Show details"}
                                              </button>

                                              {/* Collapsible details */}
                                              {expanded[toggleKey] && (
                                                <div>
                                                  {/* Quantity Section */}
                                                  <div className="space-y-2">
                                                    <p className="font-semibold text-gray-700 text-lg">Quantity:</p>

                                                    <div className="flex flex-col gap-2 sm:flex-col md:flex-row md:gap-4 flex-wrap">
                                                      {/* Requested */}
                                                      <div className="w-full md:flex-1 bg-white border border-gray-200 rounded-md p-4 text-center break-words">
                                                        <p className="text-sm text-gray-600 font-medium">Requested</p>
                                                        <p className="text-gray-800 font-bold text-lg">{item?.requestedQuantity ?? "-"}</p>
                                                      </div>

                                                      {/* Assigned */}
                                                      {item?.assignedQuantity && item.status !== "pending" && (
                                                        <div className="w-full md:flex-1 bg-blue-50 border border-blue-200 rounded-md p-4 text-center break-words">
                                                          <p className="text-sm text-blue-700 font-medium">Assigned</p>
                                                          <p className="text-blue-800 font-bold text-lg">{item.assignedQuantity}</p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Status Section */}
                                                  <div className="flex flex-col gap-1">
                                                    {/* Label */}
                                                    <p className="font-semibold text-gray-700 text-lg">Status:</p>

                                                    {/* Value below */}
                                                    <div className="bg-gray-100 border border-gray-200 rounded-md p-4 text-center break-words">
                                                      <p className={`text-gray-800 font-bold text-sm ${getStatusColor(item?.status)}`}>
                                                        {item?.status || "Unknown"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  </>
                                )}

                                {hasActions && (
                                  <div className="mt-4 border-t border-slate-100 pt-3">
                                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Actions:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {canProcessOrder(group.status) && (
                                        <button
                                          onClick={() => handleOpenModal(group)}
                                          className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition"
                                        >
                                          Process
                                        </button>
                                      )}

                                      {canRejectOrder(group.status) && (
                                        <button
                                          onClick={() => handleRejectOrder(group)}
                                          className="px-4 py-2 text-xs font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl transition"
                                        >
                                          Reject
                                        </button>
                                      )}

                                      {canPrepareOrder(group.status) && (
                                        <button
                                          onClick={() => handlePrepareOrder(group)}
                                          className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition"
                                        >
                                          Prepare
                                        </button>
                                      )}

                                      {canRentOrder(group.status) && (
                                        <button
                                          onClick={() => handleRentOrder(group)}
                                          className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
                                        >
                                          Rent
                                        </button>
                                      )}

                                      {canReturnOrder(group.status) && (
                                        <button
                                          onClick={() => handleReturnOrder(group)}
                                          className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition"
                                        >
                                          Return
                                        </button>
                                      )}

                                      {canPrintOrder(group.status) && (
                                        <button
                                          onClick={() => downloadRentalAgreement(group)}
                                          className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm transition"
                                        >
                                          PDF
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Previous
              </button>
              <span className="text-slate-500 text-xs font-semibold">Page {currentPage} / {totalPages}</span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {openModal && editGroup && (
        <OrderModal
          handleCloseModal={handleCloseModal}
          editGroup={editGroup}
          datesUpdateData={datesUpdateData}
          setDatesUpdateData={setDatesUpdateData}
          processableStatuses={processableStatuses}
          currentItemId={currentItemId}
          setCurrentItemId={setCurrentItemId}
          itemsUpdateData={itemsUpdateData}
          handleSubmit={handleSubmit}
          handleEditChange={handleEditChange}
          handleStatusChange={handleStatusChange}
          stockStatus={stockStatus}
          highestPriorityGroupStatus={highestPriorityGroupStatus}
          getAllowedStatusChanges={getAllowedStatusChanges}
        />
      )}

    </div>
  );
};

export default Orders;
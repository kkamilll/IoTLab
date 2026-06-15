import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import OrderModal from "../components/orders/OrderModal";
import OrderGroupCard from "../components/orders/OrderGroupCard";
import PageHeader from "../components/layout/PageHeader";
import FilterBar from "../components/layout/FilterBar";
import Pagination from "../components/layout/Pagination";

import { rentalAgreementTemplate } from "../templates/rentalAgreementTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Orders = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [expanded, setExpanded] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editGroup, setEditGroup] = useState(null);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [itemsUpdateData, setItemsUpdateData] = useState({});
  const [datesUpdateData, setDatesUpdateData] = useState({});
  const [stockStatus, setStockStatus] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [validationError, setValidationError] = useState("");

  const processableStatuses = ["pending", "approved", "prepared"];
  const rejectableStatuses = ["pending", "approved", "prepared"];
  const nonRejectableStatuses = ["rented", "late", "returned"];
  const returnableStatuses = ["rented", "late"];
  const printableStatuses = ["prepared", "rented"];

  const fetchStatuses = async () => {
    try {
      const res = await apiClient.get("/orders/statuses");
      if (res.data.success) setOrderStatuses(res.data.statuses);
    } catch (error) { console.error(error); }
  };

  const fetchOrders = async (page = 1, limit = 20, email = "", status = "") => {
    try {
      const queryParams = new URLSearchParams({ page, limit, email, status });
      const res = await apiClient.get(`/orders?${queryParams.toString()}`);
      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.page);
      }
    } catch (error) { console.error("Error fetching orders:", error); }
  };

  const fetchProductStockStatus = async (productId, startDate, endDate) => {
    try {
      if (!productId || !startDate || !endDate) return null;
      const res = await apiClient.post("/products/stockStatus", {
        productId, startDate, endDate, orderId: editGroup.orderId,
      });
      if (res.data.success) return {
        availableToAssign: res.data.availableToAssign ?? 0,
        inDemand: res.data.inDemand ?? 0,
        requestsQuantity: res.data.requestsQuantity ?? 0,
        availableTotal: res.data.availableTotal ?? 0,
        rentedQuantity: res.data.rentedQuantity ?? 0,
      };
      return null;
    } catch (error) {
      console.error(error);
      showToast(error?.response?.data?.message || error.message || "Unknown error", "error");
    }
  };

  useEffect(() => { fetchOrders(1); fetchStatuses(); }, []);
  useEffect(() => { fetchOrders(1, 20, emailFilter, statusFilter); }, [statusFilter, emailFilter]);

  useEffect(() => {
    if (!editGroup || !itemsUpdateData || Object.keys(itemsUpdateData).length === 0) return;

    const fetchStockForItem = (item) => {
      const currentItem = itemsUpdateData[item._id];
      if (!currentItem) return;
      const { assignedStartDate, assignedEndDate } = datesUpdateData || {};
      if (!assignedStartDate || !assignedEndDate) return;
      fetchProductStockStatus(currentItem?.product?._id, assignedStartDate, assignedEndDate).then((data) => {
        setStockStatus((prev) => ({ ...prev, [currentItem.itemId]: data }));
      });
    };

    if (currentItemId && itemsUpdateData[currentItemId] && processableStatuses.includes(itemsUpdateData[currentItemId].status)) {
      fetchStockForItem({ _id: currentItemId });
      return;
    }
    editGroup.items.filter((item) => processableStatuses.includes(item.status)).forEach(fetchStockForItem);
  }, [editGroup, datesUpdateData?.assignedStartDate, datesUpdateData?.assignedEndDate]);

  const canProcessOrder = (status) => processableStatuses.includes(status);
  const canRejectOrder = (status) => rejectableStatuses.includes(status) && !nonRejectableStatuses.includes(status);
  const canPrepareOrder = (status) => status === "approved";
  const canRentOrder = (status) => status === "prepared";
  const canReturnOrder = (status) => returnableStatuses.includes(status);
  const canPrintOrder = (status) => printableStatuses.includes(status);

  const getAllowedStatusChanges = (status) => {
    if (status === "pending") return ["approved", "rejected"];
    if (status === "approved") return ["prepared", "rejected"];
    if (status === "prepared") return ["rented", "rejected"];
    return [];
  };

  const highestPriorityGroupStatus = useMemo(() => {
    if (!editGroup) return null;
    const processableItems = editGroup.items.filter((item) => processableStatuses.includes(item.status));
    if (processableItems.length === 0) return null;
    const minIndex = Math.min(...processableItems.map((item) => processableStatuses.indexOf(item.status)));
    return processableStatuses[minIndex];
  }, [editGroup]);

  const today = new Date().toISOString().split("T")[0];

  const handleUpdateOrderItems = async (group, filterFn, newStatus) => {
    try {
      const orderId = group?.orderId;
      if (!orderId) { showToast("Missing Order ID.", "error"); return; }
      const itemUpdates = group.items.filter(filterFn).map((item) => ({ ...item, itemId: item._id, newStatus }));
      if (!itemUpdates.length) return;
      const res = await apiClient.put(`/orders/updateOrder/${orderId}`, { itemUpdates });
      if (res.data.success) fetchOrders(1);
      else showToast(res.data.message || "Operation failed", "error");
    } catch (error) {
      console.error(error);
      showToast(error?.response?.data?.message || error.message || "Unknown error", "error");
    }
  };

  const handleRejectOrder  = (g) => handleUpdateOrderItems(g, (i) => rejectableStatuses.includes(i.status), "rejected");
  const handlePrepareOrder = (g) => {
    const start = g.dates?.assignedStartDate || g.dates?.requestedStartDate;
    if (start && new Date(start) < new Date(Date.now() - 60000)) {
      showToast("Cannot prepare order: Start date is in the past. Please use the 'Process' action to assign valid future dates.", "warning");
      return;
    }
    handleUpdateOrderItems(g, (i) => i.status === "approved", "prepared");
  };
  const handleRentOrder    = (g) => {
    const start = g.dates?.assignedStartDate || g.dates?.requestedStartDate;
    if (start && new Date(start) < new Date(Date.now() - 60000)) {
      showToast("Cannot rent order: Start date is in the past. Please use the 'Process' action to assign valid future dates.", "warning");
      return;
    }
    handleUpdateOrderItems(g, (i) => i.status === "prepared", "rented");
  };
  const handleReturnOrder  = (g) => handleUpdateOrderItems(g, (i) => returnableStatuses.includes(i.status), "returned");

  const downloadRentalAgreement = async (orderGroup) => {
    const { customerInfo, owner, items, dates } = orderGroup;
    const content = rentalAgreementTemplate({
      customerInfo: customerInfo ?? "Unknown",
      items: items.filter((item) => printableStatuses.includes(item.status)).map((i) => ({
        productName: i.product?.name ?? "Deleted Product",
        quantity: i.assignedQuantity ?? "-",
      })),
      startDate: new Date(dates.assignedStartDate).toLocaleDateString("en-GB"),
      endDate: new Date(dates.assignedEndDate).toLocaleDateString("en-GB"),
      today,
    });
    const container = document.createElement("div");
    container.innerHTML = content;
    container.style.width = "800px";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`RentalAgreement_${owner?.name ?? "Unknown"}.pdf`);
    document.body.removeChild(container);
  };

  const handleOpenModal = (group) => {
    setEditGroup(group);
    setItemsUpdateData(group.items.reduce((acc, item) => {
      acc[item._id] = {
        itemId: item._id, product: item.product,
        requestedQuantity: item?.requestedQuantity,
        assignedQuantity: item?.assignedQuantity ?? item?.requestedQuantity,
        prevStatus: item.status, newStatus: item.status,
      };
      return acc;
    }, {}));
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
    setOpenModal(false); setEditGroup(null);
    setItemsUpdateData({}); setDatesUpdateData({});
    setValidationError("");
  };

  const handleEditChange = (itemId, e) => {
    setValidationError("");
    const { name, value } = e.target;
    setItemsUpdateData((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [name]: value } }));
  };

  const handleStatusChange = (itemId, e) => {
    setValidationError("");
    const { name, value } = e.target;
    setItemsUpdateData((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [name]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    try {
      const orderId = editGroup?.orderId?.toString();
      if (!orderId) { setValidationError("Missing Order ID."); return; }

      for (const item of Object.values(itemsUpdateData)) {
        const isProcessable = processableStatuses.includes(item.newStatus);
        if (isProcessable) {
          if (!item.assignedQuantity || item.assignedQuantity < 1) {
            setValidationError(`${item?.product?.name}: Quantity must be >= 1`); return;
          }
          if (item.assignedQuantity > stockStatus?.[item.itemId]?.availableToAssign) {
            setValidationError(`${item?.product?.name}: Quantity exceeds available stock`); return;
          }
          if (item.prevStatus !== item.newStatus) continue;
          if (highestPriorityGroupStatus === "pending" && item.newStatus === highestPriorityGroupStatus) {
            setValidationError(`${item?.product?.name}: Status has to be changed.`); return;
          }
        }
      }

      const startDate = datesUpdateData?.assignedStartDate;
      const endDate = datesUpdateData?.assignedEndDate;
      if (!startDate || !endDate) { setValidationError("Both start and end dates are required"); return; }
      if (new Date(startDate) > new Date(endDate)) { setValidationError("Start date cannot be after end date"); return; }

      const hasActiveStatus = Object.values(itemsUpdateData).some((item) =>
        ["approved", "prepared", "rented"].includes(item.newStatus)
      );
      if (hasActiveStatus) {
        const bufferTime = new Date(Date.now() - 60000);
        if (new Date(startDate) < bufferTime) {
          setValidationError("Start date cannot be in the past for active orders!");
          return;
        }
      }

      const itemUpdates = Object.values(itemsUpdateData).map((item) => ({
        itemId: item.itemId, assignedQuantity: item.assignedQuantity, newStatus: item.newStatus,
      }));
      const dateUpdates = Object.fromEntries(
        Object.entries(datesUpdateData || {})
          .filter(([key]) => key === "assignedStartDate" || key === "assignedEndDate")
          .map(([key, value]) => [key, new Date(value)])
      );

      const res = await apiClient.put(`/orders/updateOrder/${orderId}`, { itemUpdates, ...dateUpdates });
      if (res.data.success) { fetchOrders(1); handleCloseModal(); }
      else setValidationError(res.data.message || "Operation failed");
    } catch (error) {
      console.error(error);
      setValidationError(error.response?.data?.message || error.message || "Operation failed");
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 md:p-8 bg-slate-50/30 dark:bg-slate-900/10">
      <PageHeader title="Order Management" subtitle="Track, review, approve, and finalize equipment rentals" />

      <FilterBar
        searchValue={emailFilter}
        onSearchChange={(e) => setEmailFilter(e.target.value)}
        searchPlaceholder="Filter by customer email..."
      >
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ textIndent: "8px", paddingLeft: "0px" }}
          className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 pr-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-250 outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[120px] w-full sm:w-auto"
        >
          <option value="">All</option>
          {orderStatuses.map((status, idx) => (
            <option key={idx} value={status}>{status}</option>
          ))}
        </select>
      </FilterBar>

      {orders.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium shadow-sm">
          <div className="text-4xl mb-3">📋</div>
          <p>No orders found</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 w-full">
            {orders
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((order) => {
                const itemsByOwner = order.items.reduce((acc, item) => {
                  const ownerId = item?.responsibleOwner?._id?.toString() || "unknown";
                  const ownerData = order.ownersData.find((od) => od.owner?.toString() === ownerId);
                  if (!acc[ownerId]) {
                    acc[ownerId] = {
                      orderId: order._id, items: [],
                      customerInfo: order.customer,
                      owner: item?.responsibleOwner || { name: "Unknown owner" },
                      ownerData, status: ownerData?.status,
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

                const totalItems = order.items.length;
                const customer = order.customer;
                const reqStart = new Date(order.requestedStartDate).toLocaleDateString("pl-PL");
                const reqEnd = new Date(order.requestedEndDate).toLocaleDateString("pl-PL");

                return (
                  <div key={order._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition overflow-hidden">
                    {/* Order header */}
                    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {customer?.firstName && customer?.lastName
                              ? `${customer.firstName} ${customer.lastName}`
                              : customer?.email || "Unknown customer"}
                          </span>
                          {customer?.email && customer?.firstName && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{customer.email}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          📅 {reqStart} → {reqEnd}
                          {customer?.fieldOfStudy && <span className="ml-2 text-slate-400">· {customer.fieldOfStudy}</span>}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {totalItems} item{totalItems !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Order groups */}
                    <div className="p-3">
                      {Object.values(itemsByOwner).map((group, idx) => (
                        <OrderGroupCard
                          key={idx}
                          order={order}
                          group={group}
                          expanded={expanded}
                          setExpanded={setExpanded}
                          canProcessOrder={canProcessOrder}
                          canRejectOrder={canRejectOrder}
                          canPrepareOrder={canPrepareOrder}
                          canRentOrder={canRentOrder}
                          canReturnOrder={canReturnOrder}
                          canPrintOrder={canPrintOrder}
                          handleOpenModal={handleOpenModal}
                          handleRejectOrder={handleRejectOrder}
                          handlePrepareOrder={handlePrepareOrder}
                          handleRentOrder={handleRentOrder}
                          handleReturnOrder={handleReturnOrder}
                          downloadRentalAgreement={downloadRentalAgreement}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => fetchOrders(Math.max(currentPage - 1, 1), 20, emailFilter, statusFilter)}
            onNext={() => fetchOrders(Math.min(currentPage + 1, totalPages), 20, emailFilter, statusFilter)}
          />
        </>
      )}

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
          validationError={validationError}
          setValidationError={setValidationError}
        />
      )}
    </div>
  );
};

export default Orders;
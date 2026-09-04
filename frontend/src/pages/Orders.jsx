import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { useLocation, useNavigate } from "react-router-dom";
import OrderModal from "../components/orders/OrderModal";
import OrderGroupCard from "../components/orders/OrderGroupCard";
import OrdersCalendar from "../components/orders/OrdersCalendar";
import PageHeader from "../components/layout/PageHeader";
import ConfirmModal from "../components/layout/ConfirmModal";
import FilterBar from "../components/layout/FilterBar";
import Pagination from "../components/layout/Pagination";
import { User, Info, Calendar, Hash, Phone, BookOpen, ClipboardList, Clock, CheckCircle2, AlertCircle, ChevronDown, Trash2 } from "lucide-react";

import { rentalAgreementTemplate } from "../templates/rentalAgreementTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { generateOrdersReportPDF, savePDF } from "../utils/pdfGenerator";

const getOrderBorderColor = (order) => {
  const statuses = order.ownersData?.map(od => od.status) || [];
  if (statuses.includes("late")) return "border-l-red-500 dark:border-l-red-400";
  if (statuses.includes("changed")) return "border-l-amber-500 dark:border-l-amber-400";
  if (statuses.includes("pending")) return "border-l-yellow-500 dark:border-l-yellow-400";
  if (statuses.includes("approved") || statuses.includes("prepared")) return "border-l-indigo-500 dark:border-l-indigo-400";
  if (statuses.includes("rented")) return "border-l-green-500 dark:border-l-green-400";
  if (statuses.includes("returned")) return "border-l-blue-500 dark:border-l-blue-400";
  if (statuses.includes("rejected")) return "border-l-slate-300 dark:border-l-slate-700";
  return "border-l-indigo-650 dark:border-l-indigo-500";
};

const Orders = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [ownerNameFilter, setOwnerNameFilter] = useState("");
  const [indexFilter, setIndexFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"

  useEffect(() => {
    if (location.state?.ownerId) {
      setOwnerFilter(location.state.ownerId);
      setOwnerNameFilter(location.state.ownerName || "");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [expanded, setExpanded] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState({});
  const [stats, setStats] = useState({ total: 0, pending: 0, rented: 0, late: 0 });
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroupCollapse = (orderId, ownerId) => {
    const key = `${orderId}-${ownerId}`;
    setCollapsedGroups((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const toggleAllGroupsInOrder = (orderId, itemsByOwner, forceExpand) => {
    setCollapsedGroups((prev) => {
      const nextState = { ...prev };
      Object.keys(itemsByOwner).forEach((ownerId) => {
        nextState[`${orderId}-${ownerId}`] = !forceExpand;
      });
      return nextState;
    });
  };

  const areAllGroupsExpanded = (orderId, itemsByOwner) => {
    return Object.keys(itemsByOwner).every(
      (ownerId) => !(collapsedGroups[`${orderId}-${ownerId}`] ?? true)
    );
  };

  const toggleCustomer = (orderId) => {
    setExpandedCustomer((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editGroup, setEditGroup] = useState(null);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [itemsUpdateData, setItemsUpdateData] = useState({});
  const [datesUpdateData, setDatesUpdateData] = useState({});
  const [stockStatus, setStockStatus] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });

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

  const fetchOrders = async (page = 1) => {
    try {
      const currentLimit = viewMode === "calendar" ? 1000 : limit;
      const queryParams = new URLSearchParams({
        page,
        limit: currentLimit,
        email: emailFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      if (ownerFilter) queryParams.append("ownerId", ownerFilter);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      if (indexFilter) queryParams.append("index", indexFilter);
      if (yearFilter) queryParams.append("yearOfStudy", yearFilter);
      if (semesterFilter) queryParams.append("semester", semesterFilter);
      if (fieldFilter) queryParams.append("fieldOfStudy", fieldFilter);
      const res = await apiClient.get(`/orders?${queryParams.toString()}`);
      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.page);
        setTotalOrders(res.data.totalOrders || 0);
        setStats(res.data.stats || { total: 0, pending: 0, rented: 0, late: 0 });
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

  useEffect(() => { fetchStatuses(); }, []);
  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, emailFilter, ownerFilter, limit, viewMode, sortBy, sortOrder, dateFrom, dateTo, indexFilter, yearFilter, semesterFilter, fieldFilter]);

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

  const handleDeleteOrder = (orderId) => {
    setConfirmConfig({
      isOpen: true,
      title: language === "pl" ? "Usuń zamówienie" : "Delete order",
      message: language === "pl"
        ? "Czy na pewno chcesz trwale usunąć to zamówienie? Spowoduje to również cofnięcie rezerwacji i aktualizację stanów magazynowych."
        : "Are you sure you want to permanently delete this order? This will also revert product reservations and update stock counts.",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await apiClient.delete(`/orders/${orderId}`);
          if (res.data.success) {
            showToast(
              language === "pl" ? "Zamówienie zostało usunięte." : "Order deleted successfully.",
              "success"
            );
            fetchOrders(1);
          } else {
            showToast(res.data.message || "Operation failed", "error");
          }
        } catch (error) {
          console.error(error);
          showToast(error?.response?.data?.message || error.message || "Unknown error", "error");
        }
      },
    });
  };

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
    savePDF(pdf, `RentalAgreement_${owner?.name ?? "Unknown"}.pdf`);
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
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950/80">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"📋 " + (language === "pl" ? "Zarządzanie Zamówieniami" : "Order Management")}
          subtitle={language === "pl" ? "Śledź, przeglądaj, zatwierdzaj i finalizuj wynajem sprzętu" : "Track, review, approve, and finalize equipment rentals"}
        />

        {/* Panel statystyk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Wszystkie zamówienia */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider select-none">
                {language === "pl" ? "Wszystkie zamówienia" : "Total Orders"}
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.total ?? 0}
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-xs group-hover:scale-110 transition-transform duration-300">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full translate-x-8 translate-y-8 select-none pointer-events-none" />
          </div>

          {/* Oczekujące */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider select-none">
                {language === "pl" ? "Oczekujące" : "Pending Approval"}
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.pending ?? 0}
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 rounded-2xl shadow-xs group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6" />
            </div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-400/5 rounded-full translate-x-8 translate-y-8 select-none pointer-events-none" />
          </div>

          {/* Wypożyczone */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider select-none">
                {language === "pl" ? "Wypożyczone" : "Active Rentals"}
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.rented ?? 0}
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-500 rounded-2xl shadow-xs group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full translate-x-8 translate-y-8 select-none pointer-events-none" />
          </div>

          {/* Opóźnione */}
          <div className={`relative overflow-hidden bg-gradient-to-br border rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 ${
            (stats.late ?? 0) > 0 
              ? "from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-900/40"
              : "from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-905/20 border-slate-200 dark:border-slate-800"
          }`}>
            <div className="flex flex-col gap-1 min-w-0">
              <span className={`text-[11px] font-black uppercase tracking-wider select-none ${
                (stats.late ?? 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
              }`}>
                {language === "pl" ? "Opóźnione" : "Overdue / Late"}
              </span>
              <span className={`text-3xl font-black tracking-tight ${
                (stats.late ?? 0) > 0 ? "text-rose-700 dark:text-rose-450" : "text-slate-900 dark:text-white"
              }`}>
                {stats.late ?? 0}
              </span>
            </div>
            <div className={`p-3 rounded-2xl shadow-xs group-hover:scale-110 transition-transform duration-300 ${
              (stats.late ?? 0) > 0 
                ? "bg-white dark:bg-slate-900 text-rose-650 dark:text-rose-400" 
                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 dark:bg-rose-400/5 rounded-full translate-x-8 translate-y-8 select-none pointer-events-none" />
          </div>
        </div>

        <FilterBar
        searchValue={emailFilter}
        onSearchChange={(e) => setEmailFilter(e.target.value)}
        searchPlaceholder={language === "pl" ? "Szukaj po emailu lub ID..." : "Search by email or ID..."}
        searchLabel={language === "pl" ? "Szukaj (Email / ID):" : "Search (Email / ID):"}
      >
        {/* Toggle Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`text-xs border rounded-xl px-3.5 py-2 font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm h-[38px] ${
            showAdvanced
              ? "border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-extrabold"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950"
          }`}
        >
          <span>{language === "pl" ? "Filtry szczegółowe" : "Advanced filters"}</span>
          <span className="text-[10px] opacity-70">⚡</span>
        </button>

        {/* View Mode Toggle */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          className={`text-xs border rounded-xl px-3.5 py-2 font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm h-[38px] ${
            viewMode === "calendar"
              ? "border-purple-500 bg-purple-500/10 text-purple-650 dark:text-purple-400 font-extrabold"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{viewMode === "list" ? (language === "pl" ? "Kalendarz" : "Calendar") : (language === "pl" ? "Lista" : "List")}</span>
        </button>

        {/* PDF Export Button */}
        <button
          type="button"
          onClick={() => generateOrdersReportPDF(orders, t, language)}
          className="text-xs border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-xl px-3.5 py-2 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm h-[38px]"
        >
          <span className="hidden sm:inline">{language === "pl" ? "Raport PDF" : "PDF Report"}</span>
          <span className="text-[12px]">📊</span>
        </button>
      </FilterBar>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm transition-all duration-300">
          {/* Status Filter */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full"
            >
              <option value="">{language === "pl" ? "Wszystkie" : "All"}</option>
              {orderStatuses.map((status, idx) => (
                <option key={idx} value={status}>{t(`statuses.${status}`) || status}</option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Sortuj:" : "Sort:"}
            </span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split("_");
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-705 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full"
            >
              <option value="createdAt_desc">{language === "pl" ? "Najnowsze zamówienia" : "Newest orders"}</option>
              <option value="createdAt_asc">{language === "pl" ? "Najstarsze zamówienia" : "Oldest orders"}</option>
              <option value="requestedStartDate_asc">{language === "pl" ? "Wynajem (najwcześniejszy)" : "Rental start (earliest)"}</option>
              <option value="requestedStartDate_desc">{language === "pl" ? "Wynajem (najpóźniejszy)" : "Rental start (latest)"}</option>
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Od (Data wynajmu):" : "From (Rental Date):"}
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full cursor-pointer"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Do (Data wynajmu):" : "To (Rental Date):"}
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full cursor-pointer"
            />
          </div>

          {/* Student Index Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Indeks studenta:" : "Student Index:"}
            </label>
            <input
              type="text"
              value={indexFilter}
              onChange={(e) => setIndexFilter(e.target.value)}
              placeholder={language === "pl" ? "np. 123456" : "e.g. 123456"}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full"
            />
          </div>

          {/* Year of study dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Rok studiów:" : "Year of Study:"}
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full"
            >
              <option value="">{language === "pl" ? "Wszystkie" : "All"}</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          {/* Semester dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Semestr:" : "Semester:"}
            </label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full"
            >
              <option value="">{language === "pl" ? "Wszystkie" : "All"}</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>

          {/* Field of Study Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
              {language === "pl" ? "Kierunek / Klasa:" : "Field of Study:"}
            </label>
            <input
              type="text"
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              placeholder={language === "pl" ? "np. Informatyka" : "e.g. Computer Science"}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-full"
            />
          </div>
        </div>
      )}

      {(ownerFilter || indexFilter || yearFilter || semesterFilter || fieldFilter || dateFrom || dateTo) && (
        <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl transition shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
            {language === "pl" ? "Aktywne filtry:" : "Active filters:"}
          </span>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Owner Filter Badge */}
            {ownerFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-sm">
                <span className="opacity-75">{language === "pl" ? "Opiekun: " : "Owner: "}</span>
                {ownerNameFilter || ownerFilter}
                <button
                  type="button"
                  onClick={() => { setOwnerFilter(""); setOwnerNameFilter(""); }}
                  className="hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer font-bold pl-0.5"
                  title={language === "pl" ? "Usuń filtr" : "Remove filter"}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Student Index Badge */}
            {indexFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-sm">
                <span className="opacity-75">{language === "pl" ? "Indeks: " : "Index: "}</span>
                {indexFilter}
                <button
                  type="button"
                  onClick={() => setIndexFilter("")}
                  className="hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer font-bold pl-0.5"
                  title={language === "pl" ? "Usuń filtr" : "Remove filter"}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Year of Study Badge */}
            {yearFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-sm">
                <span className="opacity-75">{language === "pl" ? "Rok: " : "Year: "}</span>
                {yearFilter}
                <button
                  type="button"
                  onClick={() => setYearFilter("")}
                  className="hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer font-bold pl-0.5"
                  title={language === "pl" ? "Usuń filtr" : "Remove filter"}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Semester Badge */}
            {semesterFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-sm">
                <span className="opacity-75">{language === "pl" ? "Semestr: " : "Semester: "}</span>
                {semesterFilter}
                <button
                  type="button"
                  onClick={() => setSemesterFilter("")}
                  className="hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer font-bold pl-0.5"
                  title={language === "pl" ? "Usuń filtr" : "Remove filter"}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Field of Study Badge */}
            {fieldFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-sm">
                <span className="opacity-75">{language === "pl" ? "Kierunek: " : "Field: "}</span>
                {fieldFilter}
                <button
                  type="button"
                  onClick={() => setFieldFilter("")}
                  className="hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer font-bold pl-0.5"
                  title={language === "pl" ? "Usuń filtr" : "Remove filter"}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Date From Badge */}
            {dateFrom && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-sm">
                <span className="opacity-75">{language === "pl" ? "Od: " : "From: "}</span>
                {dateFrom}
                <button
                  type="button"
                  onClick={() => setDateFrom("")}
                  className="hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer font-bold pl-0.5"
                  title={language === "pl" ? "Usuń filtr" : "Remove filter"}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Date To Badge */}
            {dateTo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-sm">
                <span className="opacity-75">{language === "pl" ? "Do: " : "To: "}</span>
                {dateTo}
                <button
                  type="button"
                  onClick={() => setDateTo("")}
                  className="hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer font-bold pl-0.5"
                  title={language === "pl" ? "Usuń filtr" : "Remove filter"}
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setEmailFilter("");
                setStatusFilter("");
                setOwnerFilter("");
                setOwnerNameFilter("");
                setIndexFilter("");
                setYearFilter("");
                setSemesterFilter("");
                setFieldFilter("");
                setDateFrom("");
                setDateTo("");
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ml-2"
            >
              {language === "pl" ? "Wyczyść wszystkie" : "Clear all"}
            </button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium shadow-sm">
          <div className="text-4xl mb-3">📋</div>
          <p>{language === "pl" ? "Nie znaleziono zamówień" : "No orders found"}</p>
        </div>
      ) : viewMode === "calendar" ? (
        <OrdersCalendar orders={orders} onEventClick={handleOpenModal} />
      ) : (
        <>
          <div className="flex flex-col gap-6 w-full">
            {orders
              .map((order) => {
                const itemsByOwner = order.items.reduce((acc, item) => {
                  const ownerId = item?.responsibleOwner?._id?.toString() || "unknown";
                  const ownerData = order.ownersData.find((od) => od.owner?.toString() === ownerId);
                  if (!acc[ownerId]) {
                    acc[ownerId] = {
                      orderId: order._id, items: [],
                      customerInfo: order.customer,
                      owner: item?.responsibleOwner || { name: language === "pl" ? "Nieznany opiekun" : "Unknown owner" },
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
                const reqStart = new Date(order.requestedStartDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
                const reqEnd = new Date(order.requestedEndDate).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });

                return (
                  <div key={order._id} className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 ${getOrderBorderColor(order)} shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden`}>
                    {/* Order header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.ownersData?.some(od => od.status === "late") && (
                            <span className="relative flex h-2 w-2 mr-0.5" title={language === "pl" ? "Opóźniony zwrot!" : "Overdue rental!"}>
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/35">
                            {language === "pl" ? "Student" : "Student"}
                          </span>
                          <span className="text-sm font-black text-slate-850 dark:text-slate-100 truncate">
                            {customer?.firstName && customer?.lastName
                              ? `${customer.firstName} ${customer.lastName}`
                              : customer?.email || (language === "pl" ? "Nieznany student" : "Unknown customer")}
                          </span>
                          {customer?.email && customer?.firstName && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{customer.email}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          📅 {reqStart} → {reqEnd}
                          {customer?.fieldOfStudy && <span className="ml-2 text-slate-400 font-medium">· {customer.fieldOfStudy}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {Object.keys(itemsByOwner).length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleAllGroupsInOrder(order._id, itemsByOwner, !areAllGroupsExpanded(order._id, itemsByOwner))}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                              areAllGroupsExpanded(order._id, itemsByOwner)
                                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/35"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855"
                            }`}
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${areAllGroupsExpanded(order._id, itemsByOwner) ? "rotate-180" : ""}`} />
                            <span className="hidden sm:inline">
                              {areAllGroupsExpanded(order._id, itemsByOwner)
                                ? (language === "pl" ? "Zwiń grupy" : "Collapse groups")
                                : (language === "pl" ? "Rozwiń grupy" : "Expand groups")}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => toggleCustomer(order._id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                            expandedCustomer[order._id]
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/35"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {expandedCustomer[order._id] ? (language === "pl" ? "Ukryj dane" : "Hide info") : (language === "pl" ? "Pokaż dane" : "Show info")}
                          </span>
                        </button>
                        {user?.role === "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer shadow-xs"
                            title={language === "pl" ? "Usuń zamówienie" : "Delete order"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {language === "pl" ? "Usuń" : "Delete"}
                            </span>
                          </button>
                        )}
                        <span className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-650 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/60">
                          {totalItems} {language === "pl" ? (totalItems === 1 ? "przedmiot" : "przedmioty/ów") : `item${totalItems !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Customer Details */}
                    {expandedCustomer[order._id] && (
                      <div className="bg-slate-50/40 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 p-4 transition-all duration-250">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Student Index */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 shadow-xs flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400">
                              <Hash className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {t("cart.studentIndex") || "Student Index"}
                              </p>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {customer?.index || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Field of Study */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 shadow-xs flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {t("cart.fieldOfStudy") || "Field of Study"}
                              </p>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={customer?.fieldOfStudy}>
                                {customer?.fieldOfStudy || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Year / Semester */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 shadow-xs flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-500 dark:text-purple-400">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {t("cart.yearOfStudy") || "Year"} / {t("cart.semester") || "Sem"}
                              </p>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {customer?.yearOfStudy ? `${customer.yearOfStudy} yr` : "—"} / {customer?.semester ? `${customer.semester} sem` : "—"}
                              </p>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 shadow-xs flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {t("cart.phoneNumber") || "Phone"}
                              </p>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {customer?.phoneNumber || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Notes / Purpose */}
                          {customer?.purpose && (
                            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/85 rounded-xl p-3.5 shadow-xs">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-indigo-500" />
                                {t("cart.purpose") || "Purpose / Notes"}
                              </p>
                              <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 italic bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-850 leading-relaxed break-words whitespace-normal">
                                "{customer.purpose}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                          isCollapsed={collapsedGroups[`${order._id}-${group.owner?._id || "unknown"}`] ?? true}
                          onToggleCollapse={() => toggleGroupCollapse(order._id, group.owner?._id || "unknown")}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">{language === "pl" ? "Na stronie:" : "Items per page:"}</span>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 pl-3 pr-8 py-1.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 cursor-pointer shadow-sm hover:border-slate-300"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={() => fetchOrders(Math.max(currentPage - 1, 1), limit, emailFilter, statusFilter, ownerFilter, sortBy, sortOrder, dateFrom, dateTo)}
              onNext={() => fetchOrders(Math.min(currentPage + 1, totalPages), limit, emailFilter, statusFilter, ownerFilter, sortBy, sortOrder, dateFrom, dateTo)}
            />
            <div className="text-xs text-slate-500 font-semibold">
              {language === "pl" ? `Razem: ${totalOrders || 0}` : `Total: ${totalOrders || 0}`}
            </div>
          </div>
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

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
      </div>
    </div>
  );
};

export default Orders;

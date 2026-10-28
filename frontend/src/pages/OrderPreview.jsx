// OrderPreview.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "../components/layout/ConfirmDialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Info,
  ArrowLeft,
  Hash,
  Copy,
  Check,
  X,
  AlertCircle,
  Package,
  User,
  Calendar,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

const getOrderStatus = (order) => {
  const statuses = order?.ownersData?.map((od) => od.status) || [];
  if (statuses.includes("late")) return "late";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("changed")) return "changed";
  if (statuses.includes("approved")) return "approved";
  if (statuses.includes("prepared")) return "prepared";
  if (statuses.includes("rented")) return "rented";
  if (statuses.includes("returned")) return "returned";
  if (statuses.includes("rejected")) return "rejected";
  return order?.status || "pending";
};

const getStatusBorderColor = (status) => {
  switch (status) {
    case "late":
      return "!border-l-red-500 dark:!border-l-red-400";
    case "changed":
      return "!border-l-amber-500 dark:!border-l-amber-400";
    case "pending":
      return "!border-l-yellow-500 dark:!border-l-yellow-400";
    case "approved":
    case "prepared":
      return "!border-l-indigo-500 dark:!border-l-indigo-400";
    case "rented":
      return "!border-l-green-500 dark:!border-l-green-400";
    case "returned":
      return "!border-l-blue-500 dark:!border-l-blue-400";
    case "rejected":
      return "!border-l-slate-400 dark:!border-l-slate-600";
    default:
      return "!border-l-indigo-650 dark:!border-l-indigo-500";
  }
};

const getOrderBorderColor = (order) => {
  return getStatusBorderColor(getOrderStatus(order));
};

export default function OrderPreview() {
  const { orderUUID } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [order, setOrder] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", variant: "info", onConfirm: null });

  const handleCopyOrderId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const openConfirm = (opts) => setConfirmDialog({ open: true, ...opts });
  const closeConfirm = () => setConfirmDialog((p) => ({ ...p, open: false, onConfirm: null }));

  const fetchOrder = async (secret) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/orders/customerOrder/${orderUUID}`, {
        headers: { "x-order-secret": secret },
      });
      setOrder(res.data.order);
      setIsAuthed(true);
      localStorage.setItem(`order-secret-${orderUUID}`, secret);
      setError("");
    } catch (err) {
      console.error(err);
      setOrder(null);
      setIsAuthed(false);
      localStorage.removeItem(`order-secret-${orderUUID}`);
      setError(t("orderPreview.invalidAccessCode"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSecret = localStorage.getItem(`order-secret-${orderUUID}`);
    if (savedSecret) fetchOrder(savedSecret);
    else setLoading(false);
  }, [orderUUID]);

  const handleLogin = (e) => {
    e.preventDefault();
    fetchOrder(password);
  };

  if (loading)
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-10 transition-colors duration-300">
        <div className="absolute top-6 left-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("common.back")}</span>
          </button>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-6 text-slate-600 dark:text-slate-300 shadow-lg flex items-center gap-3">
          <svg className="animate-spin w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t("orderPreview.loadingOrderDetails")}
        </div>
      </div>
    );

  if (!isAuthed) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12 transition-colors duration-300">
        {/* Top-left Back button */}
        <div className="absolute top-6 left-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("common.back")}</span>
          </button>
        </div>

        <div className="w-full max-w-md">
          {/* Brand/App logo or header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-3xl mb-4 shadow-sm">
              🔒
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              IoTLab
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("welcome.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-100 dark:border-slate-800 transition-colors duration-300"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              {t("orderPreview.enterOrderAccessCode")}
            </h3>
            
            {error && (
              <div className="mb-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-3.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition text-sm font-medium"
                  placeholder={t("orderPreview.secretCode")}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 shadow-lg hover:shadow-indigo-500/20 transition duration-100 cursor-pointer text-sm"
              >
                {t("orderPreview.accessOrderButton")}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 transition text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("common.back")}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!order)
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-10 transition-colors duration-300 gap-4">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-6 text-slate-600 dark:text-slate-300 shadow-lg text-center">
          <p className="font-semibold">{t("orderPreview.noOrderData")}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("common.back")}</span>
          </button>
        </div>
      </div>
    );

  const itemsByOwner = (order.items || []).reduce((acc, item) => {
    const ownerId = item?.responsibleOwner?._id?.toString() || "unknown";
    if (!acc[ownerId]) {
      const ownerData = (order.ownersData || []).find(
        (od) => od.owner?.toString() === ownerId,
      );
      acc[ownerId] = {
        orderId: order._id,
        owner: item.responsibleOwner || { name: "Unknown" },
        ownerData,
        status: ownerData?.status || "pending",
        items: [],
        dates: {
          requestedStartDate: order.requestedStartDate,
          requestedEndDate: order.requestedEndDate,
          assignedStartDate: ownerData?.assignedStartDate,
          assignedEndDate: ownerData?.assignedEndDate,
        },
        hasAssignedDates: !!(
          ownerData?.assignedStartDate && ownerData?.assignedEndDate
        ),
      };
    }
    acc[ownerId].items.push(item);
    return acc;
  }, {});

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

  const StatusBadge = ({ status }) => {
    const getIcon = (s) => {
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
        {getIcon(status)}
        <span>{t(`statuses.${status}`) || status}</span>
      </span>
    );
  };

  const handleOwnerAction = async (ownerGroup, approval) => {
    try {
      const secret = localStorage.getItem(`order-secret-${orderUUID}`);
      const customerUpdate = {
        ownerId: ownerGroup.owner?._id,
        customerApproval: approval,
      };

      await apiClient.post(
        `/orders/customerUpdate/${ownerGroup.orderId}`,
        customerUpdate,
        { headers: { "x-order-secret": secret } },
      );

      fetchOrder(secret);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const overallStatus = getOrderStatus(order);
  const isLate = order.ownersData?.some((od) => od.status === "late");

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">
        <div className={`mb-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 border-l-4 ${getOrderBorderColor(order)} bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all duration-300 overflow-hidden`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {isLate && (
                  <span className="relative flex h-2.5 w-2.5 shrink-0" title={language === "pl" ? "Opóźniony zwrot!" : "Overdue rental!"}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
                <div
                  onClick={(e) => handleCopyOrderId(e, order.uuid || order._id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer"
                  title={language === "pl" ? "Kliknij, aby skopiować ID" : "Click to copy ID"}
                >
                  <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>#{(order.uuid ? order.uuid.slice(0, 8) : order._id.slice(-8)).toUpperCase()}</span>
                  {copiedOrderId === (order.uuid || order._id) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 shrink-0" />
                  )}
                </div>
                <StatusBadge status={overallStatus} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {t("orderPreview.orderPreviewTitle")}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("orderPreview.orderPreviewSub")}
              </p>
            </div>
            <button
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate('/');
              }}
              className="self-start rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("common.back")}</span>
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                {t("orderPreview.customer")}
              </h2>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 break-words">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 break-all mt-1">
                {t("cart.email")}: {order.customer.email}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t("cart.phone")}: {order.customer.phoneNumber}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{t("orderPreview.rentalDates")}</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                {t("orderPreview.requested")}:{" "}
                {new Date(order.requestedStartDate).toLocaleDateString()} →{" "}
                {new Date(order.requestedEndDate).toLocaleDateString()}
              </p>
              {order.ownersData?.some(
                (owner) => owner.assignedStartDate && owner.assignedEndDate,
              ) && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t("orderPreview.assignedDatesComment")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.values(itemsByOwner).map((group, idx) => (
            <div
              key={idx}
              className={`rounded-3xl border border-slate-200/80 dark:border-slate-800 border-l-4 ${getStatusBorderColor(group.status)} bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
                      {group.owner?.profileImage ? (
                        <img
                          src={`${API_BASE}/uploads/users/${group.owner.profileImage}`}
                          alt={group.owner?.name || "Supervisor"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35">
                        {language === "pl" ? "Opiekun" : "Supervisor"}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate" title={group.owner?.name}>
                        {group.owner?.name}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <StatusBadge status={group.status} />
                    {group.ownerData?.customerApproval != null && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        group.ownerData.customerApproval
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50"
                          : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/50"
                      }`}>
                        {group.ownerData.customerApproval ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>{language === "pl" ? "Zaakceptowano przez Ciebie" : "Approved by you"}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-rose-500" />
                            <span>{language === "pl" ? "Odrzucono przez Ciebie" : "Rejected by you"}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0 self-start sm:self-auto">
                  {group.items.length} {group.items.length !== 1 ? t("cart.items") : t("cart.item")}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {t("orderPreview.requested")}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 font-mono">
                    {new Date(
                      group.dates.requestedStartDate,
                    ).toLocaleDateString()}{" "}
                    →{" "}
                    {new Date(
                      group.dates.requestedEndDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
                {group.hasAssignedDates && (
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {t("orderPreview.assigned")}
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 font-mono">
                      {new Date(
                        group.dates.assignedStartDate,
                      ).toLocaleDateString()}{" "}
                      →{" "}
                      {new Date(
                        group.dates.assignedEndDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {group.items.map((item, i) => {
                  const imgSrc = item?.product?.image
                    ? (item.product.image.startsWith("http")
                        ? item.product.image
                        : `${API_BASE}/uploads/products/${item.product.image}`)
                    : null;

                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
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
                          <p className="font-bold text-sm text-slate-900 dark:text-white break-words [overflow-wrap:anywhere]">
                            {item.product?.name || "Unknown product"}
                          </p>
                          {item.product?.category?.name && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.product.category.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{language === "pl" ? "Wnioskowano:" : "Requested:"}</span>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                            {item.requestedQuantity ?? 1} {language === "pl" ? "szt." : "pcs"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{language === "pl" ? "Przydzielono:" : "Assigned:"}</span>
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                            (item.assignedQuantity ?? item.requestedQuantity ?? 1) > 0
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}>
                            {item.assignedQuantity ?? item.requestedQuantity ?? 1} {language === "pl" ? "szt." : "pcs"}
                          </span>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {group.status === "approved" &&
                group.ownerData.customerApproval == null && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() =>
                        openConfirm({
                          title: language === "pl" ? "Zaakceptuj zamówienie?" : "Approve order?",
                          message: language === "pl"
                            ? "Czy na pewno chcesz zaakceptować to zamówienie? Sprzęt zostanie dla Ciebie przygotowany."
                            : "Are you sure you want to approve this order? The equipment will be prepared for you.",
                          variant: "info",
                          onConfirm: () => { closeConfirm(); handleOwnerAction(group, true); },
                        })
                      }
                      className="w-full rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition cursor-pointer"
                    >
                      {t("orderPreview.approve")}
                    </button>
                    <button
                      onClick={() =>
                        openConfirm({
                          title: language === "pl" ? "Odrzuć zamówienie?" : "Reject order?",
                          message: language === "pl"
                            ? "Czy na pewno chcesz odrzucić to zamówienie?"
                            : "Are you sure you want to reject this order?",
                          variant: "danger",
                          onConfirm: () => { closeConfirm(); handleOwnerAction(group, false); },
                        })
                      }
                      className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition cursor-pointer"
                    >
                      {t("orderPreview.reject")}
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

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
}

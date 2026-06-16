// OrderPreview.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useLanguage } from "../context/LanguageContext";

export default function OrderPreview() {
  const { orderUUID } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [order, setOrder] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-10 transition-colors duration-300">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 px-8 py-6 text-slate-650 dark:text-slate-300 shadow-lg flex items-center gap-3">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12 transition-colors duration-300">
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
            className="rounded-3xl bg-white dark:bg-slate-850 p-8 shadow-xl border border-slate-150 dark:border-slate-800 transition-colors duration-300"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              {t("orderPreview.enterOrderAccessCode")}
            </h3>
            
            {error && (
              <div className="mb-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-4 py-3 text-sm text-red-650 dark:text-red-400 flex items-center gap-2">
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
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
                  placeholder={t("orderPreview.secretCode")}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 shadow-lg hover:shadow-indigo-500/20 transition duration-150 cursor-pointer"
              >
                {t("orderPreview.accessOrderButton")}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-10 transition-colors duration-300">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 px-8 py-6 text-slate-650 dark:text-slate-300 shadow-lg">
          {t("orderPreview.noOrderData")}
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-slate-700";
    }
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-6 shadow-2xl transition-colors duration-300">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {t("orderPreview.orderPreviewTitle")}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("orderPreview.orderPreviewSub")}
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="self-start rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {t("common.back")}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                {t("orderPreview.customer")}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("cart.email")}: {order.customer.email}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("cart.phone")}: {order.customer.phoneNumber}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                {t("orderPreview.rentalDates")}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
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
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-6 shadow-sm transition-colors duration-300"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {group.owner.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t("orderPreview.groupStatus")}:{" "}
                    <span className={getStatusColor(group.status)}>
                      {group.status}
                    </span>
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {group.items.length} {group.items.length !== 1 ? t("cart.items") : t("cart.item")}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {t("orderPreview.requested")}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
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
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
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
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.product?.name || "Unknown product"}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-305">
                      {t("orderPreview.quantity")}: {item.requestedQuantity}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-305">
                      {t("common.status")}: {item.status}
                    </p>
                  </div>
                ))}
              </div>

              {group.status === "approved" &&
                group.ownerData.customerApproval == null && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleOwnerAction(group, true)}
                      className="w-full rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition cursor-pointer"
                    >
                      {t("orderPreview.approve")}
                    </button>
                    <button
                      onClick={() => handleOwnerAction(group, false)}
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
    </div>
  );
}

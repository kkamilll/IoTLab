// OrderPreview.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../api/apiClient";

export default function OrderPreview() {
  const { orderUUID } = useParams();
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
      setError("Invalid or expired access code.");
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-slate-600 shadow-lg">
          Loading order details…
        </div>
      </div>
    );

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 flex items-center justify-center px-4 py-10">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-200"
        >
          <h2 className="text-2xl font-bold mb-4 text-slate-900 text-center">
            Enter Order Access Code
          </h2>
          {error && (
            <p className="mb-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Secret code"
          />
          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
          >
            Access Order
          </button>
        </form>
      </div>
    );
  }

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-slate-600 shadow-lg">
          No order data available.
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
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Order Preview
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Review your order and confirm each owner group.
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="self-start rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Back
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Customer
              </h2>
              <p className="text-sm text-slate-600">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="text-sm text-slate-600">
                Email: {order.customer.email}
              </p>
              <p className="text-sm text-slate-600">
                Phone: {order.customer.phoneNumber}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Rental Dates
              </h2>
              <p className="text-sm text-slate-600">
                Requested:{" "}
                {new Date(order.requestedStartDate).toLocaleDateString()} →{" "}
                {new Date(order.requestedEndDate).toLocaleDateString()}
              </p>
              {order.ownersData?.some(
                (owner) => owner.assignedStartDate && owner.assignedEndDate,
              ) && (
                <p className="mt-2 text-sm text-slate-600">
                  Assigned dates may vary per owner.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.values(itemsByOwner).map((group, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {group.owner.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Group status:{" "}
                    <span className={getStatusColor(group.status)}>
                      {group.status}
                    </span>
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Requested
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
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
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Assigned
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
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
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {item.product?.name || "Unknown product"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Quantity: {item.requestedQuantity}
                    </p>
                    <p className="text-sm text-slate-600">
                      Status: {item.status}
                    </p>
                  </div>
                ))}
              </div>

              {group.status === "approved" &&
                group.ownerData.customerApproval == null && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleOwnerAction(group, true)}
                      className="w-full rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleOwnerAction(group, false)}
                      className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
                    >
                      Reject
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

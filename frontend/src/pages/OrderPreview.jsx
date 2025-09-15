// OrderPreview.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

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
      const res = await axios.get(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/customerOrder/${orderUUID}`,
        { headers: { "x-order-secret": secret } }
      );
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

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  if (!isAuthed) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white shadow-md rounded-xl p-6 w-80">
          <h2 className="text-xl font-semibold mb-4 text-center">Enter Access Code</h2>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded w-full p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Secret code"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Access Order
          </button>
        </form>
      </div>
    );
  }

  if (!order) return <div className="text-center p-6 text-gray-500">No order data</div>;

  // Group items by owner
  const itemsByOwner = (order.items || []).reduce((acc, item) => {
    const ownerId = item?.responsibleOwner?._id?.toString() || "unknown";
    if (!acc[ownerId]) {
      const ownerData = (order.ownersData || []).find(od => od.owner?.toString() === ownerId);
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
        hasAssignedDates: !!(ownerData?.assignedStartDate && ownerData?.assignedEndDate),
      };
    }
    acc[ownerId].items.push(item);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "text-yellow-600";
      case "approved": return "text-green-600";
      case "rejected": return "text-red-600";
      default: return "text-gray-700";
    }
  };

  const handleOwnerAction = async (ownerGroup, approval) => {
    try {
      const secret = localStorage.getItem(`order-secret-${orderUUID}`);
      const customerUpdate = {
        ownerId: ownerGroup.owner?._id,
        customerApproval: approval, // true = Approve, false = Reject
      };

      await axios.post(
        `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/orders/customerUpdate/${ownerGroup.orderId}`,
        customerUpdate,
        { headers: { "x-order-secret": secret } }
      );

      fetchOrder(secret); // refresh
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white shadow-lg rounded-xl p-6">
      <h1 className="text-2xl font-bold mb-4">Order Preview</h1>

      <section className="mb-6">
        <h2 className="font-semibold text-gray-700 mb-2">Customer Info:</h2>
        <p>{order.customer.firstName} {order.customer.lastName}</p>
        <p>Email: {order.customer.email}</p>
        <p>Phone: {order.customer.phoneNumber}</p>
        <p>Index: {order.customer.index}</p>
        <p>Field: {order.customer.fieldOfStudy}</p>
        <p>Semester: {order.customer.semester}, Year: {order.customer.yearOfStudy}</p>
      </section>

      <section className="mb-6">
        {Object.values(itemsByOwner).map((group, idx) => (
          <div key={idx} className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-1">Owner: {group.owner.name}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Status: <span className={getStatusColor(group.status)}>{group.status}</span>
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Requested: {new Date(group.dates.requestedStartDate).toLocaleDateString()} → {new Date(group.dates.requestedEndDate).toLocaleDateString()}
            </p>
            {group.hasAssignedDates && (
              <p className="text-sm text-blue-600 mb-2">
                Assigned: {new Date(group.dates.assignedStartDate).toLocaleDateString()} → {new Date(group.dates.assignedEndDate).toLocaleDateString()}
              </p>
            )}

            <ul className="list-disc list-inside mb-2">
              {group.items.map((item, i) => (
                <li key={i}>
                  {item.product?.name || "Unknown"} — Qty: {item.requestedQuantity} — Status: {item.status}
                </li>
              ))}
            </ul>

            {group.status === "approved" && group.ownerData.customerApproval == null && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleOwnerAction(group, true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleOwnerAction(group, false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            )}

          </div>
        ))}
      </section>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ReturnedOrders = () => {
  const { token } = useAuth();
  const [returnedOrders, setReturnedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch returned orders
  const fetchReturnedOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3500/orders/returned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setReturnedOrders(res.data.orders);
      }
    } catch (err) {
      console.error("Error fetching returned orders:", err);
      alert(err.response?.data?.message || "Error fetching returned orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnedOrders();
  }, []);

  // Handle returning an order
  const handleReturnOrder = async (orderId) => {
    try {
      const res = await axios.post(
        "http://localhost:3500/orders/returned",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setReturnedOrders((prev) => [...prev, res.data.order]);
      }
    } catch (err) {
      console.error("Error returning order:", err);
      alert(err.response?.data?.message || "Error returning order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded shadow-md p-8 flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">
          Returned Orders
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                <th className="border border-gray-300 p-3 text-left">Product</th>
                <th className="border border-gray-300 p-3 text-right">Quantity</th>
                <th className="border border-gray-300 p-3 text-left">Description</th>
                <th className="border border-gray-300 p-3 text-center">Status</th>
                <th className="border border-gray-300 p-3 text-center">Return Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : returnedOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-500">
                    No returned orders
                  </td>
                </tr>
              ) : (
                returnedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-3">{order.product?.name || "Deleted product"}</td>
                    <td className="border border-gray-300 p-3 text-right">{order.quantity}</td>
                    <td className="border border-gray-300 p-3">{order.product?.description || "No description"}</td>
                    <td className="border border-gray-300 p-3 text-center text-green-600 font-semibold">
                      {order.isReturned ? "Returned" : (
                        <button
                          onClick={() => handleReturnOrder(order._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                          Return
                        </button>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3 text-center">
                      {order.returnedAt ? new Date(order.returnedAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReturnedOrders;

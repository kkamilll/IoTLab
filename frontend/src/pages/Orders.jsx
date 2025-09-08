import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Orders = () => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statuses, setStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState(1);
  // const [editingDates, setEditingDates] = useState(null);
  // const [newStartDate, setNewStartDate] = useState("");
  // const [newEndDate, setNewEndDate] = useState("");
  const [editingDates, setEditingDates] = useState(null);
  const cardsPerPage = 4;

  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders/statuses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setStatuses(res.data.statuses);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setOrders(res.data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStatuses();
  }, []);

  // Reset page when filters change
  useEffect(() => setCurrentPage(1), [statusFilter, emailFilter]);
  // Filtered & paginated orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusMatch =
        statusFilter === ""
          ? order.status !== "NIE_OK" && !order.isReturned
          : statusFilter === "ZWROCONO"
            ? order.isReturned
            : order.status === statusFilter;

      const emailMatch = order.customer?.email
        ?.toLowerCase()
        .includes(emailFilter.toLowerCase());
      return statusMatch && emailMatch;
    });
  }, [orders, statusFilter, emailFilter]);

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(filteredOrders.length / cardsPerPage);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // --- Admin actions ---

  const handleDeleteOrder = async (order) => {
    if (!window.confirm("Czy na pewno chcesz usunąć to zamówienie?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders/${order._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Błąd usuwania zamówienia");
    }
  };

  const handleReturnOrder = async (order) => {
    if (!window.confirm("Czy na pewno chcesz zwrócić to zamówienie?")) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders/returned`,
        { orderId: order._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Błąd zwrotu zamówienia");
    }
  };

  const handleUpdateStatus = async (order, newStatus) => {
    let statusToSend = newStatus;

    if (newStatus === "OK") {
      const today = new Date().setHours(0, 0, 0, 0);
      const startDate = new Date(order.startDate).setHours(0, 0, 0, 0);

      if (today < startDate) {
        return alert(
          `Nie możesz ustawić statusu OK – wypożyczenie zaczyna się dopiero ${new Date(
            order.startDate
          ).toLocaleDateString("pl-PL")}`
        );
      } else {
        statusToSend = "DO_ODBIORU";
      }
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders/update-status`,
        { orderId: order._id, status: statusToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Błąd aktualizacji statusu");
    }
  };

  const handleMarkAsReceived = async (order) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders/update-status`,
        { orderId: order._id, status: "OK", markAsReceived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Błąd aktualizacji statusu");
    }
  };

  // --- Quantity editing ---

  const handleEditQuantity = (orderId, item) => {
    const maxQty =
      (item.product?.stockForRent || item.available || 1) -
      (item.bookedQuantity || 0);

    setEditingItem({
      orderId,
      itemId: item.product?._id || item._id,
      maxQuantity: Math.max(maxQty, 1),
    });
    setNewQuantity(item.quantity);
  };

  const handleSaveQuantity = async () => {
    if (newQuantity < 1 || newQuantity > editingItem.maxQuantity) {
      return alert(`Ilość musi być między 1 a ${editingItem.maxQuantity}`);
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders/update-quantity`,
        {
          orderId: editingItem.orderId,
          itemId: editingItem.itemId,
          quantity: newQuantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Błąd aktualizacji ilości");
    }
  };

  // --- Date editing ---

  const handleEditDates = (order, item) => {
    setEditingDates({
      orderId: order._id,
      itemId: item.product?._id || item._id,
      startDate: item.requested?.startDate || "",
      endDate: item.requested?.endDate || ""
    });
  };

  const handleSaveDates = async () => {
    if (!editingDates.startDate || !editingDates.endDate)
      return alert("Podaj obie daty!");
    if (editingDates.startDate > editingDates.endDate)
      return alert("Data rozpoczęcia nie może być późniejsza niż zakończenia!");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_IP}:${import.meta.env.VITE_API_PORT}/orders/update-dates`,
        {
          orderId: editingDates.orderId,
          itemId: editingDates.itemId,
          startDate: editingDates.startDate,
          endDate: editingDates.endDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      setEditingDates(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Błąd aktualizacji dat");
    }
  };

  // --- Helpers for button visibility ---

  const canEditQuantity = (order, item) =>
    isAdmin && !order.isReturned && order.status !== "OK" && !item.quantityEdited;

  const canEditDates = (order) =>
    isAdmin && !order.isReturned && order.status !== "OK" && order.status !== "DO_ODBIORU";

  const canReturn = (order) => isAdmin && !order.isReturned && order.status === "OK";

  const canSetStatus = (order) => isAdmin && !order.isReturned && order.status === "DO_REALIZACJI";

  const canMarkReceived = (order) => isAdmin && !order.isReturned && order.status === "DO_ODBIORU";

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
            {statuses.map((status, idx) => (
              <option key={idx} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center p-6 text-gray-500">Brak wypożyczeń</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentOrders
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((order) => (
                  <div key={order._id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 hover:shadow-md transition relative">
                    {order.isReturned && (
                      <span className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs font-bold">ZWROCONO</span>
                    )}

                    <h2 className="text-lg font-semibold text-gray-700">{order?.customer?.email || "Brak maila"}</h2>

                    <p className="text-sm text-gray-500">
                      Status:{" "}
                      <span className={`font-medium ${order.isReturned
                        ? "text-yellow-600"
                        : order.status === "OK"
                          ? "text-green-600"
                          : order.status === "NIE_OK"
                            ? "text-red-600"
                            : order.status === "DO_ODBIORU"
                              ? "text-blue-600"
                              : "text-gray-700"
                        }`}>
                        {order.isReturned ? "ZWROCONO" : order.status}
                      </span>
                    </p>

                    {/* Items */}
                    <div className="border-t border-gray-200 pt-2">
                      <h3 className="text-gray-600 font-medium mb-1">Produkty:</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="text-gray-700 flex flex-col gap-1">
                            {/* Product row */}
                            <div className="flex items-center gap-2">
                              {item?.product?.name || "Produkt usunięty"} x {item?.requested?.quantity}
                              {editingItem?.orderId === order._id &&
                                editingItem?.itemId === (item.product?._id || item._id) ? (
                                <>
                                  <input
                                    type="number"
                                    value={newQuantity || 0}
                                    min={1}
                                    max={editingItem.maxQuantity}
                                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                                    className="border p-1 w-16 rounded"
                                  />
                                  <button onClick={handleSaveQuantity} className="bg-blue-500 text-white px-2 py-1 rounded">Zapisz</button>
                                  <button onClick={() => setEditingItem(null)} className="bg-gray-400 text-white px-2 py-1 rounded">Anuluj</button>
                                </>
                              ) : (
                                <>
                                  <span>{item.quantity}</span>
                                  {item.quantityEdited && <span className="text-green-600 font-semibold ml-2">Edytowano</span>}
                                  {canEditQuantity(order, item) && (
                                    <button
                                      onClick={() => handleEditQuantity(order._id, item)}
                                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                                    >
                                      Edytuj ilość
                                    </button>
                                  )}
                                </>
                              )}
                              {item?.confirmed?.quantity && (
                                <p className="ml-2">approved quantity: {item?.confirmed?.quantity}</p>
                              )}
                            </div>

                            {/* Dates row */}
                            <div className="text-sm text-gray-600">
                              Okres wypożyczenia:{" "}
                              {editingDates?.orderId === order._id &&
                                editingDates?.itemId === (item.product?._id || item._id) ? (
                                <>
                                  <input
                                    type="date"
                                    value={editingDates.startDate}
                                    onChange={(e) =>
                                      setEditingDates({ ...editingDates, startDate: e.target.value })
                                    }
                                    className="border p-1 rounded mr-1"
                                  />
                                  do
                                  <input
                                    type="date"
                                    value={editingDates.endDate}
                                    onChange={(e) =>
                                      setEditingDates({ ...editingDates, endDate: e.target.value })
                                    }
                                    className="border p-1 rounded ml-1"
                                  />
                                  <button
                                    onClick={handleSaveDates}
                                    className="bg-blue-500 text-white px-2 py-1 rounded ml-2"
                                  >
                                    Zapisz
                                  </button>
                                  <button
                                    onClick={() => setEditingDates(null)}
                                    className="bg-gray-400 text-white px-2 py-1 rounded ml-1"
                                  >
                                    Anuluj
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span>
                                    {item.requested?.startDate
                                      ? new Date(item.requested.startDate).toLocaleDateString("pl-PL")
                                      : "nie podano"}{" "}
                                    do{" "}
                                    {item.requested?.endDate
                                      ? new Date(item.requested.endDate).toLocaleDateString("pl-PL")
                                      : "nie podano"}
                                  </span>
                                  {canEditDates(order) && (
                                    <button
                                      onClick={() => handleEditDates(order, item)}
                                      className="bg-yellow-500 text-white px-2 py-1 rounded ml-2"
                                    >
                                      Edytuj daty
                                    </button>
                                  )}
                                </>
                              )}
                              {item?.confirmed?.startDate && item?.confirmed?.endDate && (
                                <div className="ml-2 text-sm text-gray-600">
                                  <p className="font-medium text-gray-700">Approved dates:</p>
                                  <p>📅 Start: {new Date(item.confirmed.startDate).toLocaleDateString("pl-PL")}</p>
                                  <p>📅 End: {new Date(item.confirmed.endDate).toLocaleDateString("pl-PL")}</p>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>

                    </div>



                    {/* Admin actions */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {canReturn(order) && <button onClick={() => handleReturnOrder(order)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg">Zwróć</button>}
                      {canDeleteOrder(order) && <button onClick={() => handleDeleteOrder(order)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg">Usuń</button>}
                      {canSetStatus(order) && (
                        <>
                          <button onClick={() => handleUpdateStatus(order, "DO_ODBIORU")} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg">OK</button>
                          <button onClick={() => handleUpdateStatus(order, "NIE_OK")} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg">NIE_OK</button>
                        </>
                      )}
                      {canMarkReceived(order) && <button onClick={() => handleMarkAsReceived(order)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">ODEBRANO</button>}
                    </div>
                  </div>
                ))}
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
    </div>
  );
};

export default Orders;

// Helper to check delete permission
const canDeleteOrder = (order) => order.status === "OK" || order.status === "NIE_OK";

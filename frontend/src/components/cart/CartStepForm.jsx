import React from "react";
import { User, Package, Calendar } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

const getImageUrl = (item) => {
  if (item?.image) {
    if (typeof item.image === "string") {
      if (item.image.startsWith("http://") || item.image.startsWith("https://")) return item.image;
      const fName = item.image.split(/[/\\]/).pop();
      return `${API_BASE}/uploads/products/${fName}`;
    }
  }
  if (!item || !item.images || !Array.isArray(item.images) || item.images.length === 0) {
    return null;
  }
  const imgObj = item.images.find((i) => i && (i.isVisible || i.visible)) || item.images[0];
  if (!imgObj) return null;

  let rawPath = "";
  if (typeof imgObj === "string") {
    rawPath = imgObj;
  } else if (typeof imgObj === "object") {
    rawPath = imgObj.filename || imgObj.path || imgObj.url || imgObj.src || imgObj.originalName || "";
  }

  if (!rawPath) return null;
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath;
  }

  const fileName = rawPath.includes("/") || rawPath.includes("\\")
    ? rawPath.split(/[/\\]/).pop()
    : rawPath;

  if (!fileName) return null;
  return `${API_BASE}/uploads/products/${fileName}`;
};

const CartStepForm = ({
  orderCustomer,
  handleCustomerChange,
  cart,
  orderDates,
  dateMode = "same",
  recaptchaKey,
  recaptchaRef,
  handleCheckout,
  loading,
  canCheckout,
  setCheckoutStep,
  t,
  language,
}) => {
  const inputClass =
    "text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 transition w-full shadow-xs";

  return (
    <div className="flex flex-col gap-6 w-full">
        {/* Customer Details Form */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 select-none border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-4.5 h-4.5 text-indigo-500" />
            {t("cart.customerInfo")}
          </h3>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.firstName")}
              <input name="firstName" value={orderCustomer.firstName} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. Jan" : "e.g. John"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.lastName")}
              <input name="lastName" value={orderCustomer.lastName} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. Kowalski" : "e.g. Doe"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.phoneNumber")}
              <input name="phoneNumber" value={orderCustomer.phoneNumber} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. 500600700" : "e.g. 500600700"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.email")}
              <input name="email" type="email" value={orderCustomer.email} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. student@uczelnia.pl" : "e.g. student@university.edu"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.studentIndex")}
              <input name="index" value={orderCustomer.index} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. 123456" : "e.g. 123456"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.fieldOfStudy")}
              <input name="fieldOfStudy" value={orderCustomer.fieldOfStudy} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. Informatyka" : "e.g. Computer Science"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.yearOfStudy")}
              <input name="yearOfStudy" type="number" min="1" max="7" value={orderCustomer.yearOfStudy} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. 3" : "e.g. 3"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.semester")}
              <input name="semester" type="number" min="1" max="14" value={orderCustomer.semester} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. 5" : "e.g. 5"} required />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.specialization")}
              <input name="specialization" value={orderCustomer.specialization} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. IoT" : "e.g. IoT"} />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.purpose")}
              <textarea
                name="purpose"
                value={orderCustomer.purpose}
                onChange={handleCustomerChange}
                rows={3}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 transition w-full resize-none shadow-xs"
                placeholder={language === "pl" ? "Podaj cel rezerwacji / przeznaczenie wypożyczanego sprzętu..." : "Provide the purpose of the reservation / intended use of the rented equipment..."}
                required
              />
            </label>
          </div>
        </div>

        {/* Items Recap */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 select-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              <span>{language === "pl" ? "Przegląd rezerwowanych obiektów" : "Selected items review"}</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
              {cart.length} {language === "pl" ? (cart.length === 1 ? "pozycja" : "pozycji") : "items"}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => {
              const imgUrl = getImageUrl(item);
              const categoryName = item.category?.name || (typeof item.category === "string" ? item.category : null) || item.categories?.[0]?.name;
              const ownerName = item.owner?.name;

              return (
                <div
                  key={item._id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-200 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${imgUrl ? "hidden" : ""}`}>
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {categoryName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {categoryName}
                          </span>
                        )}
                        {ownerName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 truncate max-w-[160px]">
                            {ownerName}
                          </span>
                        )}
                        {dateMode === "separate" && item.startDate && item.endDate && (
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                            {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-200 shadow-2xs select-none">
                    {item.quantity} szt.
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      {/* Recap, Recaptcha & checkout button */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 select-none">{t("cart.orderDetails")}</h3>

        <div className="flex flex-col gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">{language === "pl" ? "Osoba" : "Customer"}:</span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[170px]" title={orderCustomer.firstName || orderCustomer.lastName ? `${orderCustomer.firstName} ${orderCustomer.lastName}` : ""}>
              {orderCustomer.firstName || orderCustomer.lastName ? `${orderCustomer.firstName} ${orderCustomer.lastName}` : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">{t("cart.email")}:</span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[170px]" title={orderCustomer.email}>
              {orderCustomer.email || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">{t("cart.studentIndex")}:</span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[170px]">{orderCustomer.index || "—"}</span>
          </div>

          {dateMode === "separate" ? (
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                {language === "pl" ? "Terminy rezerwacji:" : "Rental periods:"}
              </span>
              {Array.from(
                cart.reduce((map, i) => {
                  if (i.startDate && i.endDate) {
                    const k = `${new Date(i.startDate).toLocaleDateString()} → ${new Date(i.endDate).toLocaleDateString()}`;
                    map.set(k, (map.get(k) || 0) + i.quantity);
                  }
                  return map;
                }, new Map()).entries()
              ).map(([range, qty]) => (
                <div key={range} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{range}</span>
                  </div>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 font-extrabold">
                    {qty} szt.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                {orderDates.startDate ? new Date(orderDates.startDate).toLocaleDateString() : "—"}{" "}
                →{" "}
                {orderDates.endDate ? new Date(orderDates.endDate).toLocaleDateString() : "—"}
              </span>
            </div>
          )}
        </div>

        {/* Bot / Human verification - only if key configured */}
        {recaptchaKey && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">{t("cart.verification")}</span>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 flex justify-center scale-90 sm:scale-100 origin-center shadow-inner">
              <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaKey} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={handleCheckout}
            disabled={loading || !canCheckout}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("cart.placingOrder")}
              </span>
            ) : (
              <span>{t("cart.placeOrder")}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCheckoutStep(1)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition duration-100 cursor-pointer text-center"
          >
            {language === "pl" ? "← Wstecz do koszyka" : "← Back to cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartStepForm;

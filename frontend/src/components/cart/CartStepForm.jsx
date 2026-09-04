import React from "react";
import { User } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

const CartStepForm = ({
  orderCustomer,
  handleCustomerChange,
  cart,
  orderDates,
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
    "text-xs border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition w-full shadow-xs";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_360px] items-start w-full">
      {/* LEFT – Customer Form & Items Recap */}
      <div className="flex flex-col gap-6 min-w-0">
        {/* Customer Details Form */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-4 flex items-center gap-2 select-none border-b border-slate-100 dark:border-slate-800/85 pb-3">
            <User className="w-4.5 h-4.5 text-indigo-500" />
            {t("cart.customerInfo")}
          </h3>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.firstName")}
                <input name="firstName" value={orderCustomer.firstName} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. Jan" : "e.g. John"} required />
              </label>
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.lastName")}
                <input name="lastName" value={orderCustomer.lastName} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. Kowalski" : "e.g. Doe"} required />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.phoneNumber")}
                <input name="phoneNumber" value={orderCustomer.phoneNumber} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. 500600700" : "e.g. 500600700"} required />
              </label>
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.email")}
                <input name="email" type="email" value={orderCustomer.email} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. student@uczelnia.pl" : "e.g. student@university.edu"} required />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.studentIndex")}
                <input name="index" value={orderCustomer.index} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. 123456" : "e.g. 123456"} required />
              </label>
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t("cart.fieldOfStudy")}
                <input name="fieldOfStudy" value={orderCustomer.fieldOfStudy} onChange={handleCustomerChange} className={inputClass} placeholder={language === "pl" ? "np. Informatyka" : "e.g. Computer Science"} required />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
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
            </div>
            <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("cart.purpose")}
              <textarea
                name="purpose"
                value={orderCustomer.purpose}
                onChange={handleCustomerChange}
                rows={3}
                className="text-xs border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition w-full resize-none shadow-xs"
                placeholder={language === "pl" ? "Podaj cel rezerwacji / przeznaczenie wypożyczanego sprzętu..." : "Provide the purpose of the reservation / intended use of the rented equipment..."}
                required
              />
            </label>
          </div>
        </div>

        {/* Items Recap */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white border-b border-slate-105 dark:border-slate-800 pb-3 flex items-center gap-2 select-none">
            <span>📦</span> {language === "pl" ? "Przegląd rezerwowanych obiektów" : "Selected items review"}
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/85">
            {cart.map((item) => (
              <div key={item._id} className="py-2.5 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                <span className="font-mono font-extrabold text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-450 select-none">
                  {item.quantity} szt.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR – Recap, Recaptcha & checkout button */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-4 sticky top-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 select-none">{t("cart.orderDetails")}</h3>

        <div className="flex flex-col gap-3 text-xs font-semibold text-slate-650 dark:text-slate-350 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">{language === "pl" ? "Osoba" : "Customer"}:</span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]">
              {orderCustomer.firstName || orderCustomer.lastName ? `${orderCustomer.firstName} ${orderCustomer.lastName}` : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">{t("cart.email")}:</span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]" title={orderCustomer.email}>
              {orderCustomer.email || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">{t("cart.studentIndex")}:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{orderCustomer.index || "—"}</span>
          </div>

          <div className="text-[10px] leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 mt-1 font-mono">
            <span className="font-sans block font-bold text-slate-400 uppercase tracking-wider text-[8px] mb-1">{language === "pl" ? "Wybrany termin" : "Selected dates"}</span>
            <span>Pocz: {new Date(orderDates.startDate).toLocaleString()}</span>
            <span className="block mt-0.5">Koniec: {new Date(orderDates.endDate).toLocaleString()}</span>
          </div>
        </div>

        {/* Bot / Human verification */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider select-none">{t("cart.verification")}</span>
          {recaptchaKey ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 flex justify-center scale-90 sm:scale-100 origin-center shadow-inner">
              <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaKey} />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 p-3 text-[10px] text-amber-800 dark:text-amber-350 font-semibold select-none leading-relaxed italic">
              {t("cart.recaptchaNotConfigured")}
            </div>
          )}
        </div>

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

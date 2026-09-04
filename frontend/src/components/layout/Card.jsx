import React from "react";

/**
 * Standardowa karta/panel. Używaj do sekcji.
 */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

export default Card;

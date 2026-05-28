import React from "react";

/**
 * Standardowy nagłówek strony z tytułem, opisem i akcjami.
 */
const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
    <div>
      <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
    </div>
    {children && (
      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-center w-full md:w-auto">
        {children}
      </div>
    )}
  </div>
);

export default PageHeader;

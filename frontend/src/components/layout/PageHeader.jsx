import React from "react";

/**
 * Standardowy nagłówek strony z tytułem, opisem i akcjami.
 */
const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-6 gap-4">
    <div>
      <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
    </div>
    {children && (
      <div className="flex flex-row flex-wrap gap-2.5 items-center w-full lg:w-auto justify-start lg:justify-end">
        {children}
      </div>
    )}
  </div>
);

export default PageHeader;

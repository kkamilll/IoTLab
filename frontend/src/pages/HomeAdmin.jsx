import React, { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Outlet } from "react-router-dom";

const Admin = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const nextVal = !prev;
      localStorage.setItem("sidebarCollapsed", String(nextVal));
      return nextVal;
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">
      {/* Sidebar (fixed, doesn't take flow space) */}
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

      {/* Spacer that mirrors sidebar width – keeps main content from going under the sidebar */}
      <div
        className={`hidden md:block flex-shrink-0 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pt-14 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default Admin;

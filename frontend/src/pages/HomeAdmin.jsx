import React, { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { Outlet } from "react-router-dom";

const Admin = () => {
  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem("admin_nav_layout") || "horizontal";
  });

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

  const toggleLayoutMode = () => {
    setLayoutMode((prev) => {
      const nextVal = prev === "horizontal" ? "vertical" : "horizontal";
      localStorage.setItem("admin_nav_layout", nextVal);
      return nextVal;
    });
  };

  return (
    <div
      className={`min-h-screen bg-gray-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300 ${
        layoutMode === "vertical" ? "flex overflow-x-hidden" : "flex flex-col"
      }`}
    >
      {/* Navigation (horizontal topbar or vertical sidebar) */}
      <Sidebar
        layoutMode={layoutMode}
        toggleLayoutMode={toggleLayoutMode}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      {/* Spacer that mirrors sidebar width – only in vertical mode on desktop */}
      {layoutMode === "vertical" && (
        <div
          className={`hidden md:block flex-shrink-0 transition-all duration-300 ${
            isCollapsed ? "w-20" : "w-64"
          }`}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div
        className={`flex-1 min-w-0 ${
          layoutMode === "vertical"
            ? "overflow-y-auto overflow-x-hidden pt-14 md:pt-0"
            : "overflow-y-auto overflow-x-hidden"
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Admin;

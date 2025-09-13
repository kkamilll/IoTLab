import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const Admin = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 w-full md:ml-64 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};


export default Admin;

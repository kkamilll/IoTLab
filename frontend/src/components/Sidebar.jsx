import React, { useEffect, useState } from "react"; 
import { NavLink } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const menuItems = [
    {name:"Home Page", path: "/", isParent:true},
    {name:"Dashboard", path: "/admin-dashboard", isParent:true},
    {name:"Products", path: "/admin-dashboard/products", isParent:false},
    {name:"Categories", path: "/admin-dashboard/categories", isParent:false},
    {name:"Orders", path: "/admin-dashboard/orders", isParent:false},
    {name:"ReturnedOrders", path: "/admin-dashboard/ReturnedOrders", isParent:false},
    {name:"Users", path: "/admin-dashboard/users", isParent:false},
    {name:"Profile", path: "/admin-dashboard/profile", isParent:false},
    {name:"Notes", path: "/admin-dashboard/notes", isParent:false},
    {name:"Materials", path: "/admin-dashboard/materials", isParent:false},
  ];

  const customerItems = [
     {name:"Home Page", path: "/", isParent:true},
    {name:"Products", path: "/customer-dashboard", isParent:true},
    {name:"Orders", path: "/customer-dashboard/orders", isParent:false},
  ];

  const { user } = useAuth();
  const [menuLinks, setMenuLinks] = useState(customerItems);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === "admin" || user.role === "lecturer") setMenuLinks(menuItems);
  }, [user]);

  return (
    <>
      {/* Hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden flex flex-col justify-center items-center w-10 h-10 bg-blue-800 text-white rounded-md shadow-md gap-1 p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        <span
          className={`block h-0.5 w-6 bg-white transform transition duration-300 ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-white transition duration-300 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-white transform transition duration-300 ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 md:w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950 text-white shadow-lg z-40 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-center border-b border-blue-700">
          <span className="text-2xl font-extrabold tracking-wide drop-shadow-lg">
            IOTLAB
          </span>
        </div>

        <nav className="flex-grow overflow-y-auto mt-4">
          <ul className="space-y-2 px-4">
            {menuLinks.map((item) => (
              <li key={item.name}>
                <NavLink
                  end={item.isParent}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                      isActive ? "bg-blue-700 font-semibold shadow-md" : "hover:bg-blue-700/70"
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <span className="ml-2 text-lg">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-4">
          <NavLink
            to="/logout"
            className="flex items-center justify-center p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
            onClick={() => setIsOpen(false)}
          >
            Logout
          </NavLink>
        </div>

        <div className="border-t border-blue-700 p-4 text-center text-sm bg-blue-950/80">
          {user ? (
            <>
              <p className="font-semibold truncate">{user.name || user.email}</p>
              <p className="text-blue-300 capitalize">{user.role}</p>
            </>
          ) : (
            <p>Nie zalogowano</p>
          )}
        </div>
      </div>

      {/* Overlay */}
      {/* {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )} */}
    </>
  );
};

export default Sidebar;

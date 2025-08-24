import React, { useEffect, useState } from "react"; 
import { NavLink } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const menuItems = [
    {name:"Home Page", path: "/", isParent:true},
    {name:"Dashboard", path: "/admin-dashboard", isParent:true},
    {name:"Products", path: "/admin-dashboard/products", isParent:false},
    {name:"Orders", path: "/admin-dashboard/orders", isParent:false},
    {name:"ReturnedOrders", path: "/admin-dashboard/ReturnedOrders", isParent:false},
    {name:"Users", path: "/admin-dashboard/users", isParent:false},
    {name:"Profile", path: "/admin-dashboard/profile", isParent:false},
    {name:"Notes", path: "/admin-dashboard/notes", isParent:false},
     {name:"Categories", path: "/admin-dashboard/categories", isParent:false},
    {name:"Logout", path: "/logout", isParent:false},
  ];

  const customerItems = [
     {name:"Home Page", path: "/", isParent:true},
    {name:"Products", path: "/customer-dashboard", isParent:true},
    {name:"Orders", path: "/customer-dashboard/orders", isParent:false},
    {name:"Logout", path: "/logout", isParent:false},
  ];

  const { user } = useAuth();
  const [menuLinks, setMenuLinks] = useState(customerItems);
  const [isOpen, setIsOpen] = useState(false); // toggle sidebar on small screens

  useEffect(() => {
    if (user && user.role === "admin") {
      setMenuLinks(menuItems);
    }
  }, [user]);

  return (
    <>
      {/* Hamburger toggle button on small screens */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-blue-800 text-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {/* Simple hamburger icon */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950 text-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          w-64 md:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col
          z-40
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-blue-700">
          <span className="text-2xl font-extrabold tracking-wide drop-shadow-lg">
            Inventory MS
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
                    `flex items-center p-3 rounded-lg transition-colors duration-200
                    ${
                      isActive
                        ? "bg-blue-700 font-semibold shadow-md"
                        : "hover:bg-blue-700/70"
                    }`
                  }
                  onClick={() => setIsOpen(false)} // close sidebar on link click (small screens)
                >
                  <span className="ml-2 text-lg">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

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

      {/* Overlay to close sidebar when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;

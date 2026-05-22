import React, { useEffect, useState } from "react"; 
import { NavLink } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const menuItems = [
    {name:"Home Page", path: "/", isParent:true},
    {name:"Statistics", path: "/admin-dashboard", isParent:true},
    {name:"Objects", path: "/admin-dashboard/products", isParent:false},
    {name:"Categories", path: "/admin-dashboard/categories", isParent:false},
    {name:"Orders", path: "/admin-dashboard/orders", isParent:false},
    // {name:"Orders History", path: "/admin-dashboard/ReturnedOrders", isParent:false},
    {name:"Users", path: "/admin-dashboard/users", isParent:false},
    {name:"Profile", path: "/admin-dashboard/profile", isParent:false},
    {name:"Notes", path: "/admin-dashboard/notes", isParent:false},
    {name:"Slider", path: "/admin-dashboard/materials", isParent:false},
    {name:"Components", path: "/admin-dashboard/components", isParent:false},
    {name: "Templates", path: "/admin-dashboard/templates", isParent:false},
  ];

 const lecturerItems = menuItems.filter(
  item => item.name !== "Categories" && item.name !== "Slider" && item.name !== "Components" && item.name !== "Users" && item.name !== "Templates"
);

const customerItems = [
  {name:"Home Page", path: "/", isParent:true},
  {name:"Products", path: "/admin-dashboard", isParent:true},
  {name:"Orders", path: "/admin-dashboard/orders", isParent:false},
];

  const { user } = useAuth();
  const [menuLinks, setMenuLinks] = useState(customerItems);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user.role === "admin") {
      setMenuLinks(menuItems);
    } else if (user.role === "lecturer") {
      setMenuLinks(lecturerItems); 
    } else {
      setMenuLinks(customerItems);
    }
  }, [user]);

  return (
    <>
      {/* Hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden flex flex-col justify-center items-center w-10 h-10 bg-slate-900 border border-slate-800 text-white rounded-lg shadow-md gap-1 p-2 hover:bg-slate-800 transition"
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
        className={`fixed top-0 left-0 h-full w-64 md:w-64 bg-slate-900 border-r border-slate-800 text-slate-100 shadow-xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <span className="text-2xl font-black tracking-wider text-white bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            IOTLAB
          </span>
        </div>

        <nav className="flex-grow overflow-y-auto mt-6">
          <ul className="space-y-1.5 px-4">
            {menuLinks.map((item) => (
              <li key={item.name}>
                <NavLink
                  end={item.isParent}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                      isActive 
                        ? "bg-indigo-600/90 text-white font-semibold shadow-lg shadow-indigo-900/30" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-4">
          <NavLink
            to="/logout"
            className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-sm font-semibold transition-all duration-200"
            onClick={() => setIsOpen(false)}
          >
            Logout
          </NavLink>
        </div>

        <div className="border-t border-slate-800 p-4 text-center text-xs bg-slate-950/40">
          {user ? (
            <>
              <p className="font-semibold text-slate-200 truncate">{user.name || user.email}</p>
              <p className="text-slate-500 capitalize mt-0.5">{user.role}</p>
            </>
          ) : (
            <p className="text-slate-500">Not logged in</p>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;

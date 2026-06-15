import React, { useEffect, useState } from "react"; 
import { NavLink } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const Sidebar = () => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    {name:"Home Page", path: "/", isParent:true, translationKey: "nav.welcome"},
    {name:"Statistics", path: "/admin-dashboard", isParent:true, translationKey: "nav.statistics"},
    {name:"Objects", path: "/admin-dashboard/products", isParent:false, translationKey: "nav.objects"},
    {name:"Categories", path: "/admin-dashboard/categories", isParent:false, translationKey: "nav.categories"},
    {name:"Orders", path: "/admin-dashboard/orders", isParent:false, translationKey: "nav.orders"},
    {name:"Users", path: "/admin-dashboard/users", isParent:false, translationKey: "nav.users"},
    {name:"Profile", path: "/admin-dashboard/profile", isParent:false, translationKey: "nav.profile"},
    {name:"Notes", path: "/admin-dashboard/notes", isParent:false, translationKey: "nav.notes"},
    {name:"Slider", path: "/admin-dashboard/materials", isParent:false, translationKey: "nav.slider"},
    {name:"Components", path: "/admin-dashboard/components", isParent:false, translationKey: "nav.components"},
    {name: "Templates", path: "/admin-dashboard/templates", isParent:false, translationKey: "nav.templates"},
  ];

  const lecturerItems = menuItems.filter(
    item => item.name !== "Categories" && item.name !== "Slider" && item.name !== "Components" && item.name !== "Users" && item.name !== "Templates"
  );

  const customerItems = [
    {name:"Home Page", path: "/", isParent:true, translationKey: "nav.welcome"},
    {name:"Products", path: "/admin-dashboard", isParent:true, translationKey: "nav.objects"},
    {name:"Orders", path: "/admin-dashboard/orders", isParent:false, translationKey: "nav.orders"},
  ];

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
        className="fixed top-4 left-4 z-50 md:hidden flex flex-col justify-center items-center w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-lg shadow-md gap-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        <span
          className={`block h-0.5 w-6 bg-slate-800 dark:bg-white transform transition duration-300 ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-slate-800 dark:bg-white transition duration-300 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-slate-800 dark:bg-white transform transition duration-300 ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
          <span className="text-2xl font-black tracking-wider text-slate-900 dark:text-white bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
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
                        ? "bg-indigo-600 text-white font-semibold shadow-md dark:shadow-lg dark:shadow-indigo-900/30" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-950 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800/60"
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <span className="font-medium">{t(item.translationKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="mt-auto p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-2 text-xs font-semibold cursor-pointer bg-white dark:bg-slate-900"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              type="button"
            >
              {theme === "dark" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m14.071-5.071l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Light</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex-1 flex items-center rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 text-[11px] font-bold h-9">
              <button
                onClick={() => setLanguage("pl")}
                className={`flex-grow h-full text-center transition-colors cursor-pointer ${
                  language === "pl"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800"
                }`}
                type="button"
              >
                PL
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`flex-grow h-full text-center transition-colors cursor-pointer ${
                  language === "en"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800"
                }`}
                type="button"
              >
                EN
              </button>
            </div>
          </div>

          <NavLink
            to="/logout"
            className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-sm font-semibold transition-all duration-200"
            onClick={() => setIsOpen(false)}
          >
            {t("common.logout")}
          </NavLink>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 p-4 text-center text-xs bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 transition-colors duration-300">
          {user ? (
            <>
              <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{user.name || user.email}</p>
              <p className="text-slate-500 capitalize mt-0.5">{user.role}</p>
            </>
          ) : (
            <p className="text-slate-500">{t("common.notLoggedIn")}</p>
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

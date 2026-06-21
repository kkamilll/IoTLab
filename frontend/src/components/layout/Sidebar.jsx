import React, { useEffect, useState } from "react"; 
import { NavLink } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    {name:"Home Page", path: "/", isParent:true, translationKey: "nav.welcome", icon: "🏠"},
    {name:"Statistics", path: "/admin-dashboard", isParent:true, translationKey: "nav.statistics", icon: "📊"},
    {name:"Objects", path: "/admin-dashboard/products", isParent:false, translationKey: "nav.objects", icon: "📦"},
    {name:"Categories", path: "/admin-dashboard/categories", isParent:false, translationKey: "nav.categories", icon: "🏷️"},
    {name:"Orders", path: "/admin-dashboard/orders", isParent:false, translationKey: "nav.orders", icon: "📋"},
    {name:"Users", path: "/admin-dashboard/users", isParent:false, translationKey: "nav.users", icon: "👥"},
    {name:"Notifications", path: "/admin-dashboard/notifications", isParent:false, translationKey: "nav.notifications", icon: "🔔"},
    {name:"Profile", path: "/admin-dashboard/profile", isParent:false, translationKey: "nav.profile", icon: "👤"},
    {name:"Notes", path: "/admin-dashboard/notes", isParent:false, translationKey: "nav.notes", icon: "📝"},
    {name:"Slider", path: "/admin-dashboard/materials", isParent:false, translationKey: "nav.slider", icon: "📸"},
    {name:"Components", path: "/admin-dashboard/components", isParent:false, translationKey: "nav.components", icon: "📂"},
    {name: "Templates", path: "/admin-dashboard/templates", isParent:false, translationKey: "nav.templates", icon: "📧"},
  ];

  const lecturerItems = menuItems.filter(
    item => item.name !== "Categories" && item.name !== "Slider" && item.name !== "Components" && item.name !== "Users" && item.name !== "Templates"
  );

  const customerItems = [
    {name:"Home Page", path: "/", isParent:true, translationKey: "nav.welcome", icon: "🏠"},
    {name:"Products", path: "/admin-dashboard", isParent:true, translationKey: "nav.objects", icon: "📦"},
    {name:"Orders", path: "/admin-dashboard/orders", isParent:false, translationKey: "nav.orders", icon: "📋"},
    {name:"Notifications", path: "/admin-dashboard/notifications", isParent:false, translationKey: "nav.notifications", icon: "🔔"},
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
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xl z-40 flex flex-col transform transition-all duration-300 ease-in-out w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 relative">
          <span className="text-2xl font-black tracking-wider text-slate-900 dark:text-white bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
            {isCollapsed ? (
              <>
                <span className="hidden md:inline">IOT</span>
                <span className="inline md:hidden">IOTLAB</span>
              </>
            ) : (
              "IOTLAB"
            )}
          </span>

          {/* Desktop Collapse Button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-full shadow-md items-center justify-center cursor-pointer transition transform hover:scale-105"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            type="button"
          >
            {isCollapsed ? "▶" : "◀"}
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto overflow-x-hidden mt-6">
          <ul className={`space-y-1.5 ${isCollapsed ? "px-2" : "px-4"}`}>
            {menuLinks.map((item) => (
              <li key={item.name} className="relative group">
                <NavLink
                  end={item.isParent}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center py-2.5 rounded-xl transition-all duration-200 text-sm ${
                      isActive 
                        ? "bg-indigo-600 text-white font-semibold shadow-md dark:shadow-lg dark:shadow-indigo-900/30" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-950 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800/60"
                    } ${isCollapsed ? "md:justify-center md:px-2 px-4" : "px-4"}`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-lg flex-shrink-0" title={isCollapsed ? t(item.translationKey) : undefined}>
                    {item.icon}
                  </span>
                  <span className={`font-medium ml-3 transition-all ${isCollapsed ? "md:hidden" : ""}`}>
                    {t(item.translationKey)}
                  </span>
                </NavLink>

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="hidden md:block fixed left-20 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-950/90 text-white text-xs font-semibold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                    {t(item.translationKey)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className={`mt-auto flex flex-col gap-3 ${isCollapsed ? "md:p-2 p-4" : "p-4"}`}>
          {isCollapsed ? (
            <>
              {/* Desktop Collapsed View */}
              <div className="hidden md:flex flex-col gap-2.5 items-center">
                {/* Theme Toggle Button (Compact) */}
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-white dark:bg-slate-900"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  type="button"
                >
                  {theme === "dark" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m14.071-5.071l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

                {/* Language Toggle (Compact) */}
                <button
                  onClick={() => setLanguage(language === "pl" ? "en" : "pl")}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-white dark:bg-slate-900"
                  title={language === "pl" ? "Przełącz na angielski" : "Switch to Polish"}
                  type="button"
                >
                  {language.toUpperCase()}
                </button>

                {/* Logout Button (Compact) */}
                <NavLink
                  to="/logout"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                  title={t("common.logout")}
                >
                  <svg xmlns="http://www.w3.org/2500/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  </svg>
                </NavLink>
              </div>

              {/* Mobile Expanded View */}
              <div className="flex md:hidden flex-col gap-3">
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className={`border-t border-slate-200 dark:border-slate-800 text-center text-xs bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 transition-all duration-300 flex flex-col items-center justify-center min-h-[4rem] ${isCollapsed ? "md:p-2 p-4" : "p-4"}`}>
          {user ? (
            isCollapsed ? (
              <>
                {/* Desktop Collapsed Avatar */}
                <span className="hidden md:flex w-8 h-8 rounded-full bg-indigo-550/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold items-center justify-center border border-indigo-200/50 dark:border-indigo-800/40 text-[10px]" title={user.name || user.email}>
                  {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                </span>
                {/* Mobile Expanded Avatar Details */}
                <div className="flex md:hidden flex-col items-center justify-center w-full">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 truncate w-full">{user.name || user.email}</p>
                  <p className="text-slate-500 capitalize mt-0.5">{user.role}</p>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-700 dark:text-slate-200 truncate w-full">{user.name || user.email}</p>
                <p className="text-slate-500 capitalize mt-0.5">{user.role}</p>
              </>
            )
          ) : (
            isCollapsed ? (
              <>
                <p className="hidden md:block text-slate-500">👤</p>
                <p className="block md:hidden text-slate-500">{t("common.notLoggedIn")}</p>
              </>
            ) : (
              <p className="text-slate-500">{t("common.notLoggedIn")}</p>
            )
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

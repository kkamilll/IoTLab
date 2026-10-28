import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Home,
  BarChart3,
  Package,
  Tag,
  Layers,
  ClipboardList,
  Users,
  Bell,
  StickyNote,
  Image as ImageIcon,
  Mail,
  User as UserIcon,
  PanelLeft,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

const Sidebar = ({ isCollapsed, toggleCollapse, layoutMode = "horizontal", toggleLayoutMode }) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Logically organized: Overview -> Catalog/Inventory -> Operations & Management -> Settings/Profile
  const menuItems = [
    { name: "Home Page", path: "/", isParent: true, translationKey: "nav.welcome", icon: Home },
    { name: "Statistics", path: "/admin-dashboard", isParent: true, translationKey: "nav.statistics", icon: BarChart3 },
    { name: "Objects", path: "/admin-dashboard/products", isParent: false, translationKey: "nav.objects", icon: Package },
    { name: "Categories", path: "/admin-dashboard/categories", isParent: false, translationKey: "nav.categories", icon: Tag },
    { name: "Components", path: "/admin-dashboard/components", isParent: false, translationKey: "nav.components", icon: Layers },
    { name: "Orders", path: "/admin-dashboard/orders", isParent: false, translationKey: "nav.orders", icon: ClipboardList },
    { name: "Users", path: "/admin-dashboard/users", isParent: false, translationKey: "nav.users", icon: Users },
    { name: "Notifications", path: "/admin-dashboard/notifications", isParent: false, translationKey: "nav.notifications", icon: Bell },
    { name: "Notes", path: "/admin-dashboard/notes", isParent: false, translationKey: "nav.notes", icon: StickyNote },
    { name: "Slider", path: "/admin-dashboard/materials", isParent: false, translationKey: "nav.slider", icon: ImageIcon },
    { name: "Templates", path: "/admin-dashboard/templates", isParent: false, translationKey: "nav.templates", icon: Mail },
    { name: "Profile", path: "/admin-dashboard/profile", isParent: false, translationKey: "nav.profile", icon: UserIcon },
  ];

  const lecturerItems = menuItems.filter(
    (item) => item.name !== "Categories" && item.name !== "Slider" && item.name !== "Components" && item.name !== "Users" && item.name !== "Templates"
  );

  const customerItems = [
    { name: "Home Page", path: "/", isParent: true, translationKey: "nav.welcome", icon: Home },
    { name: "Products", path: "/admin-dashboard", isParent: true, translationKey: "nav.objects", icon: Package },
    { name: "Orders", path: "/admin-dashboard/orders", isParent: false, translationKey: "nav.orders", icon: ClipboardList },
    { name: "Notifications", path: "/admin-dashboard/notifications", isParent: false, translationKey: "nav.notifications", icon: Bell },
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

  // Helper to render icon safely
  const renderIcon = (IconComponent, className = "w-5 h-5 shrink-0") => {
    if (!IconComponent) return null;
    if (typeof IconComponent === "string") {
      return <span className="text-lg shrink-0">{IconComponent}</span>;
    }
    return <IconComponent className={className} />;
  };

  // -------------------------------------------------------------
  // HORIZONTAL LAYOUT (TOPBAR NAVBAR)
  // -------------------------------------------------------------
  if (layoutMode === "horizontal") {
    return (
      <>
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors duration-200">
          {/* Row 1: Brand Logo & Top Controls (h-16) */}
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Brand Logo */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Mobile hamburger button */}
              <button
                className="md:hidden flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition hover:bg-slate-200 dark:hover:bg-slate-750"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation"
                type="button"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo */}
              <NavLink to="/admin-dashboard" className="flex items-center group">
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-wider text-slate-900 dark:text-white bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 leading-none">
                    IOTLAB
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1 leading-none">
                    {user?.role === "admin" ? "Admin Panel" : user?.role === "lecturer" ? "Lecturer Panel" : "Lab System"}
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Right: Layout Switcher, Theme, Language, Profile, Logout */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Layout Switcher button (Horizontal -> Vertical) */}
              {toggleLayoutMode && (
                <button
                  type="button"
                  onClick={toggleLayoutMode}
                  title={language === "pl" ? "Przełącz na pionowy pasek boczny" : "Switch to vertical sidebar"}
                  className="hidden md:flex h-10 px-3 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer bg-white dark:bg-slate-900 shadow-2xs text-xs font-semibold"
                  aria-label="Switch to vertical sidebar"
                >
                  <PanelLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="hidden xl:inline">{language === "pl" ? "Pionowy" : "Vertical"}</span>
                </button>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer bg-white dark:bg-slate-900 shadow-2xs"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                type="button"
              >
                {theme === "dark" ? (
                  <Sun className="h-4.5 w-4.5 text-yellow-400" />
                ) : (
                  <Moon className="h-4.5 w-4.5 text-slate-600" />
                )}
              </button>

              {/* Language Toggle (PL / EN) */}
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950/60 text-[11px] font-bold h-10 shadow-2xs">
                <button
                  onClick={() => setLanguage("pl")}
                  className={`px-2.5 h-full transition cursor-pointer ${
                    language === "pl"
                      ? "bg-indigo-600 text-white font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  type="button"
                >
                  PL
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 h-full transition cursor-pointer ${
                    language === "en"
                      ? "bg-indigo-600 text-white font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  type="button"
                >
                  EN
                </button>
              </div>

              {/* User profile capsule */}
              {user && (
                <NavLink
                  to="/admin-dashboard/profile"
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition shadow-2xs"
                  title={user.name || user.email}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-300 dark:border-indigo-700 flex items-center justify-center shrink-0">
                    {user.profileImage ? (
                      <img
                        src={`${API_BASE}/uploads/users/${user.profileImage}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.classList.remove("hidden");
                          }
                        }}
                      />
                    ) : null}
                    <span className={`w-full h-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs ${user.profileImage ? "hidden" : ""}`}>
                      {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate leading-tight">
                      {user.name || user.email}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold capitalize leading-none">
                      {user.role}
                    </span>
                  </div>
                </NavLink>
              )}

              {/* Logout Button */}
              <NavLink
                to="/logout"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 text-xs font-bold transition shadow-2xs"
                title={t("common.logout")}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">{t("common.logout")}</span>
              </NavLink>
            </div>
          </div>

          {/* Row 2: Full-width Horizontal Navigation Bar distributed across the entire screen */}
          <nav className="hidden md:block w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 px-2 sm:px-3 lg:px-4 py-1.5 overflow-x-auto scrollbar-none">
            <ul className="flex items-center justify-between gap-1 w-full">
              {menuLinks.map((item) => (
                <li key={item.name} className="flex-1 min-w-0 flex items-center justify-center">
                  <NavLink
                    end={item.isParent}
                    to={item.path}
                    title={t(item.translationKey)}
                    className={({ isActive }) =>
                      `w-full flex items-center justify-center gap-1.5 py-2 px-1.5 lg:px-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 select-none cursor-pointer text-center group ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold"
                          : "text-slate-650 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-2xs"
                      }`
                    }
                  >
                    {renderIcon(item.icon, "w-5 h-5 shrink-0 transition-transform group-hover:scale-110")}
                    <span className="truncate">{t(item.translationKey)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* Overlay for mobile drawer */}
        {isOpen && (
          <div
            className="fixed inset-0 backdrop-blur-xs bg-slate-950/60 z-50 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer when hamburger clicked */}
        <div
          className={`fixed inset-y-0 left-0 h-screen w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
            isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
        >
          {/* Drawer Top Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-slate-900 dark:text-white bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 leading-none">
                IOTLAB
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1 leading-none">
                {user?.role === "admin" ? "Admin Panel" : user?.role === "lecturer" ? "Lecturer Panel" : "Lab System"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User profile capsule in drawer */}
          {user && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
              <NavLink
                to="/admin-dashboard/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-1 rounded-xl group transition"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-400/50 shadow-xs flex items-center justify-center shrink-0">
                  {user.profileImage ? (
                    <img
                      src={`${API_BASE}/uploads/users/${user.profileImage}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove("hidden");
                        }
                      }}
                    />
                  ) : null}
                  <span className={`w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm ${user.profileImage ? "hidden" : ""}`}>
                    {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {user.name || user.email}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                    {user.role}
                  </span>
                </div>
              </NavLink>
            </div>
          )}

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-1">
            <ul className="space-y-1">
              {menuLinks.map((item) => (
                <li key={item.name}>
                  <NavLink
                    end={item.isParent}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold"
                          : "text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {renderIcon(item.icon, "w-5 h-5 shrink-0")}
                    <span className="truncate">{t(item.translationKey)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Drawer footer controls */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 shrink-0 bg-white dark:bg-slate-900">
            {/* Quick action buttons row: Theme + Language */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 h-9 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold cursor-pointer bg-slate-50/60 dark:bg-slate-950/40"
                type="button"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 text-yellow-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-slate-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>

              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/60 dark:bg-slate-950/40 text-[11px] font-bold h-9">
                <button
                  onClick={() => setLanguage("pl")}
                  className={`px-3 h-full transition cursor-pointer ${
                    language === "pl" ? "bg-indigo-600 text-white font-extrabold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  type="button"
                >
                  PL
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 h-full transition cursor-pointer ${
                    language === "en" ? "bg-indigo-600 text-white font-extrabold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  type="button"
                >
                  EN
                </button>
              </div>
            </div>

            {/* Layout switch button */}
            {toggleLayoutMode && (
              <button
                type="button"
                onClick={() => {
                  toggleLayoutMode();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                <PanelLeft className="w-4 h-4 text-slate-500" />
                <span>{language === "pl" ? "Przełącz na układ pionowy" : "Switch to vertical sidebar"}</span>
              </button>
            )}

            {/* Logout button */}
            <NavLink
              to="/logout"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 font-bold text-xs transition"
              onClick={() => setIsOpen(false)}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("common.logout")}</span>
            </NavLink>
          </div>
        </div>
      </>
    );
  }

  // -------------------------------------------------------------
  // VERTICAL LAYOUT (CLASSIC SIDEBAR)
  // -------------------------------------------------------------
  return (
    <>
      {/* Mobile Hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xl z-40 flex flex-col transform transition-all duration-300 ease-in-out w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none md:pointer-events-auto"} md:translate-x-0 ${isCollapsed ? "md:w-20" : "md:w-64"}`}
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
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
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
                        : "text-slate-650 dark:text-slate-400 hover:text-slate-950 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800/60"
                    } ${isCollapsed ? "md:justify-center md:px-2 px-4" : "px-4"}`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex-shrink-0" title={isCollapsed ? t(item.translationKey) : undefined}>
                    {renderIcon(item.icon, "w-5 h-5")}
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
                {/* Layout Switcher Button (Compact) */}
                {toggleLayoutMode && (
                  <button
                    onClick={toggleLayoutMode}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-white dark:bg-slate-900"
                    title={language === "pl" ? "Przełącz na układ poziomy" : "Switch to horizontal navbar"}
                    type="button"
                  >
                    <PanelLeft className="w-4.5 h-4.5 text-slate-650 dark:text-slate-350" />
                  </button>
                )}
                {/* Theme Toggle Button (Compact) */}
                <button
                  onClick={toggleTheme}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-white dark:bg-slate-900"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  type="button"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4.5 w-4.5 text-yellow-400" />
                  ) : (
                    <Moon className="h-4.5 w-4.5 text-slate-650" />
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
                  <LogOut className="h-4 w-4" />
                </NavLink>
              </div>

              {/* Mobile Expanded View */}
              <div className="flex md:hidden flex-col gap-3">
                <div className="flex items-center gap-2">
                  {/* Layout Switcher Button */}
                  {toggleLayoutMode && (
                    <button
                      onClick={toggleLayoutMode}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-white dark:bg-slate-900 shrink-0"
                      title={language === "pl" ? "Przełącz na układ poziomy" : "Switch to horizontal navbar"}
                      type="button"
                    >
                      <PanelLeft className="w-4 h-4 text-slate-650 dark:text-slate-350" />
                    </button>
                  )}

                  {/* Theme Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    className="flex-1 flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-2 text-xs font-semibold cursor-pointer bg-white dark:bg-slate-900"
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    type="button"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <span>Light</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 text-slate-650" />
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
                  <LogOut className="h-4 w-4 mr-1.5" />
                  {t("common.logout")}
                </NavLink>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {/* Layout Switcher Button */}
                {toggleLayoutMode && (
                  <button
                    onClick={toggleLayoutMode}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-white dark:bg-slate-900 shrink-0"
                    title={language === "pl" ? "Przełącz na układ poziomy" : "Switch to horizontal navbar"}
                    type="button"
                  >
                    <PanelLeft className="w-4 h-4 text-slate-650 dark:text-slate-350" />
                  </button>
                )}

                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-2 text-xs font-semibold cursor-pointer bg-white dark:bg-slate-900"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  type="button"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-slate-650" />
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
                className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-sm font-semibold transition-all duration-200 gap-1.5"
                onClick={() => setIsOpen(false)}
              >
                <LogOut className="h-4 w-4" />
                {t("common.logout")}
              </NavLink>
            </>
          )}
        </div>

        {/* User Card in Vertical Sidebar Bottom */}
        <div className={`border-t border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 transition-all duration-300 flex items-center justify-center min-h-[4rem] ${isCollapsed ? "md:p-2 p-3.5" : "p-3.5"}`}>
          {user ? (
            isCollapsed ? (
              <>
                {/* Desktop Collapsed Avatar */}
                <div className="hidden md:flex w-9 h-9 rounded-full overflow-hidden items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs flex-shrink-0" title={user.name || user.email}>
                  {user.profileImage ? (
                    <img
                      src={`${API_BASE}/uploads/users/${user.profileImage}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove("hidden");
                        }
                      }}
                    />
                  ) : null}
                  <span className={`w-full h-full bg-indigo-550/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[11px] ${user.profileImage ? "hidden" : ""}`}>
                    {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                {/* Mobile Expanded Avatar Details */}
                <div className="flex md:hidden items-center gap-3 w-full">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {user.profileImage ? (
                      <img
                        src={`${API_BASE}/uploads/users/${user.profileImage}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.classList.remove("hidden");
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ${user.profileImage ? "hidden" : ""}`}>
                      {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{user.name || user.email}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {user.profileImage ? (
                    <img
                      src={`${API_BASE}/uploads/users/${user.profileImage}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.classList.remove("hidden");
                        }
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ${user.profileImage ? "hidden" : ""}`}>
                    {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{user.name || user.email}</p>
                  <p className="text-[10px] text-slate-400 capitalize font-medium">{user.role}</p>
                </div>
              </div>
            )
          ) : (
            isCollapsed ? (
              <>
                <p className="hidden md:block text-slate-500">👤</p>
                <p className="block md:hidden text-slate-500 text-center">{t("common.notLoggedIn")}</p>
              </>
            ) : (
              <p className="text-slate-500 text-center">{t("common.notLoggedIn")}</p>
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

import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useLanguage } from "../../context/LanguageContext";
import Btn from "../layout/Btn";

const ActionMenu = ({ user, onEdit, onDelete, loadingId }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef();
  const menuRef = useRef();
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = 80;
    const menuWidth = 140;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = menuHeight > spaceBelow;

    setCoords({
      top: showAbove ? rect.top + window.scrollY - menuHeight : rect.bottom + window.scrollY,
      left: rect.left + window.scrollX - menuWidth + rect.width
    });

    setOpen(prev => !prev);
  };

  return (
    <div className="relative">
      <div className="hidden md:flex justify-center gap-2">
        <Btn onClick={() => onEdit(user)} variant="primary" size="sm">
          {t("common.edit")}
        </Btn>
        <Btn
          onClick={() => onDelete(user._id)}
          disabled={loadingId === user._id}
          variant="danger"
          size="sm"
        >
          {loadingId === user._id ? (language === "pl" ? "Usuwanie..." : "Deleting...") : t("common.delete")}
        </Btn>
      </div>

      <div className="md:hidden relative flex justify-center">
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-full transition-all duration-200 cursor-pointer font-bold"
        >
          ⋮
        </button>
        {open && ReactDOM.createPortal(
          <div ref={menuRef} className="absolute bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-1.5 flex flex-col gap-1 z-[9999]"
            style={{ top: coords.top, left: coords.left, width: '140px' }}
          >
            <button onClick={() => { onEdit(user); setOpen(false); }} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer">{t("common.edit")}</button>
            <button onClick={() => { onDelete(user._id); setOpen(false); }} disabled={loadingId === user._id} className={`px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer ${loadingId === user._id ? "opacity-50 cursor-not-allowed" : ""}`}>
              {loadingId === user._id ? (language === "pl" ? "Usuwanie..." : "Deleting...") : t("common.delete")}
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default ActionMenu;

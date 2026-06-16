import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useLanguage } from "../../context/LanguageContext";

const LabRoomsDropdown = ({ rooms }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef();
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const { language } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = rooms.length * 32 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = dropdownHeight > spaceBelow;
    setCoords({
      top: showAbove ? rect.top + window.scrollY - dropdownHeight : rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setOpen(prev => !prev);
  };

  return (
    <>
      <button ref={buttonRef} onClick={toggleDropdown} className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 px-2 py-1 rounded-xl text-sm hover:bg-blue-300 dark:hover:bg-blue-800">
        {language === "pl" ? "POKOJE ▼" : "ALL LABS ▼"}
      </button>
      {open && ReactDOM.createPortal(
        <div
          className="absolute bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-800 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-[9999]"
          style={{ top: coords.top, left: coords.left, minWidth: "120px" }}
        >
          {rooms.map((room, i) => (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-xl text-sm font-semibold whitespace-nowrap">{room}</span>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default LabRoomsDropdown;

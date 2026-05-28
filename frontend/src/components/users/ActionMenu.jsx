import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

const ActionMenu = ({ user, onEdit, onDelete, loadingId }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef();
  const menuRef = useRef();
  const [coords, setCoords] = useState({ top: 0, left: 0 });

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
        <button onClick={() => onEdit(user)} className="bg-blue-600 text-white px-3 py-1 rounded-xl hover:bg-blue-700">Edit</button>
        <button onClick={() => onDelete(user._id)} disabled={loadingId === user._id} className={`px-3 py-1 rounded-xl text-white ${loadingId === user._id ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
          {loadingId === user._id ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="md:hidden relative">
        <button ref={buttonRef} onClick={toggleMenu} className="px-2 py-1 bg-gray-300 rounded-xl">⋮</button>
        {open && ReactDOM.createPortal(
          <div ref={menuRef} className="absolute bg-white border border-gray-300 rounded-xl shadow-lg p-2 flex flex-col gap-1 z-[9999]"
            style={{ top: coords.top, left: coords.left, width: '140px' }}
          >
            <button onClick={() => { onEdit(user); setOpen(false); }} className="px-3 py-1 hover:bg-blue-100 rounded">Edit</button>
            <button onClick={() => { onDelete(user._id); setOpen(false); }} disabled={loadingId === user._id} className={`px-3 py-1 rounded ${loadingId === user._id ? "bg-red-300 cursor-not-allowed" : "hover:bg-red-100"}`}>
              {loadingId === user._id ? "Deleting..." : "Delete"}
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default ActionMenu;

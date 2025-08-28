import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MainMenu = ({ categoryTree }) => {
  const navigate = useNavigate();
  const [openIds, setOpenIds] = useState(new Set());

  const goToCategory = (id) => navigate(`/guest-products/${id}`);

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  const handleClick = (category) => {
    // if (category.children && category.children.length > 0) {
    //   toggleOpen(category._id);
    // } else {
    //   goToCategory(category._id);
    // }
    goToCategory(category.name);
  };

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isOpen = openIds.has(category._id);

    return (
      <div
        key={category._id}
        className="relative w-full md:w-auto"
        onMouseEnter={() => window.innerWidth >= 768 && hasChildren && setOpenIds((prev) => new Set([...prev, category._id]))}
        onMouseLeave={() => window.innerWidth >= 768 && hasChildren && setOpenIds((prev) => { const copy = new Set(prev); copy.delete(category._id); return copy; })}
      >
        {/* Klikalny box */}
        <div
          onClick={() => handleClick(category)}
          className={`cursor-pointer p-4 rounded-xl transition-all duration-300 transform hover:scale-105
            ${isOpen ? "bg-gradient-to-r from-blue-400 to-indigo-500 text-white" : "bg-white text-gray-800"}
            font-bold flex items-center justify-between md:justify-center mb-2 shadow-lg
          `}
          style={{ minWidth: "180px", minHeight: "80px" }}
        >
          {category.name}
          {/* Ikona rozwijania na mobile */}
          {hasChildren && (
            <span className="md:hidden ml-2">{isOpen ? "−" : "+"}</span>
          )}
        </div>

        {/* Submenu */}
        {hasChildren && isOpen && (
          <div
            className={`md:absolute md:top-0 md:left-full md:ml-2 p-4 bg-gray-50 rounded-xl shadow-lg
              flex flex-col gap-2 min-w-[200px] z-50
              ${level === 0 ? "w-full md:w-auto" : ""}
            `}
          >
            {category.children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-6 p-6 bg-gray-100">
      {Object.values(categoryTree).flat().map((category) => renderCategory(category))}
    </div>
  );
};

export default MainMenu;

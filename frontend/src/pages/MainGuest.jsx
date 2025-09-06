import React, { useEffect, useState, useMemo } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFolder } from "react-icons/fa";
import { buildTree } from "../utils/categoryUtils";

const MainGuest = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [openIds, setOpenIds] = useState(new Set());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:3500/categories/public");
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const normalizedCategories = useMemo(
    () =>
      (categories || []).map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        description: c.description,
        parent: c.parent?._id?.toString() || null,
      })),
    [categories]
  );

  const categoryTree = useMemo(() => buildTree(normalizedCategories), [normalizedCategories]);

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isOpen = openIds.has(category._id);

    const gradients = [
      "from-blue-100 via-blue-200 to-blue-300",
      "from-blue-200 via-blue-300 to-blue-400",
      "from-blue-300 via-blue-400 to-blue-500",
      "from-blue-400 via-blue-500 to-blue-600",
    ];
    const gradient = gradients[level % gradients.length];

    return (
      <div key={category._id} className="mb-3 w-full">
        <div
          className={`p-4 rounded-xl shadow-md flex flex-col transition-transform transform
            text-gray-900 hover:scale-105 hover:shadow-lg bg-gradient-to-br ${gradient} break-words`}
          style={{ paddingLeft: 16 + level * 16, paddingRight: 16, maxWidth: '100%' }}
        >
          <div className="flex justify-between items-center w-full">
            <div
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => navigate(`/guest-products/${category._id}`)}
            >
              <FaFolder size={18} className="text-blue-700 flex-shrink-0" />
              <span className="font-medium text-base sm:text-lg truncate">{category.name}</span>
            </div>
            {hasChildren && (
              <button
                className="ml-2 px-6 p-1 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition-colors font-bold flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOpen(category._id);
                }}
              >
                {isOpen ? "−" : "+"}
              </button>
            )}
          </div>

          {hasChildren && isOpen && (
            <div className="mt-2 border-l-2 border-blue-300 w-full">
              {category.children.map((child) => renderCategory(child, level + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl">
        {/* Przycisk powrotu */}
        <div className="mb-6 text-left">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Powrót
          </button>
        </div>

        <h1 className="text-3xl font-extrabold mb-8 text-blue-900 text-center">Kategorie</h1>
        {categoryTree.length > 0 ? (
          <div className="flex flex-col gap-3 w-full">
            {Object.values(categoryTree).flat().map((category) => renderCategory(category))}
          </div>
        ) : (
          <p className="text-blue-700 text-center">Loading categories...</p>
        )}
      </div>
    </div>
  );
};

export default MainGuest;

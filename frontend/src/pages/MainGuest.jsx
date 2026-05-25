import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { FaFolder, FaInfoCircle } from "react-icons/fa";
import { buildTree } from "../utils/categoryUtils";

const MainGuest = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showDescriptionIds, setShowDescriptionIds] = useState(new Set());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get("/categories/public");
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
    [categories],
  );

  const categoryTree = useMemo(
    () => buildTree(normalizedCategories),
    [normalizedCategories],
  );

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const toggleDescription = (id) => {
    setShowDescriptionIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const flattenTreeNonRecursive = (nodes) => {
    let result = [];
    let stack = nodes.map((node) => ({ ...node, level: 0 }));
    while (stack.length) {
      const current = stack.shift();
      result.push(current);
      if (
        current.children &&
        current.children.length > 0 &&
        expandedIds.has(current._id)
      ) {
        const childrenWithLevel = current.children.map((child) => ({
          ...child,
          level: current.level + 1,
        }));
        stack = [...childrenWithLevel, ...stack];
      }
    }
    return result;
  };

  const flatCategories = flattenTreeNonRecursive(categoryTree);

  const levelColors = [
    "bg-blue-50",
    "bg-blue-200",
    "bg-blue-300",
    "bg-blue-400",
    "bg-blue-500",
    "bg-blue-600",
    "bg-blue-700",
  ];

  const allCategory = {
    _id: "", // unique key
    name: "All",
    logo: <FaFolder size={16} className="text-blue-700 flex-shrink-0" />,
    description: null,
    children: [],
    level: 0,
  };

  const categoriesWithAll = [allCategory, ...flatCategories];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-3xl">
        {/* Back button */}
        <div className="mb-6 text-left">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back
          </button>
        </div>

        <h1 className="text-3xl font-extrabold mb-8 text-blue-900 text-center">
          Categories
        </h1>

        {categoriesWithAll.length > 0 ? (
          <div className="w-full flex flex-col gap-4">
            {categoriesWithAll.map((category) => {
              const hasChildren =
                category.children && category.children.length > 0;
              const isExpanded = expandedIds.has(category._id);
              const showDescription = showDescriptionIds.has(category._id);
              const colorClass =
                levelColors[category.level % levelColors.length];

              return (
                <div
                  key={category._id}
                  className={`w-full p-3 sm:p-4 rounded-xl shadow-md flex flex-col transition-transform transform hover:scale-105 hover:shadow-lg ${colorClass}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div
                      className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() =>
                        navigate(`/guest-products/${category._id}`)
                      }
                    >
                      <FaFolder
                        size={16}
                        className="text-blue-700 flex-shrink-0"
                      />
                      <span className="font-medium text-sm sm:text-base truncate">
                        {category.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {category.description && (
                        <button
                          className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm text-white bg-gray-600 hover:bg-gray-700 rounded-lg"
                          onClick={() => toggleDescription(category._id)}
                        >
                          <FaInfoCircle size={14} />
                        </button>
                      )}
                      {hasChildren && (
                        <button
                          className="px-3 py-1 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition-colors font-bold text-sm sm:text-base"
                          onClick={() => toggleExpand(category._id)}
                        >
                          {isExpanded ? "−" : "+"}
                        </button>
                      )}
                    </div>
                  </div>

                  {showDescription && category.description && (
                    <div className="mt-2 p-2 bg-white rounded-md shadow-inner text-gray-700 text-sm sm:text-base">
                      {category.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-blue-700 text-center">Loading categories...</p>
        )}
      </div>
    </div>
  );
};

export default MainGuest;

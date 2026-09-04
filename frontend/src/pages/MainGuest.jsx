import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { Folder, FolderOpen, Info, ArrowLeft, ChevronRight, LayoutGrid, Search, Layers } from "lucide-react";
import { buildTree } from "../utils/categoryUtils";
import { useLanguage } from "../context/LanguageContext";

/** Quick "Track your order" input bar for guest pages */
const TrackOrderBar = ({ language, navigate }) => {
  const [uuid, setUuid] = useState("");
  const handleGo = (e) => {
    e.preventDefault();
    const trimmed = uuid.trim();
    if (!trimmed) return;
    navigate(`/orderPreview/${trimmed}`);
  };
  return (
    <form
      onSubmit={handleGo}
      className="flex flex-col sm:flex-row gap-2 items-center max-w-md w-full z-10"
    >
      <input
        type="text"
        value={uuid}
        onChange={(e) => setUuid(e.target.value)}
        placeholder={language === "pl" ? "🔍 UUID zamówienia — śledź status..." : "🔍 Order UUID — track your order..."}
        className="flex-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-3 text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition shadow-sm"
      />
      <button
        type="submit"
        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 text-xs transition cursor-pointer shadow-sm whitespace-nowrap"
      >
        {language === "pl" ? "Śledź zamówienie" : "Track Order"}
      </button>
    </form>
  );
};

const MainGuest = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [expandedDescIds, setExpandedDescIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/categories/public");
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
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

  const toggleDescription = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedDescIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  // Filter categories for search (flattened search)
  const filteredTree = useMemo(() => {
    if (!searchTerm) return categoryTree;
    const lowerSearch = searchTerm.toLowerCase();
    
    // We want to return a flat list of matching categories when searching
    const matches = [];
    const searchRecursive = (nodes) => {
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(lowerSearch) || 
           (node.description && node.description.toLowerCase().includes(lowerSearch))) {
          matches.push(node);
        }
        if (node.children && node.children.length > 0) {
          searchRecursive(node.children);
        }
      }
    };
    searchRecursive(categoryTree);
    return matches; // Flat array when searching
  }, [categoryTree, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col gap-6 transition duration-200 relative overflow-hidden">
          {/* Decorative Background Blob */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-650 dark:text-indigo-400 select-none flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                {t("guest.subtitle") || "Katalog sprzętu"}
              </p>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {t("categories.title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
                {language === "pl" 
                  ? "Przeglądaj naszą strukturę katalogową, aby szybko znaleźć urządzenia, narzędzia i materiały, których potrzebujesz." 
                  : "Browse our catalog structure to quickly find the devices, tools, and materials you need."}
              </p>
            </div>
            
            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-105 dark:bg-slate-900 dark:hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition duration-100 cursor-pointer flex items-center gap-2 self-start flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-2 max-w-md w-full z-10">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder={language === "pl" ? "Szukaj kategorii..." : "Search categories..."}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 pl-10 pr-4 py-3 text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 hover:border-slate-350 dark:hover:border-slate-700 transition shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Track Order quick-access */}
          <TrackOrderBar language={language} navigate={navigate} />
        </div>

        {/* All Categories Banner */}
        {!searchTerm && !loading && (
          <div 
            onClick={() => navigate("/guest-products")}
            className="group rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                  {language === "pl" ? "Przeglądaj wszystkie produkty" : "Browse all products"}
                </h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {language === "pl" ? "Zobacz pełen asortyment bez podziału na kategorie." : "View the entire inventory without category filters."}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all duration-300 flex-shrink-0 ml-4 shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Categories Grid */}
        {loading ? (
          <div className="rounded-[1.8rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center text-slate-400 font-bold select-none shadow-sm">
            <svg className="animate-spin w-8 h-8 mx-auto mb-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {language === "pl" ? "Ładowanie kategorii..." : "Loading categories..."}
          </div>
        ) : filteredTree.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTree.map((category) => {
              const hasSubcategories = !searchTerm && category.children && category.children.length > 0;
              const showDescription = expandedDescIds.has(category._id);
              
              return (
                <div
                  key={category._id}
                  className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 overflow-hidden flex flex-col h-full"
                >
                  <div 
                    className="flex flex-col p-6 cursor-pointer flex-1 relative"
                    onClick={() => navigate(`/guest-products/${category._id}`)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 shadow-sm">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {category.description && (
                          <button
                            type="button"
                            onClick={(e) => toggleDescription(category._id, e)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              showDescription 
                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400" 
                                : "bg-slate-50 dark:bg-slate-800/50 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                            }`}
                            title={language === "pl" ? "Pokaż opis" : "Show description"}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                        <div className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-extrabold text-lg text-slate-850 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                      {language === "en" && category.nameEn ? category.nameEn : category.name}
                    </h3>
                    
                    {showDescription && (language === "en" ? category.descriptionEn || category.description : category.description) && (
                      <div className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-850 animate-fadeIn">
                        {language === "en" && category.descriptionEn ? category.descriptionEn : category.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Subcategories Section */}
                  {hasSubcategories && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
                      <span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider block mb-2 select-none">
                        {language === "pl" ? "Podkategorie" : "Subcategories"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {category.children.slice(0, expandedDescIds.has(`sub_${category._id}`) || category.children.length <= 5 ? category.children.length : 4).map(sub => (
                          <button
                            key={sub._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/guest-products/${sub._id}`);
                            }}
                            className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-650 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition duration-100 cursor-pointer shadow-xs"
                          >
                             <FolderOpen className="w-3.5 h-3.5 opacity-60" />
                             {language === "en" && sub.nameEn ? sub.nameEn : sub.name}
                          </button>
                        ))}
                        {category.children.length > 5 && !expandedDescIds.has(`sub_${category._id}`) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescription(`sub_${category._id}`);
                            }}
                            className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/40 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg text-[10px] font-black transition duration-100 cursor-pointer shadow-xs"
                          >
                            +{category.children.length - 4} {language === "pl" ? "więcej" : "more"}
                          </button>
                        )}
                        {category.children.length > 5 && expandedDescIds.has(`sub_${category._id}`) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescription(`sub_${category._id}`);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 px-3 py-1.5 rounded-lg text-[10px] font-black transition duration-100 cursor-pointer shadow-xs"
                          >
                            {language === "pl" ? "Zwiń" : "Show less"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.8rem] border border-dashed border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 p-16 text-center text-slate-450 dark:text-slate-505 font-semibold select-none flex flex-col items-center gap-3">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-700" />
            <p>{language === "pl" ? "Nie znaleziono kategorii pasujących do wyszukiwania." : "No categories found matching your search."}</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {language === "pl" ? "Wyczyść wyszukiwanie" : "Clear search"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainGuest;


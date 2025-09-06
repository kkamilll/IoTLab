import React from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function CategoryTable({ categoryTree, handleEdit, handleDelete, handleAdd }) {
  const renderRows = (category, depth = 0, isLast = true, prefix = "") => {
    const hasChildren = category.children && category.children.length > 0;
    const newPrefix = prefix + (isLast ? "    " : "│   ");

    return [
      <tr key={category._id} className="hover:bg-gray-50">
        {/* Name */}
        <td
          className="p-2 font-mono whitespace-pre max-w-[150px] md:max-w-xs truncate"
          title={category.name}
        >
          {prefix}{isLast ? "└─ " : "├─ "}{category.name}
        </td>

        {/* Visibility */}
        <td className="p-2 text-center">
          <span
            title={category.isVisible ? "Widoczna dla użytkowników" : "Ukryta"}
            className="inline-flex items-center justify-center"
          >
            {category.isVisible ? (
              <FaEye className="text-indigo-500 text-lg" aria-label="Widoczna" />
            ) : (
              <FaEyeSlash className="text-gray-400 text-lg" aria-label="Ukryta" />
            )}
          </span>
        </td>

        {/* Actions */}
        <td className="p-2 flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => handleAdd(category)}
            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Add
          </button>
          <button
            onClick={() => handleEdit(category)}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(category._id)}
            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Usuń
          </button>
        </td>
      </tr>,
      ...(hasChildren
        ? category.children.flatMap((child, idx) =>
            renderRows(child, depth + 1, idx === category.children.length - 1, newPrefix)
          )
        : [])
    ];
  };

  // Funkcja do renderowania płaskiej tabeli opisów kategorii
  const renderFlatDescriptions = (categories) => {
    return categories.map((category) => (
      <tr key={category._id} className="hover:bg-gray-50">
        <td className="p-2 font-mono truncate">{category.name}</td>
        <td className="p-2 text-gray-700 truncate">{category.description || "-"}</td>
      </tr>
    ));
  };

  // Spłaszczanie drzewa kategorii
  const flattenCategories = (categories) => {
    return categories.reduce((acc, cat) => {
      acc.push(cat);
      if (cat.children && cat.children.length > 0) {
        acc.push(...flattenCategories(cat.children));
      }
      return acc;
    }, []);
  };

  if (!categoryTree || categoryTree.length === 0) {
    return <div className="text-gray-500 text-center p-6">Brak kategorii</div>;
  }

  const flatCategories = flattenCategories(categoryTree);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 flex flex-col gap-8">
      {/* Główna tabela z akcjami i widocznością */}
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="w-full border border-gray-300 border-collapse table-auto md:table-fixed">
          <thead className="bg-blue-50 text-sm font-semibold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="border border-gray-300 p-3 text-left w-[150px] md:w-auto">Nazwa</th>
              <th className="border border-gray-300 p-3 text-center w-[80px] md:w-auto">Widoczność</th>
              <th className="border border-gray-300 p-3 text-center w-[120px] md:w-auto">Akcje</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {categoryTree.flatMap((root, idx) =>
              renderRows(root, 0, idx === categoryTree.length - 1)
            )}
          </tbody>
        </table>
      </div>

      {/* Płaska tabela opisów kategorii */}
      <div className="overflow-x-auto shadow-lg rounded-lg bg-white p-4">
        <h2 className="text-lg font-semibold mb-4">Lista kategorii</h2>
        <table className="w-full table-auto border-collapse border border-gray-200">
          <thead className="bg-gray-100 text-gray-700 text-left text-sm font-medium uppercase tracking-wide">
            <tr>
              <th className="border-b border-gray-200 p-3">Nazwa</th>
              <th className="border-b border-gray-200 p-3">Opis</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm">
            {renderFlatDescriptions(flatCategories)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

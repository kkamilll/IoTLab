import React from "react";

export default function CategoryTable({ categoryTree, handleEdit, handleDelete }) {
  const renderRows = (category, depth = 0, isLast = true, prefix = "") => {
    const hasChildren = category.children && category.children.length > 0;
    const newPrefix = prefix + (isLast ? "    " : "│   ");

    return [
      <tr key={category._id} className="hover:bg-gray-50">
        {/* Name */}
        <td className="p-2 font-mono whitespace-pre overflow-hidden text-ellipsis max-w-xs">
          {prefix}{isLast ? "└─ " : "├─ "}{category.name}
        </td>

        {/* Description */}
        <td className="p-2 overflow-hidden text-ellipsis max-w-sm" title={category.description}>
          {category.description || ""}
        </td>

        {/* Actions */}
        <td className="p-2 flex gap-2 justify-center">
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

  if (!categoryTree || categoryTree.length === 0) {
    return <div className="text-gray-500 text-center p-6">Brak kategorii</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-blue-50">
          <tr>
            <th className="border border-gray-300 p-3 text-left">Nazwa</th>
            <th className="border border-gray-300 p-3 text-left">Opis</th>
            <th className="border border-gray-300 p-3 text-center">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {categoryTree.flatMap((root, idx) => renderRows(root, 0, idx === categoryTree.length - 1))}
        </tbody>
      </table>
    </div>
  );
}

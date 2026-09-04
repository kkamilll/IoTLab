export function buildTree(categories) {
  const map = new Map();
  const roots = [];

  categories.forEach(cat =>
    map.set(cat._id.toString(), {
      _id: cat._id.toString(),
      name: cat.name,
      description: cat.description || "",
      parent: cat.parent ? cat.parent.toString() : null,
      children: [],
      isVisible: cat.isVisible || false
    })
  );

  categories.forEach(cat => {
    const id = cat._id.toString();
    const parentId = cat.parent ? cat.parent.toString() : null;
    if (parentId) {
      const parent = map.get(parentId);
      if (parent) parent.children.push(map.get(id));
    } else {
      roots.push(map.get(id));
    }
  });

  const sortTree = nodes => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(n => n.children && sortTree(n.children));
  };
  sortTree(roots);

  return roots;
}

export function findParentChain(id, cats, acc = []) {
  const cat = cats.find(c => c._id.toString() === id);
  if (cat && cat.parent) {
    acc.push(cat.parent.toString());
    return findParentChain(cat.parent.toString(), cats, acc);
  }
  return acc;
}

export function findDescendants(id, cats) {
  const children = cats.filter(c => c.parent?.toString() === id.toString());
  let result = children.map(c => c._id.toString());
  for (const child of children) {
    result = [...result, ...findDescendants(child._id, cats)];
  }
  return result;
}

export const getDescendantCategoryIds = (catId, allCats) => {
  const children = allCats.filter(c => {
    const parentId = c.parent?._id || c.parent;
    return parentId === catId;
  }).map(c => c._id);
  let descendants = [...children];
  for (const childId of children) {
    descendants = [...descendants, ...getDescendantCategoryIds(childId, allCats)];
  }
  return descendants;
};

export const getCategoryDepth = (catId, allCats) => {
  let depth = 0;
  let current = allCats.find(c => c._id === catId);
  while (current && current.parent) {
    depth++;
    const parentId = current.parent._id || current.parent;
    current = allCats.find(c => c._id === parentId);
  }
  return depth;
};

export const getSortedHierarchicalCategories = (allCats) => {
  const roots = allCats.filter(c => !c.parent);
  const result = [];
  const traverse = (cat, depth) => {
    result.push({ ...cat, depth });
    const children = allCats.filter(c => {
      const pId = c.parent?._id || c.parent;
      return pId === cat._id;
    });
    children.forEach(child => traverse(child, depth + 1));
  };
  roots.forEach(root => traverse(root, 0));
  allCats.forEach(c => {
    if (!result.some(r => r._id === c._id)) {
      result.push({ ...c, depth: 0 });
    }
  });
  return result;
};

export const isCategoryVisible = (cat, allCats, expandedIds) => {
  let current = cat;
  while (current) {
    const parentVal = current.parent;
    if (!parentVal) break;
    const parentId = (parentVal._id || parentVal).toString();
    if (!expandedIds.includes(parentId)) {
      return false;
    }
    current = allCats.find(c => c._id.toString() === parentId);
  }
  return true;
};

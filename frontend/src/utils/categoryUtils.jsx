export function buildTree(categories) {
  const map = new Map();
  const roots = [];

  categories.forEach(cat =>
    map.set(cat._id.toString(), {
      _id: cat._id.toString(),
      name: cat.name,
      description: cat.description || "",
      parent: cat.parent ? cat.parent.toString() : null,
      children: []
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
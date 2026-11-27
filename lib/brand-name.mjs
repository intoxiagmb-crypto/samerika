/** Correct the company brand in stored display names, preserving other names. */
export function brandName(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/^\s*(?:semrika|samrika|samarika|sameerika|samerika)(?=\s*$|\s+power\b)/i, 'Samerika');
}

export function accountName(name, role) {
  return role === 'ADMIN' ? brandName(name) : name;
}

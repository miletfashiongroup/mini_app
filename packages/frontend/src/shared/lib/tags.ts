export const normalizeTag = (tag: string) => tag.replace(/^[#%]+/, '').trim();

export const formatTag = (tag: string) => {
  const clean = normalizeTag(tag);
  return clean ? `#${clean}` : '';
};

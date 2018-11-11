export const kebabCase = s =>
  s
    .replace(/([A-Z])/g, ' $1')
    .replace(/(\W+)/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

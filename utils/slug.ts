export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumerics with hyphen
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    .replace(/-{2,}/g, '-'); // Collapse consecutive hyphens
} 
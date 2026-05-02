export const apiBase = import.meta.env.VITE_API_BASE || "";

export const apiUrl = (path: string) => `${apiBase}${path}`;

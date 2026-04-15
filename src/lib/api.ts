export const apiBase = import.meta.env.DEV ? "http://localhost:3001" : "";

export const apiUrl = (path: string) => `${apiBase}${path}`;

export const apiBase = import.meta.env.DEV ? "http://localhost:3001" : "";

export const apiUrl = (path: string) => {
  // In development, use the local server
  if (import.meta.env.DEV) {
    return `${apiBase}${path}`;
  }
  
  // In production, use relative paths for Vercel serverless functions
  return path;
};
